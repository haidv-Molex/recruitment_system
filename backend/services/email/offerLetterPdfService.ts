import PDFDocument from "pdfkit";
import fs from "fs";
import { AppError } from "@middlewares/AppError";

export type OfferLetterPdfInput = {
  candidateName: string;
  position: string;
  startDate: string;
  templateId?: string;
  password: string;
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

function firstExistingPath(paths: string[]) {
  return paths.find((candidatePath) => fs.existsSync(candidatePath));
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

function drawInfoLine(
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  fonts: PdfFonts
) {
  document.font(fonts.bold).fontSize(9).fillColor("#475569").text(label, x, y, { width: 80 });
  document.font(fonts.regular).fontSize(9).fillColor("#0f172a").text(value, x + 84, y, { width: width - 84 });
  document.moveTo(x + 84, y + 12).lineTo(x + width, y + 12).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
}

function drawVietnamSection(
  document: PDFKit.PDFDocument,
  title: string,
  x: number,
  width: number,
  fonts: PdfFonts
) {
  document.moveDown(0.7);
  document.rect(x, document.y, width, 18).fill("#0f766e");
  document.font(fonts.bold).fontSize(9).fillColor("#ffffff").text(title, x + 8, document.y + 5, { width: width - 16 });
  document.moveDown(1.4);
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
  const isVietnam = input.templateId === "offer-letter-vietnam";
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

  if (isVietnam) {
    const offerDate = formatDate(optionalValue(input.offerDate, new Date().toISOString()));
    const salutation = optionalValue(input.salutation, "Mr./Ms.");
    const probationDays = optionalValue(input.probationDays, "60");
    const basicSalary = optionalValue(input.basicSalary, "__________");
    const basicSalaryText = optionalValue(input.basicSalaryText, "__________");

    document.y = 190;
    const columnWidth = (contentWidth - 18) / 2;
    drawInfoLine(document, "Date:", offerDate, contentLeft, document.y, columnWidth, fonts);
    drawInfoLine(document, "Name:", candidateName, contentLeft + columnWidth + 18, document.y, columnWidth, fonts);
    document.y += 22;
    drawInfoLine(document, "Date of birth:", formatDate(optionalValue(input.dateOfBirth)), contentLeft, document.y, columnWidth, fonts);
    drawInfoLine(document, "ID Number:", optionalValue(input.idNumber), contentLeft + columnWidth + 18, document.y, columnWidth, fonts);
    document.y += 22;
    drawInfoLine(document, "Date of issue:", formatDate(optionalValue(input.idIssueDate)), contentLeft, document.y, columnWidth, fonts);
    drawInfoLine(document, "Place of issue:", optionalValue(input.idIssuePlace), contentLeft + columnWidth + 18, document.y, columnWidth, fonts);
    document.y += 22;
    drawInfoLine(document, "Address:", optionalValue(input.address), contentLeft, document.y, contentWidth, fonts);
    document.y += 22;
    drawInfoLine(document, "Mobile:", optionalValue(input.mobile), contentLeft, document.y, columnWidth, fonts);
    drawInfoLine(document, "Email:", optionalValue(input.email), contentLeft + columnWidth + 18, document.y, columnWidth, fonts);

    document.y += 34;
    document.rect(contentLeft, document.y, contentWidth, 26).fill("#f0fdf4");
    document.font(fonts.bold).fontSize(11).fillColor("#0f766e").text("Subject: OFFER LETTER / THƯ MỜI LÀM VIỆC", contentLeft + 10, document.y + 7, { width: contentWidth - 20 });
    document.y += 44;

    document.font(fonts.bold).fontSize(11).fillColor("#0f172a").text(`Dear ${salutation} ${candidateName},`, contentLeft, document.y, { width: contentWidth });
    document.moveDown(0.8);
    drawParagraph(document, "Welcome you as a member of Molex Vietnam Co., Ltd - Hung Yen Branch (MXHY) by this offer letter with the following terms and conditions.", { width: contentWidth }, fonts.regular);
    drawParagraph(document, "Chúng tôi rất vui mừng chào đón bạn là thành viên của Công ty TNHH Molex Việt Nam - Chi Nhánh Hưng Yên (MXHY) bằng thư mời làm việc này với các điều khoản được nêu dưới đây.", { width: contentWidth }, fonts.regular);

    drawVietnamSection(document, "WORKING PLACE / ĐỊA ĐIỂM LÀM VIỆC", contentLeft, contentWidth, fonts);
    drawParagraph(document, "Main work location: Lot No. T8, 9 at Thang Long II Industrial Park, Duong Hao Ward, Hung Yen Province, Vietnam.", { width: contentWidth }, fonts.regular);
    drawParagraph(document, "Địa điểm làm việc chính: Lô Đất Số T8, 9 tại Khu Công Nghiệp Thăng Long II, Phường Đường Hào, Tỉnh Hưng Yên, Việt Nam.", { width: contentWidth }, fonts.regular);
    document.font(fonts.bold).fontSize(10).fillColor("#0f172a").text(`Department / Phòng: ${optionalValue(input.department)}`, contentLeft, document.y, { width: contentWidth });
    document.moveDown(0.4);
    document.text(`Job title / Chức danh: ${position}`, { width: contentWidth });

    drawVietnamSection(document, "START WORKING DATE / NGÀY BẮT ĐẦU LÀM VIỆC", contentLeft, contentWidth, fonts);
    document.font(fonts.bold).fontSize(11).fillColor("#0f172a").text(startDate, contentLeft, document.y, { width: contentWidth });

    drawVietnamSection(document, "OFFERED BASIC SALARY (GROSS) / LƯƠNG CƠ BẢN", contentLeft, contentWidth, fonts);
    drawParagraph(document, `The offered basic gross salary is ${basicSalary} VND (${basicSalaryText}) per month, excluding allowances and benefits as the company's policies, if any. It is paid on 5th monthly via individual bank account.`, { width: contentWidth }, fonts.regular);
    drawParagraph(document, `Tiền lương cơ bản là ${basicSalary} VND (${basicSalaryText}) một tháng, không bao gồm tiền trợ cấp và chế độ phúc lợi của công ty, nếu có. Tiền lương được trả qua tài khoản ngân hàng vào ngày 5 hàng tháng.`, { width: contentWidth }, fonts.regular);

    drawVietnamSection(document, "WORKING HOUR / THỜI GIAN LÀM VIỆC", contentLeft, contentWidth, fonts);
    drawParagraph(document, "The office hours from 8.00am to 4.30pm, including break-time, and working day from Monday to Friday, Saturday off as the company's business calendar.", { width: contentWidth }, fonts.regular);
    drawParagraph(document, "Thời gian làm việc từ 08:00 sáng đến 04:30 chiều, bao gồm thời gian nghỉ giải lao, ngày làm việc từ thứ Hai đến thứ Sáu, nghỉ thứ Bảy theo lịch làm việc của công ty.", { width: contentWidth }, fonts.regular);

    drawVietnamSection(document, "PROBATION & INTERNAL TRAINING / THỬ VIỆC & ĐÀO TẠO NỘI BỘ", contentLeft, contentWidth, fonts);
    drawParagraph(document, `You are asked to complete the period of ${probationDays} days including probation and internal training for new job standard and knowledge.`, { width: contentWidth }, fonts.regular);
    drawParagraph(document, `Bạn được yêu cầu hoàn thành thời gian thử việc và đào tạo nội bộ cho tiêu chuẩn và kiến thức công việc mới là ${probationDays} ngày kể từ ngày bắt đầu làm việc.`, { width: contentWidth }, fonts.regular);

    drawVietnamSection(document, "OTHER / KHÁC", contentLeft, contentWidth, fonts);
    drawParagraph(document, "All contents of this Offer Letter shall be kept private and confidential. Wish you every success in your future career in Molex Viet Nam!", { width: contentWidth }, fonts.regular);
    drawParagraph(document, "Mọi thông tin liên quan đến thư mời tuyển dụng này được bảo mật và giữ kín. Chúc bạn có sự nghiệp thành công tại Molex Việt Nam.", { width: contentWidth }, fonts.regular);

    document.moveDown(1.4);
    document.font(fonts.bold).fontSize(11).fillColor("#0f172a").text("Sincerely / Chân thành,", contentLeft + contentWidth - 220, document.y, { width: 220, align: "center" });
    document.moveDown(2.2);
    document.font(fonts.regular).fontSize(10).fillColor("#64748b").text("(Đã ký)", { width: 220, align: "center" });
    document.font(fonts.bold).fontSize(10).fillColor("#0f172a").text("HOÀNG THU HƯƠNG", { width: 220, align: "center" });
    document.font(fonts.regular).fontSize(8).fillColor("#64748b").text("Country Sr Manager, HR Vietnam\nQuản lý Cấp cao, Nhân sự Việt Nam", { width: 220, align: "center" });

    document.end();
    return result;
  }

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
