import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  // Loop through each page in the PDF to extract text
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }

  return pages.join('\n');
}

async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

function extractFields(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Match email pattern: characters@domain.extension
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // Match Vietnamese phone number pattern: starts with 0 or +84 or 84
  const phoneMatch = text.match(/(?:\+?84|0)\d[\d\s.()\-]{7,12}/);
  let phone = '';
  if (phoneMatch) {
    // Remove all non-digit characters from the matched phone number
    phone = phoneMatch[0].replace(/[\s.()\-+]/g, '');
    // If phone starts with country code 84, convert to local format starting with 0
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

  // Loop through each line to find the candidate's name
  for (const line of lines) {
    const lower = line.toLowerCase();
    // If line contains a header keyword, skip it
    if (skipKeywords.some((kw) => lower.includes(kw))) continue;
    // If line contains an email address, skip it
    if (line.includes('@')) continue;
    // If line contains only digits and phone characters, skip it
    if (/^[\d\s.+()-]+$/.test(line)) continue;
    // If line is too short or too long to be a name, skip it
    if (line.length < 2 || line.length > 60) continue;

    const cleaned = line.replace(/[.,]/g, '');
    const words = cleaned.split(/\s+/);
    // If line has 2-6 words and contains only letters and spaces, treat it as a name
    if (
      words.length >= 2 &&
      words.length <= 6 &&
      /^[\p{L}\s.]+$/u.test(cleaned)
    ) {
      name = line;
      break;
    }
  }

  // Match current salary with Vietnamese or English label
  const salaryRx =
    /(?:lương\s*(?:hiện\s*tại)?|current\s*salary)[:\s]*(\d[\d.,]*)/i;
  const salaryMatch = text.match(salaryRx);
  const currentSalary = salaryMatch
    ? parseFloat(salaryMatch[1].replace(/[.,]/g, ''))
    : '';

  // Match expected salary with Vietnamese or English label
  const expectedRx =
    /(?:lương\s*mong\s*muốn|expected\s*salary|lương\s*kỳ\s*vọng)[:\s]*(\d[\d.,]*)/i;
  const expectedMatch = text.match(expectedRx);
  const expectedSalary = expectedMatch
    ? parseFloat(expectedMatch[1].replace(/[.,]/g, ''))
    : '';

  // Match current company name with Vietnamese or English label
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

export async function parseCV(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  let text = '';

  // If file is PDF, use PDF.js to extract text
  if (ext === 'pdf') {
    text = await extractTextFromPDF(file);
  // If file is DOCX, use mammoth to extract text
  } else if (ext === 'docx') {
    text = await extractTextFromDOCX(file);
  // If file is plain text, read it directly
  } else if (ext === 'txt') {
    text = await file.text();
  } else {
    throw new Error(
      'Unsupported format. Please use PDF, DOCX or TXT.'
    );
  }

  // If no text content was extracted, throw error
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

export async function parseManyCV(files) {
  const results = [];

  // Loop through each file to parse it individually
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
    } catch (err) {
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