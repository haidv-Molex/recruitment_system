import pdf from "pdf-parse";

export async function parsePdf(buffer: Buffer): Promise<pdf.Result> {
  return pdf(buffer);
}
