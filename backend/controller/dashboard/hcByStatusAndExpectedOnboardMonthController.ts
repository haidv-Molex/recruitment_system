import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const hcByStatusAndExpectedOnboardMonthController = express.Router();

const joiQuery = Joi.object({
  status: Joi.string().required(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

/**
 * GET /dashboard/hc-by-status-month
 * Query params:
 *   - status: string (bắt buộc)
 *   - from: ISO Date (tùy chọn)
 *   - to: ISO Date (tùy chọn)
 * Output: ChartDataPoint[] — [{ label: "YYYY MonthName", value: number }]
 */
hcByStatusAndExpectedOnboardMonthController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const status = req.query.status as string;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const data = await withTransaction((pool) =>
      Dashboard.hcByStatusAndExpectedOnboardMonth({ status, from, to }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu HC theo status và tháng mong muốn onboard thành công",
      data,
    });
  }
);

export default hcByStatusAndExpectedOnboardMonthController;
