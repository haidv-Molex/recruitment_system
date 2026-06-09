import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Segment from "@services/segment/_Segment";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateSegmentController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã phân khúc phải là số",
    "number.integer": "Mã phân khúc phải là số nguyên",
    "number.positive": "Mã phân khúc phải là số dương",
    "any.required": "Mã phân khúc là bắt buộc"
  })
});

const bodySchema = Joi.object({
  segment_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã phân khúc tối đa 255 ký tự"
  }),
  segment_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên phân khúc không được để trống",
    "string.max": "Tên phân khúc tối đa 255 ký tự"
  }),
  segment_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả phân khúc tối đa 255 ký tự"
  })
}).or("segment_code", "segment_name", "segment_description").messages({
  "object.missing": "Phải cung cấp ít nhất mã phân khúc, tên hoặc mô tả để cập nhật"
});

updateSegmentController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Segment.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin phân khúc thành công",
      data: result
    });
  }
);

export default updateSegmentController;
