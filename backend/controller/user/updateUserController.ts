import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";

const updateUserController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã người dùng phải là số",
    "number.integer": "Mã người dùng phải là số nguyên",
    "number.positive": "Mã người dùng phải là số dương",
    "any.required": "Mã người dùng là bắt buộc"
  })
});

const bodySchema = Joi.object({
  username: Joi.string().min(1).max(255).optional().messages({
    "string.empty": "Tên người dùng không được để trống",
    "string.min": "Tên người dùng phải từ 1 ký tự trở lên",
    "string.max": "Tên người dùng tối đa 255 ký tự"
  }),
  description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả tối đa 255 ký tự"
  }),
  departmentId: Joi.number().integer().positive().optional().messages({
    "number.base": "Mã phòng ban phải là số",
    "number.integer": "Mã phòng ban phải là số nguyên",
    "number.positive": "Mã phòng ban phải là số dương"
  })
}).or("username", "description", "departmentId").messages({
  "object.missing": "Phải cung cấp ít nhất tên người dùng, mô tả hoặc mã phòng ban để cập nhật"
});

updateUserController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "params"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const targetUserId = parseInt(req.params.user_id as string, 10);
    const { username, description, departmentId } = req.body;

    const updatedUser = await withTransaction(async (pool) => {
      // 1. Tìm thông tin user cần cập nhật và kiểm tra role
      const targetUser = await User.findById(targetUserId, pool);

      if (targetUser.user_role === "admin" || targetUser.user_role === "hr") {
        throw new AppError("Không thể chỉnh sửa thông tin của tài khoản HR hoặc Admin", 403);
      }

      // 2. Tiến hành cập nhật
      return await User.updateProfile(targetUserId, { username, description, departmentId }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: updatedUser
    });
  }
);

export default updateUserController;
