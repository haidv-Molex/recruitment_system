import upload from "./upload";
import getById from "./getById";
import parseJobSheet from "./parseJobSheet";
import parseCandidateSheet from "./parseCandidateSheet";
import createValidationSheet from "./createValidationSheet";
import createDatabaseSheet from "./createDatabaseSheet";
import createIDLTrackingSheet from "./createIDLTrackingSheet";
import createFullWorkbook from "./createFullWorkbook";
import parseCV from "./parseCV";

class FileService {
  static upload = upload;
  static getById = getById;
  static parseJobSheet = parseJobSheet;
  static parseCandidateSheet = parseCandidateSheet;
  static createValidationSheet = createValidationSheet;
  static createDatabaseSheet = createDatabaseSheet;
  static createIDLTrackingSheet = createIDLTrackingSheet;
  static createFullWorkbook = createFullWorkbook;
  static parseCV = parseCV;
}

export default FileService;
