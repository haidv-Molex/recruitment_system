import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Site from "@services/site/_Site";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteSiteController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().optional().messages({
    "number.base": "Mã địa điểm phải là số",
    "number.integer": "Mã địa điểm phải là số nguyên",
    "number.positive": "Mã địa điểm phải là số dương"
  }),
  ids: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number().integer().positive())
  ).optional().messages({
    "any.only": "Danh sách mã địa điểm không hợp lệ"
  })
}).or('id', 'ids');

deleteSiteController.delete("",
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
        message: "Không có mã địa điểm nào được cung cấp để xóa"
      });
    }

    await withTransaction(async (pool) => {
      await Site.delete(ids, pool);
    });

    res.status(200).json({
      result: true,
      message: ids.length === 1 ? "Xóa địa điểm thành công" : "Xóa các địa điểm thành công"
    });
  }
);

export default deleteSiteController;
