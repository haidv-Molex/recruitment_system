import { CohereClientV2 } from "cohere-ai";
import axios from "axios";

async function axiosFetch(url: any, init?: any) {
  const requestUrl = typeof url === "string" ? url : (url.url || url.toString());
  const headers: Record<string, string> = {};
  if (init?.headers) {
    if (typeof init.headers.forEach === "function") {
      init.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  const response = await axios({
    url: requestUrl,
    method: init?.method || "GET",
    data: init?.body,
    headers,
    validateStatus: () => true,
    responseType: "text",
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    headers: {
      get: (name: string) => response.headers[name.toLowerCase()],
    },
    json: async () => JSON.parse(response.data),
    text: async () => response.data,
  } as any;
}

export function getCohereClient(): CohereClientV2 {
  // Auto-configure proxy for corporate Zscaler if on Windows and no proxy is set
  if (process.platform === "win32" && !process.env.HTTPS_PROXY && !process.env.HTTP_PROXY) {
    process.env.HTTPS_PROXY = "http://127.0.0.1:9000";
    process.env.HTTP_PROXY = "http://127.0.0.1:9000";
  }

  // Disable TLS check when proxy is configured to allow Zscaler decryption
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return new CohereClientV2({
    token: process.env.CO_API_KEY!,
    fetch: axiosFetch as any,
  });
}
