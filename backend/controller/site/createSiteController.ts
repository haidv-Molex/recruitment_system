import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Site from "@services/site/_Site";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createSiteController = express.Router();

const bodySchema = Joi.object({
  site_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã địa điểm tối đa 255 ký tự"
  }),
  site_name: Joi.string().max(255).required().messages({
    "any.required": "Tên địa điểm là bắt buộc",
    "string.empty": "Tên địa điểm không được để trống",
    "string.max": "Tên địa điểm tối đa 255 ký tự"
  }),
  site_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả địa điểm tối đa 255 ký tự"
  })
});

createSiteController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Site.create({
        site_code: req.body.site_code,
        site_name: req.body.site_name,
        site_description: req.body.site_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo địa điểm thành công",
      data: result
    });
  }
);

export default createSiteController;
