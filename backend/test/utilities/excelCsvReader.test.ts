import { readExcelOrCsvToJson, writeJsonToExcelOrCsv } from "@utilities/excelCsvReader";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { AppError } from "@middlewares/AppError";

describe("excelCsvReader utility", () => {
  let expect: any;
  const testDir = resolve(".test");

  before(async () => {
    // Dynamic import for Chai due to CommonJS/ESM compatibility
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("readExcelOrCsvToJson", () => {
    it("should successfully read a valid CSV file and convert to JSON", async () => {
      const csvPath = resolve(testDir, "test.csv");
      writeFileSync(csvPath, "name,age,city\nJohn Doe,30,New York\nJane Smith,25,London");

      const result = await readExcelOrCsvToJson(csvPath);
      expect(result).to.deep.equal({
        sheet1: [
          { name: "John Doe", age: 30, city: "New York" },
          { name: "Jane Smith", age: 25, city: "London" }
        ]
      });
    });

    it("should throw AppError 404 when file does not exist", async () => {
      const nonExistentPath = resolve(testDir, "does-not-exist.csv");
      try {
        await readExcelOrCsvToJson(nonExistentPath);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.contain("File not found");
      }
    });

    it("should throw AppError 400 when sheetName is specified but not found", async () => {
      const csvPath = resolve(testDir, "test.csv");
      writeFileSync(csvPath, "name,age\nJohn,30");

      try {
        await readExcelOrCsvToJson(csvPath, { sheetName: "NonExistentSheet" });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.contain("not found in workbook");
      }
    });
  });

  describe("writeJsonToExcelOrCsv and readExcelOrCsvToJson integration", () => {
    it("should write JSON to a CSV file and read it back correctly", async () => {
      const csvPath = resolve(testDir, "output.csv");
      const testData = [
        { name: "Alice", role: "Developer" },
        { name: "Bob", role: "Designer" }
      ];

      await writeJsonToExcelOrCsv(testData, csvPath);
      expect(existsSync(csvPath)).to.be.true;

      const readData = await readExcelOrCsvToJson(csvPath);
      expect(readData).to.deep.equal({
        sheet1: testData
      });
    });

    it("should write JSON to an XLSX file and read it back correctly", async () => {
      const xlsxPath = resolve(testDir, "output.xlsx");
      const testData = [
        { name: "Charlie", score: 95 },
        { name: "Dave", score: 88 }
      ];

      await writeJsonToExcelOrCsv(testData, xlsxPath, { sheetName: "ScoresSheet" });
      expect(existsSync(xlsxPath)).to.be.true;

      const readData = await readExcelOrCsvToJson(xlsxPath, { sheetName: "ScoresSheet" });
      expect(readData).to.deep.equal(testData);
    });

    it("should throw AppError 500 when write fails due to invalid path", async () => {
      const invalidPath = resolve("/non/existent/directory/output.xlsx");
      const testData = [{ a: 1 }];

      try {
        await writeJsonToExcelOrCsv(testData, invalidPath);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.statusCode).to.equal(500);
        expect(error.message).to.contain("Failed to write Excel/CSV file");
      }
    });
  });
});
