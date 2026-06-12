import create from "./create";
import createWithAll from "./createWithAll";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteJob from "./delete";
import batchImport from "./batchImport";

class Job {
  static create = create;
  static createWithAll = createWithAll;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteJob;
  static batchImport = batchImport;
}

export default Job;
