import create from "@services/note/create";
import getById from "@services/note/getById";
import getAll from "@services/note/getAll";
import update from "@services/note/update";
import deleteNote from "@services/note/delete";
import { getNotesByCandidateId, getNotesByJobId } from "@services/note/getLinkedNotes";

class Note {
  static create = create;
  static getById = getById;
  static getAll = getAll;
  static update = update;
  static delete = deleteNote;
  static getByCandidateId = getNotesByCandidateId;
  static getByJobId = getNotesByJobId;
}

export default Note;