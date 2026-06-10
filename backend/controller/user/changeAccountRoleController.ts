import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const changeAccountRoleController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã người dùng phải là số",
    "number.integer": "Mã người dùng phải là số nguyên",
    "number.positive": "Mã người dùng phải là số dương",
    "any.required": "Mã người dùng là bắt buộc"
  })
});

const bodySchema = Joi.object({
  role: Joi.string().valid("hr", "banned").required().messages({
    "any.only": "Role phải là 'hr' hoặc 'banned'",
    "any.required": "Trường role là bắt buộc",
    "string.base": "Role phải là chuỗi"
  })
});

/**
 * PATCH /user/:user_id/role
 * Chỉ Admin mới được phép đổi role giữa 'hr' và 'banned'.
 */
changeAccountRoleController.patch("/role",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "params"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ admin mới được thay đổi role
    if (requestor.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền thay đổi role HR", 403);
    }

    const targetUserId = parseInt(req.params.user_id as string, 10);
    const { role } = req.body as { role: "hr" | "banned" };

    await withTransaction(async (pool) => {
      await User.changeRole(targetUserId, role, pool);
    });

    res.status(200).json({
      result: true,
      message: `Đã chuyển tài khoản sang role '${role}' thành công`
    });
  }
);

export default changeAccountRoleController;
