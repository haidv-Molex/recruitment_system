import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Site from "@services/site/_Site";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateSiteController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã địa điểm phải là số",
    "number.integer": "Mã địa điểm phải là số nguyên",
    "number.positive": "Mã địa điểm phải là số dương",
    "any.required": "Mã địa điểm là bắt buộc"
  })
});

const bodySchema = Joi.object({
  site_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã địa điểm tối đa 255 ký tự"
  }),
  site_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên địa điểm không được để trống",
    "string.max": "Tên địa điểm tối đa 255 ký tự"
  }),
  site_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả địa điểm tối đa 255 ký tự"
  })
}).or("site_code", "site_name", "site_description").messages({
  "object.missing": "Phải cung cấp ít nhất mã địa điểm, tên hoặc mô tả để cập nhật"
});

updateSiteController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Site.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin địa điểm thành công",
      data: result
    });
  }
);

export default updateSiteController;
