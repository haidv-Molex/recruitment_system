import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Audit from "@services/audit/_Audit";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const rollbackAuditController = express.Router();

const bodySchema = Joi.object({
  audit_log_id: Joi.number().integer().positive().required().messages({
    "any.required": "ID lịch sử log là bắt buộc",
    "number.base": "ID lịch sử log phải là số"
  }),
});

rollbackAuditController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ Admin mới được phép thực hiện rollback dữ liệu
    if (requestor.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền thực hiện hoàn tác dữ liệu", 403);
    }

    const { audit_log_id } = req.body;

    await withTransaction(async (pool) => {
      return await Audit.rollback({ auditLogId: audit_log_id }, pool);
    }, requestor);

    res.status(200).json({
      result: true,
      message: "Hoàn tác dữ liệu thành công"
    });
  }
);

export default rollbackAuditController;
