import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteJob from "./delete";

class Job {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteJob;
}

export default Job;
