import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(date: string | Date, fmt = "d MMM yyyy") {
  return format(new Date(date), fmt);
}
export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
export function countryFlag(code: string) {
  if (!code || code === "OTHER") return "🌐";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
