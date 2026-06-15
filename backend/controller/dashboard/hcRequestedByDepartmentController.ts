import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const hcRequestedByDepartmentController = express.Router();

const joiQuery = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

/**
 * GET /dashboard/hc-by-department?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * from & to là tuỳ chọn. Nếu không truyền → lấy toàn bộ dữ liệu.
 * Output: ChartDataPoint[] — [{ label, value }]
 */
hcRequestedByDepartmentController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const data = await withTransaction((pool) =>
      Dashboard.hcRequestedByDepartment({ from, to }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu HC theo phòng ban thành công",
      data,
    });
  }
);

export default hcRequestedByDepartmentController;
