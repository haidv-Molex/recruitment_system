import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getJobByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công việc phải là số",
    "number.integer": "Mã công việc phải là số nguyên",
    "number.positive": "Mã công việc phải là số dương",
    "any.required": "Mã công việc là bắt buộc"
  })
});

getJobByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Job.getById(id, pool);
    }, req.user);

    res.status(200).json({
      result: true,
      message: "Lấy thông tin công việc thành công",
      data: result
    });
  }
);

export default getJobByIdController;
