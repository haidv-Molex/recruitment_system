import create from "./create";
import createWithAll from "./createWithAll";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteJob from "./delete";

class Job {
  static create = create;
  static createWithAll = createWithAll;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteJob;
}

export default Job;
