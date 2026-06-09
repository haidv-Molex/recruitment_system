import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import { userModel } from "@/model/user/userModel";

const loginController = express.Router();

const bodySchema = Joi.object({
  account: Joi.string().required().messages({
    "any.required": "Tài khoản đăng nhập là bắt buộc",
    "string.empty": "Tài khoản không được để trống"
  }),
  password: Joi.string().required().messages({
    "any.required": "Mật khẩu là bắt buộc",
    "string.empty": "Mật khẩu không được để trống"
  })
});

loginController.post("",
  joiValidate(bodySchema, "body"),
  (req, res, next) => {
    passport.authenticate("login", { session: false }, (err: any, user: userModel & { accessToken: string }, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const status = info?.status || 401;
        return res.status(status).json({
          result: false,
          message: info?.message || "Tài khoản hoặc mật khẩu không chính xác"
        });
      }

      return res.status(200).json({
        result: true,
        message: info?.message || "Đăng nhập thành công",
        data: {
          user_id: user.user_id,
          user_name: user.user_name,
          user_account: user.user_account,
          user_role: user.user_role,
          accessToken: user.accessToken
        }
      });
    })(req, res, next);
  }
);

export default loginController;
