import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Segment from "@services/segment/_Segment";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getSegmentByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã phân khúc phải là số",
    "number.integer": "Mã phân khúc phải là số nguyên",
    "number.positive": "Mã phân khúc phải là số dương",
    "any.required": "Mã phân khúc là bắt buộc"
  })
});

getSegmentByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Segment.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin phân khúc thành công",
      data: result
    });
  }
);

export default getSegmentByIdController;
