import express from "express";
import joiValidate from "@middlewares/joiValidate";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { searchQuerySchema } from "./validation";

const getAllCandidateDetailsController = express.Router();

getAllCandidateDetailsController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(searchQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const unlimited = query.unlimited === true;

    const result = await withTransaction(async (pool) => {
      return await CandidateDetailService.getAll({
        ...query,
        page,
        limit,
        unlimited
      }, pool);
    });

    const totalPages = unlimited ? 1 : Math.ceil(result.total / limit) || 1;

    res.status(200).json({
      result: true,
      message: "Lấy danh sách chi tiết ứng viên thành công",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: result.total
      }
    });
  }
);

export default getAllCandidateDetailsController;