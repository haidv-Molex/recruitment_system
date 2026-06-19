import express from "express";
import joiValidate from "@middlewares/joiValidate";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { idQuerySchema, updateBodySchema } from "./validation";

const updateCandidateDetailController = express.Router({ mergeParams: true });

updateCandidateDetailController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(idQuerySchema, "query"),
  joiValidate(updateBodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await CandidateDetailService.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật chi tiết ứng viên thành công",
      data: result
    });
  }
);

export default updateCandidateDetailController;