import { create } from "./create";
import { update } from "./update";
import { getAll } from "./getAll";
import { getById } from "./getById";
import { deleteCandidate } from "./delete";

const Candidate = {
  create,
  update,
  getAll,
  getById,
  delete: deleteCandidate
};

export default Candidate;
