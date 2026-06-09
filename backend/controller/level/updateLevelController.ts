import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Level from "@services/level/_Level";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateLevelController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã cấp bậc phải là số",
    "number.integer": "Mã cấp bậc phải là số nguyên",
    "number.positive": "Mã cấp bậc phải là số dương",
    "any.required": "Mã cấp bậc là bắt buộc"
  })
});

const bodySchema = Joi.object({
  level_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã cấp bậc tối đa 255 ký tự"
  }),
  level_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên cấp bậc không được để trống",
    "string.max": "Tên cấp bậc tối đa 255 ký tự"
  }),
  level_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả cấp bậc tối đa 255 ký tự"
  })
}).or("level_code", "level_name", "level_description").messages({
  "object.missing": "Phải cung cấp ít nhất mã cấp bậc, tên hoặc mô tả để cập nhật"
});

updateLevelController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Level.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin cấp bậc thành công",
      data: result
    });
  }
);

export default updateLevelController;
