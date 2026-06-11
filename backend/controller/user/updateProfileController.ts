import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@/services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import type { userModel } from "@model/user/userModel";

const updateProfileController = express.Router();

const bodySchema = Joi.object({
  username: Joi.string().min(1).max(255).optional().messages({
    "string.empty": "Tên người dùng không được để trống",
    "string.min": "Tên người dùng phải từ 1 ký tự trở lên",
    "string.max": "Tên người dùng tối đa 255 ký tự"
  }),
  description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả tối đa 255 ký tự"
  })
}).or("username", "description").messages({
  "object.missing": "Phải cung cấp ít nhất tên người dùng hoặc mô tả để cập nhật"
});

updateProfileController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const user = req.user as userModel;
    const { username, description } = req.body;

    const updatedUser = await withTransaction(async (pool) => {
      return await User.updateProfile(user.user_id, { username, description }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: updatedUser
    });
  }
);

export default updateProfileController;
