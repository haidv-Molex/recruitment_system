import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Platform from "@services/platform/_Platform";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createPlatformController = express.Router();

const bodySchema = Joi.object({
  platform_name: Joi.string().max(255).required().messages({
    "any.required": "Tên nền tảng là bắt buộc",
    "string.empty": "Tên nền tảng không được để trống",
    "string.max": "Tên nền tảng tối đa 255 ký tự"
  }),
  platform_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả nền tảng tối đa 255 ký tự"
  })
});

createPlatformController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Platform.create({
        platform_name: req.body.platform_name,
        platform_description: req.body.platform_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo nền tảng thành công",
      data: result
    });
  }
);

export default createPlatformController;
