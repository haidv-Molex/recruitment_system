import express from "express";
import Joi from "joi";
import passport from "@middlewares/passport";
import joiValidate from "@middlewares/joiValidate";
import { AppError } from "@middlewares/AppError";
import { withTransaction } from "@middlewares/withTransaction";
import {
  createOpenPositionRequest,
  getOpenPositionRequestById,
  getOpenPositionRequests,
} from "@services/integration/openPositionRequestService";

const IntegrationController = express.Router();

const openPositionWebhookSchema = Joi.object({
  approval_id: Joi.string().max(255).empty("").allow(null).optional(),
  external_approval_id: Joi.string().max(255).empty("").allow(null).optional(),
  approval_status: Joi.string().max(50).empty("").default("Approved"),
  title: Joi.string().max(500).empty("").allow(null).optional(),
  requestor_name: Joi.string().max(255).empty("").allow(null).optional(),
  business_unit: Joi.string().max(255).empty("").allow(null).optional(),
  position_title: Joi.string().max(255).empty("").allow(null).optional(),
  contract_type: Joi.string().max(100).empty("").allow(null).optional(),
  employment_type: Joi.string().max(100).empty("").allow(null).optional(),
  cost_center: Joi.string().max(100).empty("").allow(null).optional(),
  report_to: Joi.string().max(255).empty("").allow(null).optional(),
  headcount_required: Joi.number().integer().min(0).empty("").allow(null).optional(),
  recruitment_reason: Joi.string().empty("").allow(null).optional(),
  support_project: Joi.string().max(255).empty("").allow(null).optional(),
  teams_link: Joi.string().uri().empty("").allow(null).optional(),
}).unknown(true);

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("").max(255).optional(),
});

const detailQuerySchema = Joi.object({
  id: Joi.number().integer().min(1).required(),
});

function requirePowerAutomateSecret(req: express.Request) {
  const configuredSecret = process.env.POWER_AUTOMATE_WEBHOOK_SECRET;
  if (!configuredSecret) {
    throw new AppError("Power Automate webhook secret is not configured", 500);
  }

  const providedSecret = req.header("x-power-automate-secret");
  if (!providedSecret || providedSecret !== configuredSecret) {
    throw new AppError("Invalid Power Automate webhook secret", 401);
  }
}

function getClientBaseUrl(req: express.Request) {
  return (
    process.env.CLIENT_URL?.split(",")[0]?.trim() ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
}

IntegrationController.post(
  "/power-automate/open-position",
  joiValidate(openPositionWebhookSchema, "body"),
  async (req, res) => {
    requirePowerAutomateSecret(req);

    const body = req.body;
    const saved = await withTransaction(async (pool) => {
      return createOpenPositionRequest(
        {
          external_approval_id: body.external_approval_id || body.approval_id || null,
          approval_status: body.approval_status || "Approved",
          title: body.title,
          requestor_name: body.requestor_name,
          business_unit: body.business_unit,
          position_title: body.position_title,
          contract_type: body.contract_type,
          employment_type: body.employment_type,
          cost_center: body.cost_center,
          report_to: body.report_to,
          headcount_required: body.headcount_required,
          recruitment_reason: body.recruitment_reason,
          support_project: body.support_project,
          teams_link: body.teams_link,
          raw_payload: body,
        },
        pool
      );
    });

    const url = `${getClientBaseUrl(req)}/open-position-requests/${saved.request_id}`;

    res.status(201).json({
      result: true,
      message: "Open position request synced successfully",
      data: {
        request: saved,
        url,
      },
    });
  }
);

IntegrationController.get(
  "/open-position-requests",
  passport.authenticate("jwt", { session: false }),
  joiValidate(listQuerySchema, "query"),
  async (req, res) => {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const search = String(req.query.search || "");

    const result = await withTransaction(async (pool) => {
      return getOpenPositionRequests({ page, limit, search }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Open position requests loaded successfully",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: Math.max(1, Math.ceil(result.total / limit)),
        total_items: result.total,
      },
    });
  }
);

IntegrationController.get(
  "/open-position-requests/:id",
  passport.authenticate("jwt", { session: false }),
  joiValidate(detailQuerySchema, "params"),
  async (req, res) => {
    const id = Number(req.params.id);
    const request = await withTransaction(async (pool) => {
      return getOpenPositionRequestById(id, pool);
    });

    if (!request) {
      throw new AppError("Open position request not found", 404);
    }

    res.status(200).json({
      result: true,
      message: "Open position request loaded successfully",
      data: request,
    });
  }
);

export default IntegrationController;
