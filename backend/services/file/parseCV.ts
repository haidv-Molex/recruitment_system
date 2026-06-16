import fs from "fs";
import path from "path";
import { parsePdf } from "@utilities/pdfParser";
import mammoth from "mammoth";
import { getCohereClient } from "@utilities/cohereClient";
import { AppError } from "@middlewares/AppError";
import type { ParsedCV } from "@type/cv.d";

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await parsePdf(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new AppError("Định dạng file không hỗ trợ. Chỉ hỗ trợ .pdf hoặc .docx", 400);
}

async function parseCV(filePath: string): Promise<ParsedCV> {
  const text = await extractTextFromFile(filePath);
  
  if (!text || text.trim().length === 0) {
    throw new AppError("Nội dung tệp CV trống hoặc không thể trích xuất văn bản", 400);
  }

  const cohere = getCohereClient();

  const prompt = `
You are an expert CV parser. Analyze the CV text below and extract the candidate's details.
Populate all fields in the JSON schema based on the details in the text.
For 'work_experience', extract the detailed list of past jobs/companies, roles, duration, responsibilities, and accomplishments as a single comprehensive text description.

CV text:
${text}
`;

  const jsonSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      skills: { 
        type: "array", 
        items: { type: "string" } 
      },
      languages: { 
        type: "array", 
        items: { type: "string" } 
      },
      experience_years: { type: "string" },
      education: { type: "string" },
      current_position: { type: "string" },
      work_experience: { type: "string" }
    },
    required: [
      "name",
      "email",
      "phone",
      "skills",
      "languages",
      "experience_years",
      "education",
      "current_position",
      "work_experience"
    ]
  };

  try {
    const response = await cohere.chat({
      model: "command-r-plus-08-2024",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { 
        type: "json_object",
        jsonSchema: jsonSchema as any
      },
      temperature: 0.2,
    });

    const contentItems = response.message?.content;
    const textItem = contentItems?.find(
      (item): item is { type: "text"; text: string } => item.type === "text"
    );
    const result = textItem?.text;
    if (!result) {
      throw new AppError("Không nhận được phản hồi hợp lệ từ Cohere API", 500);
    }

    const parsed = JSON.parse(result) as ParsedCV;
    return parsed;
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(`Lỗi khi phân tích CV bằng Cohere AI: ${err.message || err}`, 500);
  }
}

export default parseCV;
