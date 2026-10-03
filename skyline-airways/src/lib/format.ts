import { format } from "date-fns";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "HH:mm");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy · HH:mm");
}

export function durationLabel(start: Date | string, end: Date | string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
