async function jwtTimeToSeconds(timeString: string): Promise<number> {
  // Lấy giá trị từ timeString hoặc mặc định là "30d"
  const input = timeString || "30d";

  // Biểu thức chính quy để tách số và đơn vị
  const match = input.match(/^(\d+)([smhdwMy])$/);
  if (!match) {
    throw new Error("Invalid time format. Expected format: <number><unit> (e.g., 30d, 1h, 15m)");
  }

  const value = parseInt(match[1], 10); // Giá trị số
  const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';

  // Quy đổi sang giây dựa trên đơn vị
  const conversions = {
    s: 1, // giây
    m: 60, // phút
    h: 60 * 60, // giờ
    d: 24 * 60 * 60, // ngày
    w: 7 * 24 * 60 * 60, // tuần
    M: 30 * 24 * 60 * 60, // tháng (giả định 30 ngày)
    y: 365 * 24 * 60 * 60, // năm (giả định 365 ngày)
  };

  if (!conversions[unit]) {
    throw new Error("Unsupported time unit. Use s, m, h, d, w, M, or y.");
  }

  return value * conversions[unit]
}

export default jwtTimeToSeconds