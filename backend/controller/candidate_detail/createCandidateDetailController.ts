import express from "express";
import joiValidate from "@middlewares/joiValidate";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { createBodySchema } from "./validation";

const createCandidateDetailController = express.Router();

createCandidateDetailController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(createBodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await CandidateDetailService.create(req.body, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo chi tiết ứng viên thành công",
      data: result
    });
  }
);

export default createCandidateDetailController;