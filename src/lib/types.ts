export type UserRole =
  | "HEAD_OF_DEPARTMENT"
  | "SENIOR_MANAGER"
  | "MANAGER"
  | "ASSISTANT_MANAGER"
  | "SENIOR_EXECUTIVE";

export type ReleaseStatus =
  | "DRAFT" | "PENDING" | "APPROVED" | "DECLINED" | "TRANSLATING" | "PUBLISHED";

export type ReleaseType =
  | "STORE_OPENING" | "MILESTONE" | "CSR" | "AWARD" | "CAMPAIGN"
  | "PRODUCT_LAUNCH" | "PARTNERSHIP" | "ANNOUNCEMENT" | "OTHER";

export const ROLE_LABELS: Record<UserRole, string> = {
  HEAD_OF_DEPARTMENT: "Head of Department",
  SENIOR_MANAGER:     "Senior Manager",
  MANAGER:            "Manager",
  ASSISTANT_MANAGER:  "Assistant Manager",
  SENIOR_EXECUTIVE:   "Senior Executive",
};

export const ROLE_LEVEL: Record<UserRole, number> = {
  HEAD_OF_DEPARTMENT: 5,
  SENIOR_MANAGER:     4,
  MANAGER:            3,
  ASSISTANT_MANAGER:  2,
  SENIOR_EXECUTIVE:   1,
};

export function canPublishDirectly(role: string): boolean {
  return ["HEAD_OF_DEPARTMENT", "SENIOR_MANAGER", "MANAGER"].includes(role);
}

export function canApprove(role: string): boolean {
  return role === "HEAD_OF_DEPARTMENT";
}

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  STORE_OPENING:  "Store Opening",
  MILESTONE:      "Milestone",
  CSR:            "CSR",
  AWARD:          "Award",
  CAMPAIGN:       "Campaign",
  PRODUCT_LAUNCH: "Product Launch",
  PARTNERSHIP:    "Partnership",
  ANNOUNCEMENT:   "Announcement",
  OTHER:          "Other",
};

export const STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:       { label: "Draft",       color: "#94a3b8", bg: "#1e293b", border: "#334155" },
  PENDING:     { label: "Pending",     color: "#93c5fd", bg: "#1c2333", border: "#1d4ed8" },
  APPROVED:    { label: "Approved",    color: "#86efac", bg: "#052e16", border: "#166534" },
  DECLINED:    { label: "Declined",    color: "#fca5a5", bg: "#2d0a0a", border: "#991b1b" },
  TRANSLATING: { label: "Translating", color: "#fde68a", bg: "#1c1a00", border: "#92400e" },
  PUBLISHED:   { label: "Published",   color: "#67e8f9", bg: "#0c1a2e", border: "#0e7490" },
};

export const LANGUAGES = [
  { code: "en",    label: "English" },
  { code: "ms",    label: "Bahasa Malaysia" },
  { code: "th",    label: "Thai" },
  { code: "id",    label: "Bahasa Indonesia" },
  { code: "vi",    label: "Vietnamese" },
  { code: "zh-CN", label: "Chinese Simplified" },
  { code: "zh-TW", label: "Chinese Traditional" },
  { code: "ar",    label: "Arabic" },
  { code: "fr",    label: "French" },
  { code: "de",    label: "German" },
  { code: "es",    label: "Spanish" },
  { code: "ja",    label: "Japanese" },
  { code: "ko",    label: "Korean" },
  { code: "tl",    label: "Filipino" },
];

export const COUNTRIES = [
  { code: "MY", label: "Malaysia" },
  { code: "TH", label: "Thailand" },
  { code: "ID", label: "Indonesia" },
  { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" },
  { code: "SG", label: "Singapore" },
  { code: "BN", label: "Brunei" },
  { code: "MM", label: "Myanmar" },
  { code: "CN", label: "China" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "IN", label: "India" },
  { code: "AE", label: "UAE" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "AU", label: "Australia" },
  { code: "OTHER", label: "Other" },
];
