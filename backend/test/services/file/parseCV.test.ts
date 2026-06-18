import { AppError } from "@middlewares/AppError";
import parseCV from "@services/file/parseCV";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import * as cvParseClient from "@utilities/cvParseClient";

describe("parseCV Service", () => {
  let expect: any;
  const rootTestDir = ".test";
  const testSavePath = path.join(rootTestDir, "services", "file", "parseCV");

  const sampleCVParseData = {
    email: "haidv28062004@gmail.com",
    links: {
      other: ["https://youtu.be/XxolbVyMmkY"],
      github: "https://github.com/haidv2806",
      linkedin: null,
      portfolio: "https://youtu.be/6q1_fBUdeBs"
    },
    phone: "0868177137",
    gender: null,
    skills: ["Node.js", "TypeScript", "PostgreSQL"],
    summary: "Fullstack developer with backend and frontend experience.",
    location: "Hanoi, Vietnam",
    education: [
      {
        field: "Information Systems",
        degree: "Bachelor",
        end_date: "2026",
        start_date: "2022",
        institution: "Hanoi University of Industry"
      }
    ],
    references: [],
    national_id: "v28062004",
    nationality: null,
    date_of_birth: null,
    quality_grade: "B",
    certifications: [],
    full_name: "Do Van Hai",
    languages: [
      { language: "English", proficiency: null },
      { language: "Vietnamese", proficiency: null }
    ],
    detected_language: "en",
    field_confidences: {
      email: 0.95,
      full_name: 0.95,
      work_experience: 1
    },
    extraction_warnings: ["Education entries are missing key fields"],
    years_of_experience: 4.3,
    work_experience: [
      {
        title: "Frontend Developer Intern MegaAI Artificial Intelligence Co.",
        company: "Ltd",
        end_date: "2024-08",
        is_current: false,
        start_date: "2024-06",
        responsibilities: [
          "Developed an iOS application using SwiftUI.",
          "Integrated REST APIs."
        ]
      }
    ]
  };

  before(async () => {
    // Dynamically import chai expect to handle ES Module compatibility
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  after(() => {
    if (fs.existsSync(rootTestDir)) {
      fs.rmSync(rootTestDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    if (!fs.existsSync(testSavePath)) {
      fs.mkdirSync(testSavePath, { recursive: true });
    }
  });

  afterEach(() => {
    sinon.restore();
    if (fs.existsSync(testSavePath)) {
      fs.rmSync(testSavePath, { recursive: true, force: true });
    }
  });

  it("should successfully parse a PDF CV file using CVParse API", async () => {
    sinon.stub(cvParseClient, "parseCVByVendor").resolves(sampleCVParseData);

    const tempFilePath = path.join(testSavePath, "test_cv.pdf");
    fs.writeFileSync(tempFilePath, "dummy pdf buffer data");

    const result = await parseCV(tempFilePath);

    expect(result).to.be.an("object");
    expect(result.name).to.equal("Do Van Hai");
    expect(result.email).to.equal("haidv28062004@gmail.com");
    expect(result.summary).to.equal("Fullstack developer with backend and frontend experience.");
    expect(result.location).to.equal("Hanoi, Vietnam");
    expect(result.links.github).to.equal("https://github.com/haidv2806");
    expect(result.skills).to.include("Node.js");
    expect(result.languages).to.deep.equal(["English", "Vietnamese"]);
    expect(result.language_details).to.deep.equal([
      { language: "English", proficiency: "" },
      { language: "Vietnamese", proficiency: "" }
    ]);
    expect(result.experience_years).to.equal("4.3");
    expect(result.education_details).to.deep.equal([
      {
        institution: "Hanoi University of Industry",
        degree: "Bachelor",
        field: "Information Systems",
        start_date: "2022",
        end_date: "2026"
      }
    ]);
    expect(result.current_position).to.contain("Frontend Developer Intern");
    expect(result.work_experience).to.contain("Integrated REST APIs.");
    expect(result.work_experience_details[0]).to.deep.include({
      title: "Frontend Developer Intern MegaAI Artificial Intelligence Co.",
      company: "Ltd",
      start_date: "2024-06",
      end_date: "2024-08",
      is_current: false
    });
    expect(result.quality_grade).to.equal("B");
    expect(result.detected_language).to.equal("en");
    expect(result.field_confidences.email).to.equal(0.95);
    expect(result.extraction_warnings).to.deep.equal(["Education entries are missing key fields"]);
  });

  it("should successfully parse a DOCX CV file and map missing fields safely", async () => {
    sinon.stub(cvParseClient, "parseCVByVendor").resolves({
      full_name: "Tran Thi B",
      email: "",
      phone: null,
      skills: null,
      languages: [{ language: "Vietnamese" }],
      years_of_experience: null,
      education: [],
      work_experience: []
    });

    const tempFilePath = path.join(testSavePath, "test_cv.docx");
    fs.writeFileSync(tempFilePath, "dummy docx data");

    const result = await parseCV(tempFilePath);

    expect(result).to.be.an("object");
    expect(result.name).to.equal("Tran Thi B");
    expect(result.phone).to.equal("");
    expect(result.skills).to.deep.equal([]);
    expect(result.languages).to.deep.equal(["Vietnamese"]);
    expect(result.language_details).to.deep.equal([{ language: "Vietnamese", proficiency: "" }]);
    expect(result.experience_years).to.equal("");
  });

  it("should throw an AppError if the file extension is unsupported", async () => {
    const parseStub = sinon.stub(cvParseClient, "parseCVByVendor").resolves(sampleCVParseData);
    const tempFilePath = path.join(testSavePath, "test_cv.txt");
    fs.writeFileSync(tempFilePath, "plain text content");

    try {
      await parseCV(tempFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(AppError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.contain("Định dạng file không hỗ trợ");
    }

    expect(parseStub.called).to.equal(false);
  });

  it("should handle malformed CVParse result by returning empty mapped fields", async () => {
    sinon.stub(cvParseClient, "parseCVByVendor").resolves({});

    const tempFilePath = path.join(testSavePath, "empty_result_cv.pdf");
    fs.writeFileSync(tempFilePath, "dummy");

    const result = await parseCV(tempFilePath);

    expect(result).to.deep.equal({
      name: "",
      email: "",
      phone: "",
      gender: "",
      summary: "",
      location: "",
      links: {
        github: "",
        linkedin: "",
        portfolio: "",
        other: []
      },
      skills: [],
      languages: [],
      language_details: [],
      experience_years: "",
      education: "",
      education_details: [],
      current_position: "",
      work_experience: "",
      work_experience_details: [],
      references: [],
      national_id: "",
      nationality: "",
      date_of_birth: "",
      quality_grade: "",
      certifications: [],
      detected_language: "",
      field_confidences: {},
      extraction_warnings: []
    });
  });

  it("should handle CVParse API errors gracefully", async () => {
    sinon.stub(cvParseClient, "parseCVByVendor").rejects(new Error("Invalid API key"));

    const tempFilePath = path.join(testSavePath, "test_cv.pdf");
    fs.writeFileSync(tempFilePath, "dummy");

    try {
      await parseCV(tempFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(AppError);
      expect(err.statusCode).to.equal(500);
      expect(err.message).to.contain("Lỗi khi phân tích CV bằng CVParse API");
    }
  });
});
