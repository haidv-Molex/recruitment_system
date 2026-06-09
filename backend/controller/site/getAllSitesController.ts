import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Site from "@services/site/_Site";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getAllSitesController = express.Router();

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(10),
  unlimited: Joi.boolean().optional().default(false),
  search: Joi.string().optional().allow("").max(255)
});

getAllSitesController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const unlimited = query.unlimited === true;
    const search = query.search;

    const result = await withTransaction(async (pool) => {
      return await Site.getAll({ page, limit, unlimited, search }, pool);
    });

    const totalPages = unlimited ? 1 : Math.ceil(result.total / limit);

    res.status(200).json({
      result: true,
      message: "Lấy danh sách địa điểm thành công",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: result.total
      }
    });
  }
);

export default getAllSitesController;
