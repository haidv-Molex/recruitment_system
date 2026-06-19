import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getAllNotesController = express.Router();

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(10),
  unlimited: Joi.boolean().optional().default(false),
  search: Joi.string().optional().allow("").max(255),
  user_id: Joi.number().integer().positive().optional(),
  candidate_id: Joi.number().integer().positive().optional(),
  job_id: Joi.number().integer().positive().optional()
});

getAllNotesController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const unlimited = query.unlimited === true;

    const result = await withTransaction(async (pool) => {
      return await Note.getAll({
        page,
        limit,
        unlimited,
        search: query.search,
        user_id: query.user_id !== undefined ? Number(query.user_id) : undefined,
        candidate_id: query.candidate_id !== undefined ? Number(query.candidate_id) : undefined,
        job_id: query.job_id !== undefined ? Number(query.job_id) : undefined
      }, pool);
    });

    const totalPages = unlimited ? 1 : Math.ceil(result.total / limit);

    res.status(200).json({
      result: true,
      message: "Lấy danh sách note thành công",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: result.total
      }
    });
  }
);

export default getAllNotesController;