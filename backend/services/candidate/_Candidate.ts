import { create } from "./create";
import { createWithAll } from "./createWithAll";
import { update } from "./update";
import { getAll } from "./getAll";
import { getById } from "./getById";
import { deleteCandidate } from "./delete";

const Candidate = {
  create,
  createWithAll,
  update,
  getAll,
  getById,
  delete: deleteCandidate
};

export default Candidate;
