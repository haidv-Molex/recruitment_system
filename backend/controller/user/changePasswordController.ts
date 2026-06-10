import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

const changePasswordController = express.Router();

const bodySchema = Joi.object({
  oldPassword: Joi.string().min(6).max(255).required().messages({
    "any.required": "Mật khẩu cũ là bắt buộc",
    "string.empty": "Mật khẩu cũ không được để trống",
    "string.min": "Mật khẩu cũ phải từ 6 ký tự trở lên",
    "string.max": "Mật khẩu cũ tối đa 255 ký tự"
  }),
  newPassword: Joi.string().min(6).max(255).required().messages({
    "any.required": "Mật khẩu mới là bắt buộc",
    "string.empty": "Mật khẩu mới không được để trống",
    "string.min": "Mật khẩu mới phải từ 6 ký tự trở lên",
    "string.max": "Mật khẩu mới tối đa 255 ký tự"
  })
});

changePasswordController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const user = req.user as userModel;
    const { oldPassword, newPassword } = req.body;

    await withTransaction(async (pool) => {
      const isCorrect = await User.comparePassword(oldPassword, user.user_id, pool);
      if (!isCorrect) {
        throw new AppError("Mật khẩu cũ không chính xác", 400);
      }

      await User.updatePassword(user.user_id, newPassword, pool);
    });

    res.status(200).json({
      result: true,
      message: "Đổi mật khẩu thành công"
    });
  }
);

export default changePasswordController;
