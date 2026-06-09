import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteSite from "./delete";

class Site {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteSite;
}

export default Site;
