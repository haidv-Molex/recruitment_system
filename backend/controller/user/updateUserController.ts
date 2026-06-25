import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@/services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";

import type { userOutputModel } from "@model/user/userModel";

const updateUserController = express.Router({ mergeParams: true });

const querySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã người dùng phải là số",
    "number.integer": "Mã người dùng phải là số nguyên",
    "number.positive": "Mã người dùng phải là số dương",
    "any.required": "Mã người dùng là bắt buộc"
  })
});

const bodySchema = Joi.object({
  code: Joi.string().max(255).optional().allow("", null).messages({
    "string.max": "Mã người dùng tối đa 255 ký tự"
  }),
  username: Joi.string().min(1).max(255).optional().messages({
    "string.empty": "Tên người dùng không được để trống",
    "string.min": "Tên người dùng phải từ 1 ký tự trở lên",
    "string.max": "Tên người dùng tối đa 255 ký tự"
  }),
  description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả tối đa 255 ký tự"
  })
}).or("code", "username", "description").messages({
  "object.missing": "Phải cung cấp ít nhất mã, tên người dùng hoặc mô tả để cập nhật"
});

updateUserController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;
    const targetUserId = parseInt(req.query.id as string, 10);
    const { code, username, description } = req.body;
    const normalizedCode = code === undefined ? undefined : code || null;

    const updatedUser = await withTransaction(async (pool) => {
      // 1. Tìm thông tin user cần cập nhật và kiểm tra role
      const targetUser = await User.findById(targetUserId, pool);

      if (requestor.user_role !== "admin" && (targetUser.user_role === "admin" || targetUser.user_role === "hr")) {
        throw new AppError("Không thể chỉnh sửa thông tin của tài khoản HR hoặc Admin", 403);
      }

      // 2. Tiến hành cập nhật
      return await User.updateProfile(targetUserId, { code: normalizedCode, username, description }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: updatedUser
    });
  }
);

export default updateUserController;
