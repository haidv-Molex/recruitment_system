import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";

const tokenController = express.Router();

const bodySchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    "string.base": "Refresh token phải là chuỗi"
  })
});

tokenController.post("",
  joiValidate(bodySchema, "body"),
  (req, res, next) => {
    passport.authenticate("token", { session: false }, (err: any, tokenData: { accessToken: string } | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!tokenData) {
        const status = info?.status || 401;
        return res.status(status).json({
          result: false,
          message: info?.message || "Không thể cấp lại token"
        });
      }

      return res.status(200).json({
        result: true,
        message: "Cấp lại access token thành công",
        data: {
          accessToken: tokenData.accessToken
        }
      });
    })(req, res, next);
  }
);

export default tokenController;
