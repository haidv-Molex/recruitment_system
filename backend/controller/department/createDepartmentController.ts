import express from "express";
import Joi from "joi";
import type { PoolClient } from "pg";
import joiValidate from "@middlewares/joiValidate";
import Department from "@services/department/_Department";
import User from "@services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createDepartmentController = express.Router();

async function resolveDepartmentUserId(
  userId: number | null | undefined,
  userName: string | null | undefined,
  pool: PoolClient
): Promise<number | null> {
  if (userId !== undefined && userId !== null) {
    return userId;
  }

  const trimmedUserName = typeof userName === "string" ? userName.trim() : "";
  if (!trimmedUserName) {
    return null;
  }

  const existingUser = await pool.query(
    `SELECT user_id FROM "user" WHERE LOWER(user_name) = LOWER($1) ORDER BY user_id ASC LIMIT 1`,
    [trimmedUserName]
  );
  if (existingUser.rows.length > 0) {
    return existingUser.rows[0].user_id;
  }

  const newUser = await User.create({ username: trimmedUserName }, pool);
  return newUser.user_id;
}

const bodySchema = Joi.object({
  department_code: Joi.string().max(255).required().messages({
    "any.required": "Mã phòng ban là bắt buộc",
    "string.empty": "Mã phòng ban không được để trống",
    "string.max": "Mã phòng ban tối đa 255 ký tự"
  }),
  department_name: Joi.string().max(255).required().messages({
    "any.required": "Tên phòng ban là bắt buộc",
    "string.empty": "Tên phòng ban không được để trống",
    "string.max": "Tên phòng ban tối đa 255 ký tự"
  }),
  department_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả phòng ban tối đa 255 ký tự"
  }),
  user_id: Joi.number().integer().optional().allow(null),
  user_name: Joi.string().max(255).optional().allow("", null).messages({
    "string.max": "Tên HRBP tối đa 255 ký tự"
  })
});

createDepartmentController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      const userId = await resolveDepartmentUserId(req.body.user_id, req.body.user_name, pool);

      return await Department.create({
        department_code: req.body.department_code,
        department_name: req.body.department_name,
        department_description: req.body.department_description,
        user_id: userId
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo phòng ban thành công",
      data: result
    });
  }
);

export default createDepartmentController;
