import express from "express";
import FileService from "@services/file/_File";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createValidationSheetController = express.Router();

createValidationSheetController.get("",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const workbook = await withTransaction(async (pool) => {
      return await FileService.createValidationSheet(pool);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="excelTemplate.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  }
);

export default createValidationSheetController;
