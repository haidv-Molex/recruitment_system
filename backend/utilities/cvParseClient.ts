import axios from "axios";
import type { AxiosProxyConfig, AxiosRequestConfig, AxiosResponse } from "axios";
import fs from "fs";
import FormData from "form-data";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";
import { AppError } from "@middlewares/AppError";

type CVParseSubmitResponse = {
  job_id?: string;
  status?: string;
  message?: string;
};

type CVParseJobStatusResponse = {
  job_id?: string;
  status?: string;
  error?: string | null;
};

type CVParseJobResultResponse = {
  job_id?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_POLL_TIMEOUT_MS = 45000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 2;

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getCVParseBaseUrl(): string {
  const baseUrl = process.env.CVPARSE_BASE_URL;
  if (!baseUrl) {
    throw new Error("Thiếu biến môi trường CVPARSE_BASE_URL");
  }

  return baseUrl.replace(/\/+$/, "");
}

function getCVParseApiKey(): string {
  const apiKey = process.env.CVPARSE_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu biến môi trường CVPARSE_API_KEY");
  }

  return apiKey;
}

function getAuthHeaders(): Record<string, string> {
  return {
    "x-api-key": getCVParseApiKey(),
  };
}

function shouldUseLocalProxyFallback(): boolean {
  return process.env.CVPARSE_USE_LOCAL_PROXY === "true";
}

function getProxyUrl(): string | undefined {
  if (shouldUseLocalProxyFallback()) {
    return "http://127.0.0.1:9000";
  }

  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
}

function toAxiosProxy(proxyUrl: string | undefined): AxiosProxyConfig | false {
  if (!proxyUrl) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(proxyUrl);
  } catch {
    return false;
  }

  const protocol = parsed.protocol.replace(":", "");
  const proxyConfig: AxiosProxyConfig = {
    protocol,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : protocol === "https" ? 443 : 80,
  };

  if (parsed.username || parsed.password) {
    proxyConfig.auth = {
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    };
  }

  return proxyConfig;
}

function shouldDisableTlsVerification(): boolean {
  return process.env.CVPARSE_INSECURE_TLS === "true";
}

function applyTlsEnvironment(): void {
  if (shouldDisableTlsVerification()) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}

function getRequestTimeout(): number {
  return parseIntegerEnv(process.env.CVPARSE_REQUEST_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS);
}

function getMaxRetries(): number {
  return parseIntegerEnv(process.env.CVPARSE_MAX_RETRIES, DEFAULT_MAX_RETRIES);
}

function isRetryableNetworkError(err: any): boolean {
  const retryableCodes = new Set([
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ENOTFOUND",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  ]);

  return retryableCodes.has(err?.code);
}

function getVendorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }

    if (typeof record.detail === "object" && record.detail !== null) {
      const detail = record.detail as Record<string, unknown>;
      if (typeof detail.message === "string") {
        return detail.message;
      }

      if (typeof detail.error === "string") {
        return detail.error;
      }
    }
  }

  return fallback;
}

async function requestWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
  const maxRetries = getMaxRetries();
  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
      return await requestFn();
    } catch (err: any) {
      lastError = err;
      if (!isRetryableNetworkError(err) || attempt === maxRetries) {
        throw err;
      }

      const backoffMs = 500 * Math.pow(2, attempt);
      await wait(backoffMs);
      attempt += 1;
    }
  }

  throw lastError;
}

function buildAxiosConfig(extraHeaders?: Record<string, string>): AxiosRequestConfig {
  const proxyUrl = getProxyUrl();
  const httpsAgent = proxyUrl
    ? new HttpsProxyAgent(proxyUrl)
    : new https.Agent({ rejectUnauthorized: !shouldDisableTlsVerification() });

  return {
    headers: {
      ...getAuthHeaders(),
      ...(extraHeaders || {}),
    },
    timeout: getRequestTimeout(),
    proxy: proxyUrl ? false : toAxiosProxy(proxyUrl),
    httpsAgent,
    validateStatus: () => true,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  };
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitParseJob(filePath: string): Promise<string> {
  const response = await requestWithRetry<AxiosResponse<CVParseSubmitResponse>>(() => {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    return axios.post<CVParseSubmitResponse>(
      `${getCVParseBaseUrl()}/api/v1/parse`,
      formData,
      buildAxiosConfig(formData.getHeaders())
    );
  });

  if (response.status !== 202 || !response.data?.job_id) {
    const message = getVendorMessage(response.data, "Không thể tạo parse job từ CVParse");
    throw new AppError(`CVParse API lỗi: ${message}`, response.status >= 400 ? response.status : 500);
  }

  return response.data.job_id;
}

async function pollJobUntilCompleted(jobId: string): Promise<void> {
  const timeoutMs = parseIntegerEnv(process.env.CVPARSE_POLL_TIMEOUT_MS, DEFAULT_POLL_TIMEOUT_MS);
  const intervalMs = parseIntegerEnv(process.env.CVPARSE_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await requestWithRetry<AxiosResponse<CVParseJobStatusResponse>>(() =>
      axios.get<CVParseJobStatusResponse>(
        `${getCVParseBaseUrl()}/api/v1/jobs/${jobId}`,
        buildAxiosConfig()
      )
    );

    if (response.status >= 400) {
      const message = getVendorMessage(response.data, "Không thể lấy trạng thái parse job");
      throw new AppError(`CVParse API lỗi: ${message}`, response.status);
    }

    const status = typeof response.data?.status === "string"
      ? response.data.status.toLowerCase()
      : "";

    if (status === "completed") {
      return;
    }

    if (status === "failed") {
      const message = typeof response.data?.error === "string"
        ? response.data.error
        : "Job parse thất bại";
      throw new Error(`CVParse job thất bại: ${message}`);
    }

    await wait(intervalMs);
  }

  throw new Error("CVParse parse job quá thời gian chờ");
}

async function getJobResult(jobId: string): Promise<Record<string, unknown>> {
  const response = await requestWithRetry<AxiosResponse<CVParseJobResultResponse>>(() =>
    axios.get<CVParseJobResultResponse>(
      `${getCVParseBaseUrl()}/api/v1/jobs/${jobId}/result`,
      buildAxiosConfig()
    )
  );

  if (response.status !== 200 || !response.data?.data || typeof response.data.data !== "object") {
    const message = getVendorMessage(response.data, "CVParse trả kết quả không hợp lệ");
    throw new AppError(`CVParse API lỗi: ${message}`, response.status >= 400 ? response.status : 500);
  }

  return response.data.data;
}

async function parseCVByVendor(filePath: string): Promise<Record<string, unknown>> {
  applyTlsEnvironment();

  const jobId = await submitParseJob(filePath);
  await pollJobUntilCompleted(jobId);
  return getJobResult(jobId);
}

export { parseCVByVendor };
