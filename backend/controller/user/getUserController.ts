import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getUserController = express.Router({ mergeParams: true });

const querySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã người dùng phải là số",
    "number.integer": "Mã người dùng phải là số nguyên",
    "number.positive": "Mã người dùng phải là số dương",
    "any.required": "Mã người dùng là bắt buộc"
  })
});

getUserController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const targetUserId = parseInt(req.query.id as string, 10);

    const user = await withTransaction(async (pool) => {
      return await User.findById(targetUserId, pool);
    });

    res.status(200).json({
      result: true,
      data: user
    });
  }
);

export default getUserController;
