import upload from "./upload";
import getById from "./getById";
import parseJobSheet from "./parseJobSheet";

class FileService {
  static upload = upload;
  static getById = getById;
  static parseJobSheet = parseJobSheet;
}

export default FileService;
