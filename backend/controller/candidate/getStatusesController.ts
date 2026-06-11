import express from "express";
import passport from "@middlewares/passport";
import { withTransaction } from "@middlewares/withTransaction";
import Candidate from "@services/candidate/_Candidate";

const getStatusesController = express.Router();

/**
 * GET /candidate/statuses
 * Trả về danh sách status duy nhất từ DB
 */
getStatusesController.get("",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const data = await withTransaction((pool) => Candidate.getStatuses(pool));

        res.status(200).json({
            result: true,
            message: "Lấy danh sách status thành công",
            data,
        });
    }
);

export default getStatusesController;