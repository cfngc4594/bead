import { formatDistanceStrict } from "date-fns";
import { zhCN } from "date-fns/locale";

const minute = 60_000;

export function formatRelativeTime(timestamp: number, now = Date.now()) {
  if (Math.abs(timestamp - now) < minute) {
    return "刚刚";
  }

  return formatDistanceStrict(timestamp, now, {
    addSuffix: true,
    locale: zhCN,
  });
}
