import { create } from "./create";
import { createWithAll } from "./createWithAll";
import { update } from "./update";
import { getAll } from "./getAll";
import { getById } from "./getById";
import { deleteCandidate } from "./delete";
import { getAgencies } from "./getAgencies";
import { getStatuses } from "./getStatuses";
import { batchImport } from "./batchImport";

const Candidate = {
  create,
  createWithAll,
  update,
  getAll,
  getById,
  delete: deleteCandidate,
  getAgencies,
  getStatuses,
  batchImport,
};

export default Candidate;

