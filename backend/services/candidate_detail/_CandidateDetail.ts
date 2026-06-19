import create from "./create";
import getAll from "./getAll";
import getById from "./getById";
import update from "./update";
import deleteCandidateDetail from "./delete";

class CandidateDetailService {
  static create = create;
  static getAll = getAll;
  static getById = getById;
  static update = update;
  static delete = deleteCandidateDetail;
}

export default CandidateDetailService;