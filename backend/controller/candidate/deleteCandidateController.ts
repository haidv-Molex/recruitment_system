import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteCandidateController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã ứng viên phải là số",
    "number.integer": "Mã ứng viên phải là số nguyên",
    "number.positive": "Mã ứng viên phải là số dương",
    "any.required": "Mã ứng viên là bắt buộc"
  })
});

deleteCandidateController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      await Candidate.delete(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa ứng viên thành công"
    });
  }
);

export default deleteCandidateController;
