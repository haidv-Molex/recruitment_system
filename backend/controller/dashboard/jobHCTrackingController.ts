import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const jobHCTrackingController = express.Router();

const joiQuery = Joi.object({
  department_id: Joi.number().integer().optional(),
});

/**
 * GET /dashboard/job-hc-tracking
 * Query params:
 *   - department_id: integer (tùy chọn)
 * Output: JobHCTracking[] — [{ job_id, job_title, candidate_required, closed_count, open_count }]
 */
jobHCTrackingController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const department_id = req.query.department_id ? Number(req.query.department_id) : undefined;

    const data = await withTransaction((pool) =>
      Dashboard.jobHCTracking({ department_id }, pool)
    , req.user);

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu theo dõi headcount thành công",
      data,
    });
  }
);

export default jobHCTrackingController;
