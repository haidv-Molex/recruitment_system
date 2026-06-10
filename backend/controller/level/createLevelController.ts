import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Level from "@services/level/_Level";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createLevelController = express.Router();

const bodySchema = Joi.object({
  level_code: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mã cấp bậc tối đa 255 ký tự"
  }),
  level_name: Joi.string().max(255).required().messages({
    "any.required": "Tên cấp bậc là bắt buộc",
    "string.empty": "Tên cấp bậc không được để trống",
    "string.max": "Tên cấp bậc tối đa 255 ký tự"
  }),
  level_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả cấp bậc tối đa 255 ký tự"
  })
});

createLevelController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Level.create({
        level_code: req.body.level_code,
        level_name: req.body.level_name,
        level_description: req.body.level_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo cấp bậc thành công",
      data: result
    });
  }
);

export default createLevelController;
