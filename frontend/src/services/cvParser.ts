import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(' '));
  }

  return pages.join('\n');
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

interface ParsedCVFields {
  name: string;
  email: string;
  phone: string;
  currentSalary: number | string;
  expectedSalary: number | string;
  targetedCompany: boolean;
  targetedCompanyName: string;
  status: string;
  inputDate: string;
  note?: string;
}

function extractFields(text: string): ParsedCVFields {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  const phoneMatch = text.match(/(?:\+?84|0)\d[\d\s.()\-]{7,12}/);
  let phone = '';
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/[\s.()\-+]/g, '');
    if (phone.startsWith('84') && !phone.startsWith('0')) {
      phone = '0' + phone.slice(2);
    }
  }

  let name = '';
  const skipKeywords = [
    'curriculum vitae', 'cv', 'resume', 'sơ yếu lý lịch',
    'hồ sơ', 'ứng viên', 'thông tin cá nhân', 'personal',
    'information', 'profile', 'objective', 'summary',
    'mục tiêu', 'nghề nghiệp', 'career', 'education',
    'học vấn', 'kinh nghiệm', 'experience', 'contact',
    'liên hệ', 'address', 'địa chỉ',
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (skipKeywords.some((kw) => lower.includes(kw))) continue;
    if (line.includes('@')) continue;
    if (/^[\d\s.+()-]+$/.test(line)) continue;
    if (line.length < 2 || line.length > 60) continue;

    const cleaned = line.replace(/[.,]/g, '');
    const words = cleaned.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 6 &&
      /^[\p{L}\s.]+$/u.test(cleaned)
    ) {
      name = line;
      break;
    }
  }

  const salaryRx =
    /(?:lương\s*(?:hiện\s*tại)?|current\s*salary)[:\s]*(\d[\d.,]*)/i;
  const salaryMatch = text.match(salaryRx);
  const currentSalary = salaryMatch
    ? parseFloat(salaryMatch[1].replace(/[.,]/g, ''))
    : '';

  const expectedRx =
    /(?:lương\s*mong\s*muốn|expected\s*salary|lương\s*kỳ\s*vọng)[:\s]*(\d[\d.,]*)/i;
  const expectedMatch = text.match(expectedRx);
  const expectedSalary = expectedMatch
    ? parseFloat(expectedMatch[1].replace(/[.,]/g, ''))
    : '';

  const companyRx =
    /(?:công ty|company|nơi làm việc|employer|cơ quan)[:\s]*(.+)/i;
  const companyMatch = text.match(companyRx);
  const companyName = companyMatch
    ? companyMatch[1].trim().substring(0, 100)
    : '';

  return {
    name,
    email,
    phone,
    currentSalary,
    expectedSalary,
    targetedCompany: !!companyName,
    targetedCompanyName: companyName,
    status: 'CV Sent',
    inputDate: new Date().toISOString().slice(0, 10),
  };
}

export async function parseCV(file: File): Promise<ParsedCVFields> {
  const ext = file.name.split('.').pop()!.toLowerCase();

  let text = '';

  if (ext === 'pdf') {
    text = await extractTextFromPDF(file);
  } else if (ext === 'docx') {
    text = await extractTextFromDOCX(file);
  } else if (ext === 'txt') {
    text = await file.text();
  } else {
    throw new Error(
      'Unsupported format. Please use PDF, DOCX or TXT.'
    );
  }

  if (!text.trim()) {
    throw new Error(
      'Cannot extract content. File may be empty or a scanned image.'
    );
  }

  const fields = extractFields(text);

  const preview = text.substring(0, 300).replace(/\s+/g, ' ').trim();
  fields.note = `[Auto-parsed from CV] ${preview}`;

  return fields;
}

export interface ParseManyCVResult {
  fileName: string;
  status: 'success' | 'error';
  data: ParsedCVFields | null;
  error?: string;
  selected: boolean;
}

export async function parseManyCV(files: FileList | File[]): Promise<ParseManyCVResult[]> {
  const results: ParseManyCVResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const fields = await parseCV(file);
      results.push({
        fileName: file.name,
        status: 'success',
        data: fields,
        selected: true,
      });
    } catch (err: any) {
      results.push({
        fileName: file.name,
        status: 'error',
        error: err.message,
        data: null,
        selected: false,
      });
    }
  }

  return results;
}

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
