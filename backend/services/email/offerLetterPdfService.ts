import PDFDocument from "pdfkit";
import { AppError } from "@middlewares/AppError";

export type OfferLetterPdfInput = {
  candidateName: string;
  position: string;
  startDate: string;
  templateId?: string;
  password: string;
};

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

function drawParagraph(doc: PDFKit.PDFDocument, text: string, options?: PDFKit.Mixins.TextOptions) {
  doc.font("Helvetica").fontSize(11).fillColor("#334155").text(text, {
    align: "justify",
    lineGap: 5,
    ...options,
  });
  doc.moveDown(0.9);
}

export async function generateProtectedOfferLetterPdf(input: OfferLetterPdfInput): Promise<Buffer> {
  const candidateName = input.candidateName.trim();
  const position = input.position.trim();
  const startDate = formatDate(input.startDate.trim());
  const password = input.password.trim();

  if (!candidateName || !position || !startDate || !password) {
    throw new AppError("Candidate name, position, start date and PDF password are required", 400);
  }

  if (password.length < 6) {
    throw new AppError("PDF password must be at least 6 characters", 400);
  }

  const isInternship = input.templateId === "offer-letter-internship";
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

  document.rect(0, 0, pageWidth, pageHeight).fill("#f8fafc");
  document.rect(34, 34, pageWidth - 68, pageHeight - 68).fill("#ffffff");
  document.rect(34, 34, pageWidth - 68, pageHeight - 68).lineWidth(1).strokeColor("#d1fae5").stroke();
  document.rect(34, 34, 10, pageHeight - 68).fill("#0f766e");
  document.circle(pageWidth - 72, 76, 30).fillOpacity(0.12).fill("#10b981").fillOpacity(1);

  document.fillColor("#0f766e").font("Helvetica-Bold").fontSize(22).text("MOLEX", contentLeft, 62, {
    width: contentWidth,
    align: "left",
  });
  document.font("Helvetica").fontSize(8).fillColor("#64748b").text("RECRUITMENT TEAM", contentLeft, 88, {
    characterSpacing: 1.6,
  });
  document.moveTo(contentLeft, 112).lineTo(pageWidth - contentLeft, 112).lineWidth(1.5).strokeColor("#99f6e4").stroke();

  document.font("Helvetica-Bold").fontSize(20).fillColor("#0f172a").text("Offer Letter", contentLeft, 145, {
    width: contentWidth,
    align: "center",
  });
  document.font("Helvetica").fontSize(10).fillColor("#64748b").text(new Date().toLocaleDateString("en-GB"), {
    width: contentWidth,
    align: "center",
  });

  document.y = 205;
  document.font("Helvetica").fontSize(11).fillColor("#334155").text(`Dear ${candidateName},`, contentLeft, document.y, {
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
  document.font("Helvetica").fontSize(11).fillColor("#334155").text("Best regards,", contentLeft, document.y, {
    width: contentWidth,
  });
  document.moveDown(0.6);
  document.font("Helvetica-Bold").fontSize(12).fillColor("#0f766e").text("Molex Recruitment Team", {
    width: contentWidth,
  });

  const footerY = pageHeight - 92;
  document.moveTo(contentLeft, footerY).lineTo(pageWidth - contentLeft, footerY).lineWidth(1).strokeColor("#e2e8f0").stroke();
  document.font("Helvetica").fontSize(8).fillColor("#94a3b8").text(
    "This document is password protected and intended only for the recipient named in this offer letter.",
    contentLeft,
    footerY + 16,
    { width: contentWidth, align: "center" }
  );

  document.end();
  return result;
}
