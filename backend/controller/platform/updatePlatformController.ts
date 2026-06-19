import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Platform from "@services/platform/_Platform";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updatePlatformController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã nền tảng phải là số",
    "number.integer": "Mã nền tảng phải là số nguyên",
    "number.positive": "Mã nền tảng phải là số dương",
    "any.required": "Mã nền tảng là bắt buộc"
  })
});

const bodySchema = Joi.object({
  platform_code: Joi.string().max(255).optional().allow("", null).messages({
    "string.max": "Mã nền tảng tối đa 255 ký tự"
  }),
  platform_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên nền tảng không được để trống",
    "string.max": "Tên nền tảng tối đa 255 ký tự"
  }),
  platform_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả nền tảng tối đa 255 ký tự"
  })
}).or("platform_code", "platform_name", "platform_description").messages({
  "object.missing": "Phải cung cấp ít nhất mã nền tảng, tên nền tảng hoặc mô tả để cập nhật"
});

updatePlatformController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Platform.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin nền tảng thành công",
      data: result
    });
  }
);

export default updatePlatformController;
