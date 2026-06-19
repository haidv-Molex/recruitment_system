import create from "@services/access/create";
import deleteAccess from "@services/access/deleteAccess";
import getAll from "@services/access/getAll";
import findById from "@services/access/findById";

class Access {
  static create = create;
  static deleteAccess = deleteAccess;
  static getAll = getAll;
  static findById = findById;
}

export default Access;
