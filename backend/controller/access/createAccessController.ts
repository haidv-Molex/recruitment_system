import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Access from "@services/access/_Access";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const createAccessController = express.Router();

const bodySchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    "any.required": "user_id là bắt buộc",
    "number.base": "user_id phải là số nguyên",
  }),
  candidate_id: Joi.number().integer().positive().optional().allow(null).default(null),
  job_id: Joi.number().integer().positive().optional().allow(null).default(null),
}).or("candidate_id", "job_id").messages({
  "object.missing": "Phải cung cấp ít nhất candidate_id hoặc job_id",
});

createAccessController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ Admin mới được phép thao tác phân quyền
    if (requestor.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền quản lý phân quyền", 403);
    }

    const { user_id, candidate_id, job_id } = req.body;

    const result = await withTransaction(async (pool) => {
      return await Access.create({ user_id, candidate_id, job_id }, pool);
    }, requestor);

    res.status(201).json({
      result: true,
      message: "Tạo phân quyền thành công",
      data: result
    });
  }
);

export default createAccessController;
