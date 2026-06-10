import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteJob from "./delete";
import parseSheet from "./parseSheet";

class Job {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteJob;
  static parseSheet = parseSheet;
}

export default Job;
