import express from "express";
import FileService from "@services/file/_File";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createFullWorkbookController = express.Router();

createFullWorkbookController.get("",
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const workbook = await withTransaction(async (pool) => {
            return await FileService.createFullWorkbook(pool);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="VIETNAM_IDL_RECRUITMENT_TRACKING.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    }
);

export default createFullWorkbookController;