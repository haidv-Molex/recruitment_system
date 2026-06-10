import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteDepartment from "./delete";

class Department {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteDepartment;
}

export default Department;
