import upload from "./upload";
import getById from "./getById";
import parseJobSheet from "./parseJobSheet";
import parseCandidateSheet from "./parseCandidateSheet";
import createValidationSheet from "./createValidationSheet";

class FileService {
  static upload = upload;
  static getById = getById;
  static parseJobSheet = parseJobSheet;
  static parseCandidateSheet = parseCandidateSheet;
  static createValidationSheet = createValidationSheet;
}

export default FileService;
