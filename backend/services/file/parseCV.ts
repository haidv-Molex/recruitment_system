import path from "path";
import { parseCVByVendor } from "@utilities/cvParseClient";
import { AppError } from "@middlewares/AppError";
import type {
  ParsedCV,
  ParsedCVEducation,
  ParsedCVLanguage,
  ParsedCVLinks,
  ParsedCVWorkExperience,
} from "@type/cv.d";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toNonEmptyString(item))
    .filter((item) => item.length > 0);
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function toNumberRecord(value: unknown): Record<string, number> {
  const record = toRecord(value);
  if (!record) {
    return {};
  }

  return Object.entries(record).reduce<Record<string, number>>((result, [key, item]) => {
    if (typeof item === "number" && Number.isFinite(item)) {
      result[key] = item;
    }

    return result;
  }, {});
}

function getLinks(value: unknown): ParsedCVLinks {
  const links = toRecord(value);

  return {
    github: toNonEmptyString(links?.github),
    linkedin: toNonEmptyString(links?.linkedin),
    portfolio: toNonEmptyString(links?.portfolio),
    other: toStringArray(links?.other),
  };
}

function formatDateRange(startValue: unknown, endValue: unknown, isCurrent = false): string {
  const start = toNonEmptyString(startValue);
  const end = isCurrent ? "Hiện tại" : toNonEmptyString(endValue);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end;
}

function buildEducationSummary(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  const educationItems = value
    .map((item) => {
      const education = toRecord(item);
      if (!education) {
        return "";
      }

      const title = [
        toNonEmptyString(education.institution),
        toNonEmptyString(education.degree),
        toNonEmptyString(education.field),
      ].filter((part) => part.length > 0).join(" | ");

      const period = formatDateRange(education.start_date, education.end_date);
      const periodText = period ? `(${period})` : "";

      return [title, periodText].filter((part) => part.length > 0).join(" ");
    })
    .filter((item) => item.length > 0);

  return educationItems.join("; ");
}

function getEducationDetails(value: unknown): ParsedCVEducation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const education = toRecord(item);
      if (!education) {
        return null;
      }

      return {
        institution: toNonEmptyString(education.institution),
        degree: toNonEmptyString(education.degree),
        field: toNonEmptyString(education.field),
        start_date: toNonEmptyString(education.start_date),
        end_date: toNonEmptyString(education.end_date),
      };
    })
    .filter((item): item is ParsedCVEducation => item !== null);
}

function getLanguageArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return toNonEmptyString(item);
      }

      const language = toRecord(item);
      if (!language) {
        return "";
      }

      return toNonEmptyString(language.language);
    })
    .filter((language) => language.length > 0);
}

function getLanguageDetails(value: unknown): ParsedCVLanguage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        const language = toNonEmptyString(item);
        return language ? { language, proficiency: "" } : null;
      }

      const language = toRecord(item);
      if (!language) {
        return null;
      }

      const languageName = toNonEmptyString(language.language);
      if (!languageName) {
        return null;
      }

      return {
        language: languageName,
        proficiency: toNonEmptyString(language.proficiency),
      };
    })
    .filter((item): item is ParsedCVLanguage => item !== null);
}

function buildWorkExperienceSummary(value: unknown): {
  currentPosition: string;
  fullSummary: string;
} {
  if (!Array.isArray(value)) {
    return {
      currentPosition: "",
      fullSummary: "",
    };
  }

  const summaries: string[] = [];
  let currentPosition = "";

  for (const item of value) {
    const experience = toRecord(item);
    if (!experience) {
      continue;
    }

    const title = toNonEmptyString(experience.title);
    const company = toNonEmptyString(experience.company);
    const isCurrent = experience.is_current === true;
    const period = formatDateRange(experience.start_date, experience.end_date, isCurrent);
    const responsibilities = toStringArray(experience.responsibilities).join(" ");

    const titleWithCompany = [title, company]
      .filter((part) => part.length > 0)
      .join(" @ ");
    const periodText = period ? `(${period})` : "";

    const summary = [titleWithCompany, periodText, responsibilities]
      .filter((part) => part.length > 0)
      .join(": ");

    if (summary) {
      summaries.push(summary);
    }

    if (!currentPosition && (isCurrent || summaries.length === 1)) {
      currentPosition = titleWithCompany;
    }
  }

  return {
    currentPosition,
    fullSummary: summaries.join(" ; "),
  };
}

