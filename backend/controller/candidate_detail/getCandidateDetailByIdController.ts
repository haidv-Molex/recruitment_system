import express from "express";
import joiValidate from "@middlewares/joiValidate";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { idQuerySchema } from "./validation";

const getCandidateDetailByIdController = express.Router({ mergeParams: true });

getCandidateDetailByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(idQuerySchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await CandidateDetailService.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy chi tiết ứng viên thành công",
      data: result
    });
  }
);

export default getCandidateDetailByIdController;