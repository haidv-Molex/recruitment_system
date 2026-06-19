import create from "./create";
import getById from "./getById";
import getAll from "./getAll";
import deleteNote from "./delete";
import update from "./update";

class Note {
  static create = create;
  static getById = getById;
  static getAll = getAll;
  static delete = deleteNote;
  static update = update;
}

export default Note;

