import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@/services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

const createHRController = express.Router();

const bodySchema = Joi.object({
  code: Joi.string().max(255).optional().allow("", null).messages({
    "string.max": "Mã người dùng tối đa 255 ký tự"
  }),
  username: Joi.string().max(255).required().messages({
    "any.required": "Tên người dùng là bắt buộc",
    "string.empty": "Tên người dùng không được để trống",
    "string.max": "Tên người dùng tối đa 255 ký tự"
  }),
  account: Joi.string().max(255).required().messages({
    "any.required": "Tài khoản đăng nhập là bắt buộc",
    "string.empty": "Tài khoản không được để trống",
    "string.max": "Tài khoản tối đa 255 ký tự"
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "any.required": "Mật khẩu là bắt buộc",
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải từ 6 ký tự trở lên",
    "string.max": "Mật khẩu tối đa 255 ký tự"
  }),
  description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả tối đa 255 ký tự"
  })
});

createHRController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const creator = req.user as userModel;

    // Kiểm tra xem người tạo có phải admin hay không
    if (creator.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền tạo tài khoản HR", 403);
    }

    const result = await withTransaction(async (pool) => {
      return await User.createHR({
        code: req.body.code || null,
        username: req.body.username,
        account: req.body.account,
        password: req.body.password,
        description: req.body.description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo tài khoản HR thành công",
      data: result
    });
  }
);

export default createHRController;
