import { User } from '../types';

/**
 * Zitel Castle School Role Hierarchy:
 * 1. SUPER ADMIN (Highest system-level authority, full governance, manages branches & admins)
 * 2. DIRECTOR (Admin-level role with cross-branch visibility & switching across all branches)
 * 3. BRANCH ADMIN (Scoped strictly to a single assigned branch)
 * 4. TEACHERS / BURSARS / OTHER BRANCH STAFF (Scoped strictly to a single assigned branch)
 */

export function isSuperAdmin(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

export function isDirector(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return false; // Super admin is Super Admin
  if (user.role === 'DIRECTOR' || user.adminRoleType === 'DIRECTOR') return true;
  if (user.role === 'ADMIN') {
    const title = (user.customRoleTitle || '').toLowerCase();
    if (title.includes('director') && !title.includes('super admin')) return true;
    if (
      user.scope === 'ALL_SCHOOL' &&
      (!user.branchId || user.branchId === 'all') &&
      !isBursar(user)
    ) {
      return true;
    }
  }
  return false;
}

export function isBursar(user?: User | null): boolean {
  if (!user) return false;
  return (
    user.scope === 'FINANCE_ONLY' ||
    user.adminRoleType === 'BURSAR' ||
    Boolean(user.customRoleTitle?.toLowerCase().includes('bursar')) ||
    user.id === 'user_admin_finance' ||
    user.email?.toLowerCase().includes('bursar') === true
  );
}

export function isBranchAdmin(user?: User | null): boolean {
  if (!user) return false;
  if (user.role !== 'ADMIN' && (user.role as string) !== 'BRANCH_ADMIN') return false;
  if (isSuperAdmin(user) || isDirector(user) || isBursar(user)) return false;
  return true;
}

export function isTeacher(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'TEACHER';
}

/**
 * Returns true ONLY for Super Admin and Director.
 * Teachers, Bursars, Branch Admins, and other branch-level users must NOT have branch-switching access.
 */
export function canSwitchBranches(user?: User | null): boolean {
  if (!user) return false;
  return isSuperAdmin(user) || isDirector(user);
}

/**
 * Resolves the effective branch ID for a user.
 * For branch-isolated users (Branch Admin, Teacher, Bursar, Student, Parent),
 * this ALWAYS returns their assigned branchId.
 * For Super Admin and Director, this returns the global active branch selection.
 */
export function getEffectiveBranchId(user?: User | null, globalActiveBranchId?: string): string {
  if (!user) return globalActiveBranchId || 'all';
  if (canSwitchBranches(user)) {
    return globalActiveBranchId || 'all';
  }
  return user.branchId || 'branch_bungalow';
}

/**
 * Formats a user's role title according to the official institutional hierarchy.
 */
export function getHierarchyBadge(user?: User | null): {
  label: string;
  badgeClass: string;
  scopeLabel: string;
} {
  if (!user) {
    return { label: 'Guest', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', scopeLabel: 'Restricted' };
  }

  if (isSuperAdmin(user)) {
    return {
      label: 'Super Admin',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      scopeLabel: 'Institutional Master Authority (All Branches)',
    };
  }

  if (isDirector(user)) {
    return {
      label: 'Academic Director',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      scopeLabel: 'Cross-Branch Oversight (All Branches)',
    };
  }

  if (isBursar(user)) {
    return {
      label: 'Bursar',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      scopeLabel: user.branchName ? `${user.branchName} Bursary` : 'Branch Bursary',
    };
  }

  if (isBranchAdmin(user)) {
    return {
      label: 'Branch Admin',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      scopeLabel: user.branchName ? `${user.branchName} Only` : 'Assigned Branch Only',
    };
  }

  if (isTeacher(user)) {
    return {
      label: 'Teaching Staff / Teacher',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      scopeLabel: user.branchName ? `${user.branchName} Only` : 'Assigned Branch Only',
    };
  }

  if (user.role === 'PARENT') {
    return {
      label: 'Parent / Guardian',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      scopeLabel: 'Ward Linkage',
    };
  }

  if (user.role === 'STUDENT') {
    return {
      label: 'Student',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      scopeLabel: user.branchName || 'Enrolled Branch',
    };
  }

  return {
    label: user.customRoleTitle || user.role,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    scopeLabel: 'Branch Staff',
  };
}

/**
 * Asserts that the actor has permissions to manage entities or data in the target branch.
 * Super Admins and Directors have institutional-wide (cross-branch) authority.
 * Branch Admins, Bursars, Teachers, etc. are strictly isolated to their assigned branch.
 */
export function assertBranchAccess(
  actor: User,
  targetBranchId?: string | null,
  actionDescription = 'perform this operation'
): void {
  if (isSuperAdmin(actor) || isDirector(actor)) {
    return; // Institutional level clearance
  }

  const actorBranchId = actor.branchId;
  if (!actorBranchId) {
    throw new Error(
      `Unauthorized: Administrator "${actor.name}" has no assigned branch and cannot ${actionDescription}.`
    );
  }

  if (targetBranchId && targetBranchId !== 'all' && targetBranchId !== actorBranchId) {
    throw new Error(
      `Unauthorized: Access Denied. Branch Administrators are prohibited from ${actionDescription} outside their assigned branch (${actor.branchName || actorBranchId}). Target branch: ${targetBranchId}.`
    );
  }
}

/**
 * Asserts that the actor is authorized to create, update, or delete the target user record.
 * Prevents Branch Admins from manipulating Super Admins, Academic Directors, or users in other branches.
 */
export function assertUserManagementAccess(
  actor: User,
  targetUser?: Partial<User> | null,
  actionDescription = 'manage this user account'
): void {
  if (isSuperAdmin(actor)) {
    return; // Super Admin has universal user governance
  }

  if (isDirector(actor)) {
    // Academic Director can manage Branch Admins, Teachers, Students, Parents across all branches,
    // but cannot alter or delete Super Administrator accounts.
    if (targetUser && (targetUser.role === 'SUPER_ADMIN' || isSuperAdmin(targetUser as User))) {
      throw new Error(
        `Unauthorized: Academic Directors cannot ${actionDescription} for Super Administrator accounts.`
      );
    }
    return;
  }

  if (targetUser) {
    // 1. Prohibit modifying Super Admin or Director accounts
    if (targetUser.role === 'SUPER_ADMIN' || isSuperAdmin(targetUser as User)) {
      throw new Error(
        `Unauthorized: Branch Administrators cannot ${actionDescription} for Super Administrator accounts.`
      );
    }
    if (
      targetUser.role === 'DIRECTOR' ||
      targetUser.adminRoleType === 'DIRECTOR' ||
      isDirector(targetUser as User)
    ) {
      throw new Error(
        `Unauthorized: Branch Administrators cannot ${actionDescription} for Academic Director accounts.`
      );
    }

    // 2. Prohibit managing accounts belonging to other branches
    const actorBranchId = actor.branchId;
    if (targetUser.branchId && targetUser.branchId !== 'all' && targetUser.branchId !== actorBranchId) {
      throw new Error(
        `Unauthorized: Branch Administrators are prohibited from ${actionDescription} for users outside their assigned branch (${actor.branchName || actorBranchId}). User branch: ${targetUser.branchId}.`
      );
    }
  }
}
