import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const hcRequestedByMonthController = express.Router();

const joiQuery = Joi.object({
  department_id: Joi.number().integer().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

/**
 * GET /dashboard/hc-by-month
 * Query params:
 *   - department_id: integer (tùy chọn)
 *   - from: ISO Date (tùy chọn)
 *   - to: ISO Date (tùy chọn)
 * Output: ChartDataPoint[] — [{ label: "YYYY MonthName", value: number }]
 */
hcRequestedByMonthController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const department_id = req.query.department_id ? Number(req.query.department_id) : undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const data = await withTransaction((pool) =>
      Dashboard.hcRequestedByMonth({ department_id, from, to }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu HC yêu cầu theo tháng thành công",
      data,
    });
  }
);

export default hcRequestedByMonthController;
