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

type PdfFonts = {
  regular: string;
  bold: string;
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

function registerPdfFonts(document: PDFKit.PDFDocument): PdfFonts {
  const regularFontPath = firstExistingPath([
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ]);
  const boldFontPath = firstExistingPath([
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  ]);

  if (regularFontPath && boldFontPath) {
    document.registerFont("OfferRegular", regularFontPath);
    document.registerFont("OfferBold", boldFontPath);
    return { regular: "OfferRegular", bold: "OfferBold" };
  }

  return { regular: "Helvetica", bold: "Helvetica-Bold" };
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

function drawParagraph(doc: PDFKit.PDFDocument, text: string, options?: PDFKit.Mixins.TextOptions, fontName = "Helvetica") {
  doc.font(fontName).fontSize(11).fillColor("#334155").text(text, {
    align: "justify",
    lineGap: 5,
    ...options,
  });
  doc.moveDown(0.9);
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
  if (input.templateId === "offer-letter-vietnam") {
    return buildPasswordFromDateOfBirth(input.dateOfBirth);
  }

  const password = optionalValue(input.password);
  if (!password) {
    throw new AppError("PDF password is required", 400);
  }

  if (password.length < 6) {
    throw new AppError("PDF password must be at least 6 characters", 400);
  }

  return password;
}

export async function generateProtectedOfferLetterPdf(input: OfferLetterPdfInput): Promise<Buffer> {
  const candidateName = input.candidateName.trim();
  const position = input.position.trim();
  const startDate = formatDate(input.startDate.trim());
  const password = resolveOfferLetterPdfPassword(input);

  if (!candidateName || !position || !startDate) {
    throw new AppError("Candidate name, position and start date are required", 400);
  }

  const isInternship = input.templateId === "offer-letter-internship";
  const isVietnam = input.templateId === "offer-letter-vietnam";

  if (isVietnam) {
    return renderVietnamOfferLetterPdf(input, candidateName, position, startDate, password);
  }

  const document = new PDFDocument({
    size: "A4",
    margins: { top: 54, left: 58, right: 58, bottom: 58 },
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
      Title: `Offer Letter - ${position}`,
      Author: "Molex Recruitment Team",
      Subject: `Offer Letter for ${candidateName}`,
    },
  });

  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const result = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  const pageWidth = document.page.width;
  const pageHeight = document.page.height;
  const contentLeft = 74;
  const contentWidth = pageWidth - contentLeft * 2;
  const fonts = registerPdfFonts(document);

  document.rect(0, 0, pageWidth, pageHeight).fill("#f8fafc");
  document.rect(34, 34, pageWidth - 68, pageHeight - 68).fill("#ffffff");
  document.rect(34, 34, pageWidth - 68, pageHeight - 68).lineWidth(1).strokeColor("#d1fae5").stroke();
  document.rect(34, 34, 10, pageHeight - 68).fill("#0f766e");
  document.circle(pageWidth - 72, 76, 30).fillOpacity(0.12).fill("#10b981").fillOpacity(1);

  document.fillColor("#0f766e").font(fonts.bold).fontSize(22).text("MOLEX", contentLeft, 62, {
    width: contentWidth,
    align: "left",
  });
  document.font(fonts.regular).fontSize(8).fillColor("#64748b").text("RECRUITMENT TEAM", contentLeft, 88, {
    characterSpacing: 1.6,
  });
  document.moveTo(contentLeft, 112).lineTo(pageWidth - contentLeft, 112).lineWidth(1.5).strokeColor("#99f6e4").stroke();

  document.font(fonts.bold).fontSize(20).fillColor("#0f172a").text("Offer Letter", contentLeft, 145, {
    width: contentWidth,
    align: "center",
  });
  document.font(fonts.regular).fontSize(10).fillColor("#64748b").text(new Date().toLocaleDateString("en-GB"), {
    width: contentWidth,
    align: "center",
  });

  document.y = 205;
  document.font(fonts.regular).fontSize(11).fillColor("#334155").text(`Dear ${candidateName},`, contentLeft, document.y, {
    width: contentWidth,
  });
  document.moveDown(1.2);

  if (isInternship) {
    drawParagraph(
      document,
      `Congratulations. We are pleased to offer you an internship opportunity as ${position} at Molex. We believe this internship will provide meaningful experience and a strong environment for professional growth.`,
      { width: contentWidth }
    );
    drawParagraph(
      document,
      `Your internship is expected to begin on ${startDate}. The HR team will contact you with onboarding details, schedule information and required documents.`,
      { width: contentWidth }
    );
  } else {
    drawParagraph(
      document,
      `We are pleased to offer you the position of ${position} at Molex. Your skills and experience stood out during our recruitment process, and we are excited about the contribution you can make to our team.`,
      { width: contentWidth }
    );
    drawParagraph(
      document,
      `Your expected start date is ${startDate}. The HR team will contact you with onboarding details, benefit information and required documents.`,
      { width: contentWidth }
    );
  }

  drawParagraph(
    document,
    "Please review this offer carefully and reply to confirm your acceptance or raise any questions. We look forward to welcoming you to Molex.",
    { width: contentWidth }
  );

  document.moveDown(1.6);
  document.font(fonts.regular).fontSize(11).fillColor("#334155").text("Best regards,", contentLeft, document.y, {
    width: contentWidth,
  });
  document.moveDown(0.6);
  document.font(fonts.bold).fontSize(12).fillColor("#0f766e").text("Molex Recruitment Team", {
    width: contentWidth,
  });

  const footerY = pageHeight - 92;
  document.moveTo(contentLeft, footerY).lineTo(pageWidth - contentLeft, footerY).lineWidth(1).strokeColor("#e2e8f0").stroke();
  document.font(fonts.regular).fontSize(8).fillColor("#94a3b8").text(
    "This document is password protected and intended only for the recipient named in this offer letter.",
    contentLeft,
    footerY + 16,
    { width: contentWidth, align: "center" }
  );

  document.end();
  return result;
}
