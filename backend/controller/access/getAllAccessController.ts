import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Access from "@services/access/_Access";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const getAllAccessController = express.Router();

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(10),
  unlimited: Joi.boolean().optional().default(false),
  user_id: Joi.number().integer().positive().optional(),
  candidate_id: Joi.number().integer().positive().optional(),
  job_id: Joi.number().integer().positive().optional(),
});

getAllAccessController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ Admin mới được phép xem danh sách phân quyền
    if (requestor.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền xem danh sách phân quyền", 403);
    }

    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const unlimited = query.unlimited === true;
    const user_id = query.user_id ? Number(query.user_id) : undefined;
    const candidate_id = query.candidate_id ? Number(query.candidate_id) : undefined;
    const job_id = query.job_id ? Number(query.job_id) : undefined;

    const result = await withTransaction(async (pool) => {
      return await Access.getAll({ page, limit, unlimited, user_id, candidate_id, job_id }, pool);
    }, requestor);

    const totalPages = unlimited ? 1 : Math.ceil(result.total / limit);

    res.status(200).json({
      result: true,
      message: "Lấy danh sách phân quyền thành công",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: result.total
      }
    });
  }
);

export default getAllAccessController;
