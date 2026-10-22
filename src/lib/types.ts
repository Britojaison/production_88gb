export const ROLES = ["VIDEO_TEAM", "MANAGEMENT"] as const;
export type Role = (typeof ROLES)[number];

export const EXPENSE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const ExpenseStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const satisfies Record<ExpenseStatus, ExpenseStatus>;

export const SHOOT_STATUSES = ["PLANNED", "ACTIVE", "WRAPPED"] as const;
export type ShootStatus = (typeof SHOOT_STATUSES)[number];

export const ShootStatus = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  WRAPPED: "WRAPPED",
} as const satisfies Record<ShootStatus, ShootStatus>;
