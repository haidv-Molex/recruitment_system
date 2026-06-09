import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Site from "@services/site/_Site";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteSiteController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã địa điểm phải là số",
    "number.integer": "Mã địa điểm phải là số nguyên",
    "number.positive": "Mã địa điểm phải là số dương",
    "any.required": "Mã địa điểm là bắt buộc"
  })
});

deleteSiteController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      await Site.delete(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa địa điểm thành công"
    });
  }
);

export default deleteSiteController;
