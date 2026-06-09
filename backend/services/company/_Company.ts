import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteCompany from "./delete";

class Company {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteCompany;
}

export default Company;
