import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deletePlatform from "./delete";

class Platform {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deletePlatform;
}

export default Platform;
