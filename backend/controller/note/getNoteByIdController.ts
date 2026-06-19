import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getNoteByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã note phải là số",
    "number.integer": "Mã note phải là số nguyên",
    "number.positive": "Mã note phải là số dương",
    "any.required": "Mã note là bắt buộc"
  })
});

getNoteByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Note.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin note thành công",
      data: result
    });
  }
);

export default getNoteByIdController;