import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteSegment from "./delete";

class Segment {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteSegment;
}

export default Segment;
