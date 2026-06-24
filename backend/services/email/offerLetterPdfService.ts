import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import puppeteer from "puppeteer-core";
import { AppError } from "@middlewares/AppError";

export type OfferLetterPdfInput = {
  candidateName: string;
  position: string;
  startDate: string;
  templateId?: string;
  password?: string;
  offerDate?: string;
  dateOfBirth?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuePlace?: string;
  address?: string;
  mobile?: string;
  email?: string;
  salutation?: string;
  department?: string;
  basicSalary?: string;
  basicSalaryText?: string;
  probationDays?: string;
};

type TemplateValues = Record<string, string>;

type RenderedPageImage = {
  image: Buffer;
  heightPoints: number;
};

const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const A4_VIEWPORT_WIDTH = 794;

function firstExistingPath(paths: string[]) {
  return paths.find((candidatePath) => fs.existsSync(candidatePath));
}

function getBrowserExecutablePath() {
  const configuredPath = process.env.PDF_BROWSER_PATH;
  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  return firstExistingPath([
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTemplate(html: string, values: TemplateValues) {
  return html.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => escapeHtml(values[key] || ""));
}

async function renderHtmlToPageImages(html: string): Promise<RenderedPageImage[]> {
  const executablePath = getBrowserExecutablePath();
  if (!executablePath) {
    throw new AppError("PDF browser renderer is not configured. Set PDF_BROWSER_PATH to Chrome or Edge executable.", 500);
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: A4_VIEWPORT_WIDTH, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pageElement = await page.$(".page");
    if (!pageElement) {
      throw new AppError("Offer letter HTML does not contain a .page element", 500);
    }

    const pageBox = await pageElement.boundingBox();
    if (!pageBox?.width || !pageBox.height) {
      throw new AppError("Unable to measure offer letter HTML page", 500);
    }

    const a4HeightCssPx = pageBox.width * (A4_HEIGHT_POINTS / A4_WIDTH_POINTS);
    const images: RenderedPageImage[] = [];

    for (let top = 0; top < pageBox.height; top += a4HeightCssPx) {
      const clipHeight = Math.min(a4HeightCssPx, pageBox.height - top);
      const image = Buffer.from(await page.screenshot({
        type: "png",
        omitBackground: false,
        clip: {
          x: pageBox.x,
          y: pageBox.y + top,
          width: pageBox.width,
          height: clipHeight,
        },
      }));

      images.push({
        image,
        heightPoints: Math.min(A4_HEIGHT_POINTS, A4_WIDTH_POINTS * (clipHeight / pageBox.width)),
      });
    }

    return images;
  } finally {
    await browser.close();
  }
}

async function pageImagesToEncryptedPdf(pages: RenderedPageImage[], password: string, title: string) {
  if (!pages.length) {
    throw new AppError("Unable to render offer letter pages for PDF", 500);
  }

  const document = new PDFDocument({
    autoFirstPage: false,
    size: "A4",
    margin: 0,
    userPassword: password,
    ownerPassword: process.env.OFFER_LETTER_PDF_OWNER_PASSWORD || `${password}-owner`,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
    info: {
      Title: title,
      Author: "Molex Recruitment Team",
    },
  });

  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const result = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  for (const page of pages) {
    document.addPage({ size: "A4", margin: 0 });
    document.rect(0, 0, A4_WIDTH_POINTS, A4_HEIGHT_POINTS).fill("#ffffff");
    document.image(page.image, 0, 0, { width: A4_WIDTH_POINTS, height: page.heightPoints });
  }

  document.end();
  return result;
}

async function renderVietnamOfferLetterPdf(input: OfferLetterPdfInput, candidateName: string, position: string, startDate: string, password: string) {
  const templatePath = path.join(process.cwd(), "utilities", "email", "offer-letter-vietnam.html");
  const html = await fsPromises.readFile(templatePath, "utf8");
  const offerDate = formatDate(optionalValue(input.offerDate, new Date().toISOString()));
  const values: TemplateValues = {
    offer_date: offerDate,
    candidate_name: candidateName,
    date_of_birth: formatDate(optionalValue(input.dateOfBirth)),
    id_number: optionalValue(input.idNumber),
    id_issue_date: formatDate(optionalValue(input.idIssueDate)),
    id_issue_place: optionalValue(input.idIssuePlace),
    address: optionalValue(input.address),
    mobile: optionalValue(input.mobile),
    email: optionalValue(input.email),
    salutation: optionalValue(input.salutation, "Mr./Ms."),
    department: optionalValue(input.department),
    position,
    start_date: startDate,
    basic_salary: optionalValue(input.basicSalary, "__________"),
    basic_salary_text: optionalValue(input.basicSalaryText, "__________"),
    probation_days: optionalValue(input.probationDays, "60"),
  };

  const renderedHtml = renderTemplate(html, values);
  const pageImages = await renderHtmlToPageImages(renderedHtml);
  return pageImagesToEncryptedPdf(pageImages, password, `Offer Letter - ${position}`);
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function optionalValue(value: string | undefined, fallback = "") {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function buildPasswordFromDateOfBirth(value: string | undefined) {
  const dateOfBirth = optionalValue(value);

  if (!dateOfBirth) {
    throw new AppError("Candidate date of birth is required to generate PDF password", 400);
  }

  const isoDateMatch = dateOfBirth.match(/^(\d{4})-(\d{2})(?:-\d{2})?(?:[T\s].*)?$/);
  if (isoDateMatch) {
    const month = Number(isoDateMatch[2]);
    if (month >= 1 && month <= 12) {
      return `${isoDateMatch[1]}${isoDateMatch[2]}`;
    }
  }

  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Candidate date of birth must be a valid date to generate PDF password", 400);
  }

  const year = String(parsedDate.getUTCFullYear()).padStart(4, "0");
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");

  if (!/^\d{4}$/.test(year)) {
    throw new AppError("Candidate date of birth must include a valid year to generate PDF password", 400);
  }

  return `${year}${month}`;
}

function resolveOfferLetterPdfPassword(input: OfferLetterPdfInput) {
  if (input.templateId !== "offer-letter-vietnam") {
    throw new AppError("Only Vietnam offer letter template is supported", 400);
  }

  return buildPasswordFromDateOfBirth(input.dateOfBirth);
}

export async function generateProtectedOfferLetterPdf(input: OfferLetterPdfInput): Promise<Buffer> {
  const candidateName = input.candidateName.trim();
  const position = input.position.trim();
  const startDate = formatDate(input.startDate.trim());
  const password = resolveOfferLetterPdfPassword(input);

  if (!candidateName || !position || !startDate) {
    throw new AppError("Candidate name, position and start date are required", 400);
  }

  return renderVietnamOfferLetterPdf(input, candidateName, position, startDate, password);
}
