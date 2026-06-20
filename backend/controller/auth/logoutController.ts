import express from "express";
import passport from "@middlewares/passport";

const logoutController = express.Router();

logoutController.post("", (req, res, next) => {
  passport.authenticate("logout", { session: false }, (err: any, result: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!result) {
      const status = info?.status || 400;
      return res.status(status).json({
        result: false,
        message: info?.message || "Đăng xuất thất bại"
      });
    }

    return res.status(200).json({
      result: true,
      message: result.message || "Đăng xuất thành công"
    });
  })(req, res, next);
});

export default logoutController;
