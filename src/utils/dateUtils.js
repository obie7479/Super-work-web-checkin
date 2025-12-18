/**
 * แปลงวันที่เป็นรูปแบบ YYYY-MM-DD
 */
export function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * แปลงเวลาเป็นรูปแบบ HH:MM:SS
 */
export function formatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * ตรวจสอบว่าวันที่สองวันเป็นวันเดียวกันหรือไม่
 */
export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2);
}

