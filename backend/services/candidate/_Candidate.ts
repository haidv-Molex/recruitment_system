import { create } from "./create";
import { createWithAll } from "./createWithAll";
import { update } from "./update";
import { getAll } from "./getAll";
import { getById } from "./getById";
import { deleteCandidate } from "./delete";
import { getAgencies } from "./getAgencies";
import { getStatuses } from "./getStatuses";
import { batchImport } from "./batchImport";

class Candidate {
  static create = create;
  static createWithAll = createWithAll;
  static update = update;
  static getAll = getAll;
  static getById = getById;
  static delete = deleteCandidate;
  static getAgencies = getAgencies;
  static getStatuses = getStatuses;
  static batchImport = batchImport;
}

export default Candidate;

