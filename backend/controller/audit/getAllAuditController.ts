import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Audit from "@services/audit/_Audit";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const getAllAuditController = express.Router();

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(20),
  table_name: Joi.string().max(255).optional().allow(""),
  action: Joi.string().max(255).optional().allow(""),
  record_id: Joi.number().integer().positive().optional(),
  search: Joi.string().max(255).optional().allow(""),
});

getAllAuditController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ Admin hoặc HR mới được phép xem lịch sử log (hoặc có thể giới hạn Admin)
    // Để HRBP/Recruiter quản lý, cho phép admin và hr xem
    if (requestor.user_role !== "admin" && requestor.user_role !== "hr") {
      throw new AppError("Bạn không có quyền xem lịch sử log", 403);
    }

    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const table_name = query.table_name || undefined;
    const action = query.action || undefined;
    const record_id = query.record_id ? Number(query.record_id) : undefined;
    const search = query.search || undefined;

    const result = await withTransaction(async (pool) => {
      return await Audit.getAll({ page, limit, table_name, action, record_id, search }, pool);
    }, requestor);

    res.status(200).json({
      result: true,
      message: "Lấy nhật ký log thành công",
      data: result.data,
      pagination: result.pagination
    });
  }
);

export default getAllAuditController;
