import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Segment from "@services/segment/_Segment";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteSegmentController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã phân khúc phải là số",
    "number.integer": "Mã phân khúc phải là số nguyên",
    "number.positive": "Mã phân khúc phải là số dương",
    "any.required": "Mã phân khúc là bắt buộc"
  })
});

deleteSegmentController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      await Segment.delete(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa phân khúc thành công"
    });
  }
);

export default deleteSegmentController;
