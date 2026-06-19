import express from "express";
import joiValidate from "@middlewares/joiValidate";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { deleteQuerySchema } from "./validation";

const deleteCandidateDetailController = express.Router({ mergeParams: true });

deleteCandidateDetailController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(deleteQuerySchema, "query"),
  async (req, res) => {
    let ids: number[] = [];

    if (req.query.id) {
      ids.push(parseInt(req.query.id as string, 10));
    } else if (req.query.ids) {
      const idsQuery = req.query.ids;
      if (Array.isArray(idsQuery)) {
        ids = idsQuery.map((id) => parseInt(id as string, 10));
      } else if (typeof idsQuery === "string") {
        ids = idsQuery
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }
    }

    if (ids.length === 0) {
      return res.status(400).json({
        result: false,
        message: "Không có mã chi tiết ứng viên nào được cung cấp để xóa"
      });
    }

    await withTransaction(async (pool) => {
      await CandidateDetailService.delete(ids, pool);
    });

    res.status(200).json({
      result: true,
      message: ids.length === 1
        ? "Xóa chi tiết ứng viên thành công"
        : "Xóa các chi tiết ứng viên thành công"
    });
  }
);

export default deleteCandidateDetailController;