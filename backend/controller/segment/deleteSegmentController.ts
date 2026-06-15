import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Segment from "@services/segment/_Segment";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteSegmentController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().optional().messages({
    "number.base": "Mã phân khúc phải là số",
    "number.integer": "Mã phân khúc phải là số nguyên",
    "number.positive": "Mã phân khúc phải là số dương"
  }),
  ids: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number().integer().positive())
  ).optional().messages({
    "any.only": "Danh sách mã phân khúc không hợp lệ"
  })
}).or('id', 'ids');

deleteSegmentController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    let ids: number[] = [];
    if (req.query.id) {
      ids.push(parseInt(req.query.id as string, 10));
    } else if (req.query.ids) {
      const idsQuery = req.query.ids;
      if (Array.isArray(idsQuery)) {
        ids = idsQuery.map(x => parseInt(x as string, 10));
      } else if (typeof idsQuery === 'string') {
        ids = idsQuery.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
      }
    }

    if (ids.length === 0) {
      return res.status(400).json({
        result: false,
        message: "Không có mã phân khúc nào được cung cấp để xóa"
      });
    }

    await withTransaction(async (pool) => {
      await Segment.delete(ids, pool);
    });

    res.status(200).json({
      result: true,
      message: ids.length === 1 ? "Xóa phân khúc thành công" : "Xóa các phân khúc thành công"
    });
  }
);

export default deleteSegmentController;
