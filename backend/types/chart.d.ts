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