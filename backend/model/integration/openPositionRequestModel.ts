export type OpenPositionApprovalStatus = "Approved" | "Rejected" | "Pending" | string;

export type OpenPositionRequestModel = {
  request_id: number;
  external_approval_id: string | null;
  approval_status: OpenPositionApprovalStatus;
  title: string | null;
  requestor_name: string | null;
  business_unit: string | null;
  position_title: string | null;
  contract_type: string | null;
  employment_type: string | null;
  cost_center: string | null;
  report_to: string | null;
  headcount_required: number | null;
  recruitment_reason: string | null;
  support_project: string | null;
  teams_link: string | null;
  raw_payload: Record<string, any>;
  job_id: number | null;
  create_at: Date;
  update_at: Date;
};

export type CreateOpenPositionRequestInput = {
  external_approval_id?: string | null;
  approval_status: OpenPositionApprovalStatus;
  title?: string | null;
  requestor_name?: string | null;
  business_unit?: string | null;
  position_title?: string | null;
  contract_type?: string | null;
  employment_type?: string | null;
  cost_center?: string | null;
  report_to?: string | null;
  headcount_required?: number | null;
  recruitment_reason?: string | null;
  support_project?: string | null;
  teams_link?: string | null;
  raw_payload: Record<string, any>;
};
