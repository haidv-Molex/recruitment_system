import express from "express";
import User from "@services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getRolesController = express.Router();

/**
 * GET /user/roles
 * Lấy danh sách các vai trò (roles) hiện có trong ứng dụng.
 */
getRolesController.get("",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await User.getRoles(pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy danh sách vai trò thành công",
      data: result
    });
  }
);

export default getRolesController;
