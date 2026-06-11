import express from "express";
import passport from "@middlewares/passport";
import { withTransaction } from "@middlewares/withTransaction";
import Candidate from "@services/candidate/_Candidate";

const getAgenciesController = express.Router();

/**
 * GET /candidate/agencies
 * Trả về danh sách agency duy nhất từ DB
 */
getAgenciesController.get("",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const data = await withTransaction((pool) => Candidate.getAgencies(pool));

        res.status(200).json({
            result: true,
            message: "Lấy danh sách agency thành công",
            data,
        });
    }
);

export default getAgenciesController;