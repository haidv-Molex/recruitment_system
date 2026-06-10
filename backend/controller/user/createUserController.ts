import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createUserController = express.Router();

const bodySchema = Joi.object({
  username: Joi.string().max(255).required().messages({
    "any.required": "Tên người dùng là bắt buộc",
    "string.empty": "Tên người dùng không được để trống",
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
});

createUserController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await User.create({
        username: req.body.username,
        description: req.body.description,
        departmentId: req.body.departmentId
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo người dùng thành công",
      data: result
    });
  }
);

export default createUserController;
