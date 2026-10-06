import type { UserRole } from "@/lib/types";

/**
 * Capability-based RBAC for The Global Feed.
 *
 * Every API route and server component checks a capability string, never a
 * role literal directly. Adding or adjusting a role is a one-line change
 * inside ROLE_CAPABILITIES — nothing else needs touching.
 *
 * Permission table (from the agreed org hierarchy):
 *
 * Capability              │ HOD │ SM  │ Mgr │ AM  │ SE  │
 * ────────────────────────┼─────┼─────┼─────┼─────┼─────┤
 * releases:view           │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
 * releases:submit         │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
 * releases:publish        │  ✓  │  ✓  │  ✓  │  ✗  │  ✗  │ (skip approval)
 * releases:approve        │  ✓  │  ✗  │  ✗  │  ✗  │  ✗  │
 * translations:view       │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
 * translations:manage     │  ✓  │  ✗  │  ✗  │  ✗  │  ✗  │
 * users:view              │  ✓  │  ✓  │  ✗  │  ✗  │  ✗  │
 * users:manage            │  ✓  │  ✓  │  ✗  │  ✗  │  ✗  │
 * users:create            │  ✓  │  ✓  │  ✗  │  ✗  │  ✗  │
 * settings:manage         │  ✓  │  ✗  │  ✗  │  ✗  │  ✗  │
 * audit:view              │  ✓  │  ✓  │  ✗  │  ✗  │  ✗  │
 *
 * NOTE – Joget sync:
 *   When Joget integration is added, map Joget group names → UserRole values
 *   via roleFromGroups() below. The capability matrix above stays unchanged.
 */

// ─── Capability registry ──────────────────────────────────────────────────────

export const CAPABILITIES = [
  "releases:view",        // view any release in the system
  "releases:submit",      // create a draft and submit for review
  "releases:publish",     // submit directly without HOD approval (Manager and above)
  "releases:approve",     // approve or decline a PENDING release (HOD only)
  "translations:view",    // view translation status and results
  "translations:manage",  // trigger / manage n8n translation jobs
  "users:view",           // view the user list and user details
  "users:manage",         // edit roles, activate/deactivate accounts
  "users:create",         // create new user accounts
  "settings:manage",      // platform-wide settings (HOD only)
  "audit:view",           // read the activity log
] as const;

export type Capability = (typeof CAPABILITIES)[number];

// ─── Role → Capability map ────────────────────────────────────────────────────

const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  HEAD_OF_DEPARTMENT: [
    "releases:view",
    "releases:submit",
    "releases:publish",
    "releases:approve",
    "translations:view",
    "translations:manage",
    "users:view",
    "users:manage",
    "users:create",
    "settings:manage",
    "audit:view",
  ],
  SENIOR_MANAGER: [
    "releases:view",
    "releases:submit",
    "releases:publish",
    "translations:view",
    "users:view",
    "users:manage",
    "users:create",
    "audit:view",
  ],
  MANAGER: [
    "releases:view",
    "releases:submit",
    "releases:publish",
    "translations:view",
  ],
  ASSISTANT_MANAGER: [
    "releases:view",
    "releases:submit",
    "translations:view",
  ],
  SENIOR_EXECUTIVE: [
    "releases:view",
    "releases:submit",
    "translations:view",
  ],
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Returns true if the given role has the requested capability. */
export function can(
  role: UserRole | string | undefined | null,
  capability: Capability
): boolean {
  if (!role) return false;
  return (ROLE_CAPABILITIES[role as UserRole] ?? []).includes(capability);
}

/** Returns true if the given role has ANY of the requested capabilities. */
export function canAny(
  role: UserRole | string | undefined | null,
  capabilities: Capability[]
): boolean {
  return capabilities.some((c) => can(role, c));
}

/** Returns the full capability list for a role (useful for debugging/display). */
export function capabilitiesFor(role: UserRole): readonly Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

// ─── Role hierarchy (for user-management privilege checks) ───────────────────
// Higher number = more authority. An actor can only assign/edit roles
// strictly below their own level.

