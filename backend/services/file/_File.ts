import upload from "./upload";
import getById from "./getById";
import parseJobSheet from "./parseJobSheet";
import parseCandidateSheet from "./parseCandidateSheet";

class FileService {
  static upload = upload;
  static getById = getById;
  static parseJobSheet = parseJobSheet;
  static parseCandidateSheet = parseCandidateSheet;
}

export default FileService;