function getWorkExperienceDetails(value: unknown): ParsedCVWorkExperience[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const experience = toRecord(item);
      if (!experience) {
        return null;
      }

      return {
        title: toNonEmptyString(experience.title),
        company: toNonEmptyString(experience.company),
        start_date: toNonEmptyString(experience.start_date),
        end_date: toNonEmptyString(experience.end_date),
        is_current: toBoolean(experience.is_current),
        responsibilities: toStringArray(experience.responsibilities),
      };
    })
    .filter((item): item is ParsedCVWorkExperience => item !== null);
}

export function mapCVParseResult(rawData: Record<string, unknown>): ParsedCV {
  const workExperience = buildWorkExperienceSummary(rawData.work_experience);

  return {
    name: toNonEmptyString(rawData.full_name),
    email: toNonEmptyString(rawData.email),
    phone: toNonEmptyString(rawData.phone),
    gender: toNonEmptyString(rawData.gender),
    summary: toNonEmptyString(rawData.summary),
    location: toNonEmptyString(rawData.location),
    links: getLinks(rawData.links),
    skills: toStringArray(rawData.skills),
    languages: getLanguageArray(rawData.languages),
    language_details: getLanguageDetails(rawData.languages),
    experience_years: rawData.years_of_experience == null ? "" : String(rawData.years_of_experience),
    education: buildEducationSummary(rawData.education),
    education_details: getEducationDetails(rawData.education),
    current_position: workExperience.currentPosition,
    work_experience: workExperience.fullSummary,
    work_experience_details: getWorkExperienceDetails(rawData.work_experience),
    references: toStringArray(rawData.references),
    national_id: toNonEmptyString(rawData.national_id),
    nationality: toNonEmptyString(rawData.nationality),
    date_of_birth: toNonEmptyString(rawData.date_of_birth),
    quality_grade: toNonEmptyString(rawData.quality_grade),
    certifications: toStringArray(rawData.certifications),
    detected_language: toNonEmptyString(rawData.detected_language),
    field_confidences: toNumberRecord(rawData.field_confidences),
    extraction_warnings: toStringArray(rawData.extraction_warnings),
  };
}

function validateFileType(filePath: string): void {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".pdf" && ext !== ".docx") {
    throw new AppError("Định dạng file không hỗ trợ. Chỉ hỗ trợ .pdf hoặc .docx", 400);
  }
}

async function parseCV(filePath: string): Promise<ParsedCV> {
  validateFileType(filePath);

  try {
    const rawData = await parseCVByVendor(filePath);
    return mapCVParseResult(rawData);
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }

    const networkCodes = new Set([
      "ECONNRESET",
      "ECONNABORTED",
      "ETIMEDOUT",
      "EAI_AGAIN",
      "ENOTFOUND",
      "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    ]);

    if (networkCodes.has(err?.code)) {
      throw new AppError(
        `Lỗi khi phân tích CV bằng CVParse API: ${err.message || err}. Vui lòng kiểm tra kết nối mạng/proxy (CVPARSE_USE_LOCAL_PROXY, HTTPS_PROXY/HTTP_PROXY) và TLS (CVPARSE_INSECURE_TLS).`,
        500
      );
    }

    throw new AppError(`Lỗi khi phân tích CV bằng CVParse API: ${err.message || err}`, 500);
  }
}

export default parseCV;