export const ROLE_LEVEL: Record<UserRole, number> = {
  HEAD_OF_DEPARTMENT: 5,
  SENIOR_MANAGER:     4,
  MANAGER:            3,
  ASSISTANT_MANAGER:  2,
  SENIOR_EXECUTIVE:   1,
};

/**
 * Can the actor assign `targetRole` to another user?
 * Actors may only assign roles strictly below their own level.
 */
export function canAssignRole(
  actorRole: UserRole | string,
  targetRole: UserRole | string
): boolean {
  const actorLevel  = ROLE_LEVEL[actorRole  as UserRole] ?? 0;
  const targetLevel = ROLE_LEVEL[targetRole as UserRole] ?? 0;
  return actorLevel > targetLevel;
}

/**
 * Can the actor edit the target user's record?
 * HOD: anyone. Senior Manager: anyone strictly below Manager level.
 */
export function canEditUser(
  actorRole: UserRole | string,
  targetRole: UserRole | string
): boolean {
  if (actorRole === "HEAD_OF_DEPARTMENT") return true;
  if (actorRole === "SENIOR_MANAGER") {
    return (ROLE_LEVEL[targetRole as UserRole] ?? 0) < ROLE_LEVEL["MANAGER"];
  }
  return false;
}

/** Can the actor deactivate / reactivate the target user? Same as canEditUser. */
export function canToggleUser(
  actorRole: UserRole | string,
  targetRole: UserRole | string
): boolean {
  return canEditUser(actorRole, targetRole);
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/** Where to land after sign-in based on role. */
export function landingPathFor(role: UserRole | string): string {
  return role === "HEAD_OF_DEPARTMENT" ? "/dashboard/approvals" : "/dashboard";
}

// ─── Display labels ───────────────────────────────────────────────────────────

export const ROLE_LABEL: Record<UserRole, string> = {
  HEAD_OF_DEPARTMENT: "Head of Department",
  SENIOR_MANAGER:     "Senior Manager",
  MANAGER:            "Manager",
  ASSISTANT_MANAGER:  "Assistant Manager",
  SENIOR_EXECUTIVE:   "Senior Executive",
};

// ─── Joget / LDAP group-to-role mapping (ready for future sync) ───────────────
/**
 * Derive the highest-privilege UserRole from a list of external group names.
 * Configured via JOGET_GROUP_ROLE_MAP (or LDAP_GROUP_ROLE_MAP) env var.
 *
 * Format: "GroupName:ROLE,AnotherGroup:ROLE"
 * Example: "HOD-Communications:HEAD_OF_DEPARTMENT,Comms-SM:SENIOR_MANAGER"
 *
 * Groups not listed fall through to SENIOR_EXECUTIVE.
 * Parsed once at module load.
 */
function buildGroupRoleMap(): Record<string, UserRole> {
  const raw =
    process.env.JOGET_GROUP_ROLE_MAP ??
    process.env.LDAP_GROUP_ROLE_MAP  ??
    "";

  const validRoles = new Set<string>(Object.keys(ROLE_LEVEL));
  const map: Record<string, UserRole> = {};

  for (const pair of raw.split(",")) {
    const [group, role] = pair.split(":").map((s) => s.trim());
    if (!group || !role) continue;
    if (!validRoles.has(role)) continue;
    map[group.toLowerCase()] = role as UserRole;
  }
  return map;
}

const GROUP_ROLE_MAP = buildGroupRoleMap();

const ROLE_PRIORITY: UserRole[] = [
  "HEAD_OF_DEPARTMENT",
  "SENIOR_MANAGER",
  "MANAGER",
  "ASSISTANT_MANAGER",
  "SENIOR_EXECUTIVE",
];

/** Highest-privilege role implied by a user's external group memberships. */
export function roleFromGroups(groups: string[] | undefined | null): UserRole {
  const matched = new Set(
    (groups ?? [])
      .map((g) => GROUP_ROLE_MAP[g.trim().toLowerCase()])
      .filter((r): r is UserRole => Boolean(r))
  );
  return ROLE_PRIORITY.find((role) => matched.has(role)) ?? "SENIOR_EXECUTIVE";
}
