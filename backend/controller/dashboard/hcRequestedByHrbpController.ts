import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const hcRequestedByHrbpController = express.Router();

const joiQuery = Joi.object({
  job_id: Joi.number().integer().optional(),
  department_id: Joi.number().integer().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

/**
 * GET /dashboard/hc-by-hrbp
 * Query params:
 *   - job_id: integer (tùy chọn)
 *   - department_id: integer (tùy chọn)
 *   - from: ISO Date (tùy chọn)
 *   - to: ISO Date (tùy chọn)
 * Output: ChartDataPoint[] — [{ label: "HRBPName", value: number }]
 */
hcRequestedByHrbpController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const job_id = req.query.job_id ? Number(req.query.job_id) : undefined;
    const department_id = req.query.department_id ? Number(req.query.department_id) : undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const data = await withTransaction((pool) =>
      Dashboard.hcRequestedByHrbp({ job_id, department_id, from, to }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu HC yêu cầu theo HRBP thành công",
      data,
    });
  }
);

export default hcRequestedByHrbpController;
