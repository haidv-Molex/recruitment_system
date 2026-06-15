/** Khoảng thời gian đầu vào — cả hai đều optional. Không truyền = không lọc theo ngày */
export type ChartDateRange = {
  from?: Date;
  to?: Date;
};

/** Dữ liệu chart — BE chỉ trả { label, value }[], FE tự tính total và render */
export type ChartDataPoint = {
  label: string;
  value: number;
};

/** Thông tin theo dõi headcount của từng Job */
export type JobHCTracking = {
  job_id: number;
  job_title: string;
  candidate_required: number;
  closed_count: number;
  open_count: number;
};