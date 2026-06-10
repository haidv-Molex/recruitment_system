import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Segment from "@services/segment/_Segment";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createSegmentController = express.Router();

const bodySchema = Joi.object({
  segment_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã phân khúc tối đa 255 ký tự"
  }),
  segment_name: Joi.string().max(255).required().messages({
    "any.required": "Tên phân khúc là bắt buộc",
    "string.empty": "Tên phân khúc không được để trống",
    "string.max": "Tên phân khúc tối đa 255 ký tự"
  }),
  segment_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả phân khúc tối đa 255 ký tự"
  })
});

createSegmentController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Segment.create({
        segment_code: req.body.segment_code,
        segment_name: req.body.segment_name,
        segment_description: req.body.segment_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo phân khúc thành công",
      data: result
    });
  }
);

export default createSegmentController;
