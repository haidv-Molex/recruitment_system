import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteLevel from "./delete";

class Level {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteLevel;
}

export default Level;
