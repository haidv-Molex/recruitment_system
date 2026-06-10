import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const deleteUserController = express.Router({ mergeParams: true });

const querySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã người dùng phải là số",
    "number.integer": "Mã người dùng phải là số nguyên",
    "number.positive": "Mã người dùng phải là số dương",
    "any.required": "Mã người dùng là bắt buộc"
  })
});

deleteUserController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ admin hoặc hr mới được phép xóa
    if (requestor.user_role !== "admin" && requestor.user_role !== "hr") {
      throw new AppError("Chỉ Admin hoặc HR mới có quyền xóa tài khoản người dùng", 403);
    }

    const targetUserId = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      // Kiểm tra target user tồn tại và không phải admin/hr
      const targetUser = await User.findById(targetUserId, pool);

      if (targetUser.user_role === "admin" || targetUser.user_role === "hr") {
        throw new AppError("Không thể xóa tài khoản Admin hoặc HR", 403);
      }

      await User.deleteAccount(targetUserId, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa người dùng thành công"
    });
  }
);

export default deleteUserController;
