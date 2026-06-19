import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Access from "@services/access/_Access";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const deleteAccessController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().optional().messages({
    "number.base": "Mã phân quyền phải là số",
    "number.integer": "Mã phân quyền phải là số nguyên",
    "number.positive": "Mã phân quyền phải là số dương"
  }),
  ids: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number().integer().positive())
  ).optional().messages({
    "any.only": "Danh sách mã phân quyền không hợp lệ"
  })
}).or('id', 'ids');

deleteAccessController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;

    // Chỉ Admin mới được phép thao tác phân quyền
    if (requestor.user_role !== "admin") {
      throw new AppError("Chỉ Admin mới có quyền quản lý phân quyền", 403);
    }

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
        message: "Không có mã phân quyền nào được cung cấp để xóa"
      });
    }

    await withTransaction(async (pool) => {
      await Access.deleteAccess(ids, pool);
    }, requestor);

    res.status(200).json({
      result: true,
      message: ids.length === 1 ? "Xóa phân quyền thành công" : "Xóa các phân quyền thành công"
    });
  }
);

export default deleteAccessController;
