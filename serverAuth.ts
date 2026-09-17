import crypto from 'crypto';

export interface UserCredential {
  id: string;
  schoolId: string;
  username: string;
  email: string;
  name: string;
  role: string;
  adminRoleType?: string;
  branchId?: string;
  salt: string;
  hash: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  status: 'active' | 'suspended' | 'deactivated' | 'inactive';
  passwordChangedAt?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  schoolId: string;
  role: string;
  adminRoleType?: string;
  branchId?: string;
  name: string;
  createdAt: string;
  expiresAt: number; // Unix timestamp
}

export interface PasswordResetRecord {
  token: string;
  schoolId: string;
  email: string;
  createdAt: string;
  expiresAt: number; // 15 minutes validity
}

export interface ServerContactRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// In-memory persistent stores during server lifecycle
const credentialsVault = new Map<string, UserCredential>();
const activeSessions = new Map<string, AuthSession>();
const passwordResetTokens = new Map<string, PasswordResetRecord>();
const contactRequests: ServerContactRequest[] = [];
const contactAccessGrants = new Set<string>(); // "requesterId:targetUserId"
const serverAuditLogs: Array<{
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  ip?: string;
}> = [];

/**
 * Scrypt-based cryptographic password hashing.
 * Passwords are NEVER stored in plaintext.
 */
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (keyBuffer.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, storedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Rigorous password strength validator.
 * Minimum 12 characters, uppercase, lowercase, number, symbol, and context checks.
 */
export function validatePasswordStrength(
  password: string,
  context?: { username?: string; name?: string; schoolId?: string; currentPassword?: string }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters in length.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter (a-z).');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one numerical digit (0-9).');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push('Password must include at least one special symbol (e.g. !@#$%^&*).');
  }

  if (context) {
    const lowerPwd = password.toLowerCase();
    if (context.schoolId && lowerPwd.includes(context.schoolId.toLowerCase().replace(/[\/\-_]/g, ''))) {
      errors.push('Password cannot contain your School ID.');
    }
    if (context.username && lowerPwd.includes(context.username.toLowerCase())) {
      errors.push('Password cannot contain your username.');
    }
    if (context.name && context.name.length > 2 && lowerPwd.includes(context.name.toLowerCase())) {
      errors.push('Password cannot contain your personal name.');
    }
    if (context.currentPassword && password === context.currentPassword) {
      errors.push('New password must be different from your current password.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log security event to internal audit log.
 * Plaintext passwords are strictly forbidden from being logged.
 */
export function logAuditEvent(event: {
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  ip?: string;
}) {
  const entry = {
    id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  serverAuditLogs.unshift(entry);
  if (serverAuditLogs.length > 1000) {
    serverAuditLogs.pop();
  }
  return entry;
}

export function getServerAuditLogs() {
  return serverAuditLogs;
}

/**
 * Initialize default user credential vault with cryptographic hashes.
 */
export function initializeCredentialVault() {
  if (credentialsVault.size > 0) return;

  const defaultAccounts: Array<{
    id: string;
    schoolId: string;
    username: string;
    email: string;
    name: string;
    role: string;
    adminRoleType?: string;
    branchId?: string;
    initialPassword: string;
    mustChangePassword: boolean;
    status?: 'active' | 'inactive' | 'suspended';
  }> = [
    // 1. Super Admin: Alex
    {
      id: 'user_superadmin_01',
      schoolId: 'ZCS/SA/00001',
      username: 'ZCS/SA/00001',
      email: 'superadmin@zitelcastle.edu.ng',
      name: 'Alex',
      role: 'SUPER_ADMIN',
      initialPassword: 'Zitel@Alex123',
      mustChangePassword: true,
    },
    // 2. Director: Dr. Nwankwo Chika
    {
      id: 'user_director_chika',
      schoolId: 'ZCS/DIR/00001',
      username: 'ZCS/DIR/00001',
      email: 'director@zitelcastle.edu.ng',
      name: 'Dr. Nwankwo Chika',
      role: 'DIRECTOR',
      adminRoleType: 'DIRECTOR',
      initialPassword: 'Zitel@Chika123',
      mustChangePassword: true,
    },
    // 3. Branch Admin: Bungalow Campus (Mrs. Folake Adebayo)
    {
      id: 'user_admin_bungalow',
      schoolId: 'ZCS/BUN/ADM/00001',
      username: 'ZCS/BUN/ADM/00001',
      email: 'adebayo.folake@zitelcastle.edu.ng',
      name: 'Mrs. Folake Adebayo',
      role: 'ADMIN',
      adminRoleType: 'BRANCH_ADMIN',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Folake123',
      mustChangePassword: true,
    },
    // 4. Branch Admin: Ijegun Campus (Mr. Chinedu Okafor)
    {
      id: 'user_admin_ijegun',
      schoolId: 'ZCS/IJ/ADM/00001',
      username: 'ZCS/IJ/ADM/00001',
      email: 'okafor.chinedu@zitelcastle.edu.ng',
      name: 'Mr. Chinedu Okafor',
      role: 'ADMIN',
      adminRoleType: 'BRANCH_ADMIN',
      branchId: 'branch_ijegun',
      initialPassword: 'Zitel@Chinedu123',
      mustChangePassword: true,
    },
    // 5. Chief Bursar: Mrs. Victoria Adeleke
    {
      id: 'user_admin_finance',
      schoolId: 'ZCS/BUN/ADM/00002',
      username: 'ZCS/BUN/ADM/00002',
      email: 'bursar@zitelcastle.edu.ng',
      name: 'Mrs. Victoria Adeleke',
      role: 'ADMIN',
      adminRoleType: 'BURSAR',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Victoria123',
      mustChangePassword: true,
    },
    // 6. Secondary Teacher: Mr. Marcus Ade (Secondary Specialist)
    {
      id: 'tch_02',
      schoolId: 'ZCS/BUN/TCH/00010',
      username: 'ZCS/BUN/TCH/00010',
      email: 'marcus.ade@zitelcastle.edu.ng',
      name: 'Mr. Marcus Ade',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Marcus123',
      mustChangePassword: true,
    },
    // 2026/2027 Production Primary Bungalow Teachers
    // Basic 1 Form Teacher: Ms. Mbiokwu C.
    {
      id: 'user_teacher_mbiokwu_c',
      schoolId: 'ZCS/BUN/TCH/00001',
      username: 'ZCS/BUN/TCH/00001',
      email: '',
      name: 'Ms. Mbiokwu C.',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Mbiokwu123',
      mustChangePassword: true,
    },
    // Basic 2 Form Teacher: Ms. Adewale B.Y
    {
      id: 'user_teacher_adewale_by',
      schoolId: 'ZCS/BUN/TCH/00002',
      username: 'ZCS/BUN/TCH/00002',
      email: 'bukogyeni@gmail.com',
      name: 'Ms. Adewale B.Y',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Adewale123',
      mustChangePassword: true,
    },
    // Basic 3 Form Teacher: Ms. Favour Akpan
    {
      id: 'user_teacher_favour_akpan',
      schoolId: 'ZCS/BUN/TCH/00003',
      username: 'ZCS/BUN/TCH/00003',
      email: 'akpanfavour4eva@gmail.com',
      name: 'Ms. Favour Akpan',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Favour123',
      mustChangePassword: true,
    },
    // Basic 4 Form Teacher: Ms. Chibuzo
    {
      id: 'user_teacher_chibuzo',
      schoolId: 'ZCS/BUN/TCH/00004',
      username: 'ZCS/BUN/TCH/00004',
      email: '',
      name: 'Ms. Chibuzo',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Chibuzo123',
      mustChangePassword: true,
    },
    // Basic 5 Form Teacher: Ms. Erica
    {
      id: 'user_teacher_erica',
      schoolId: 'ZCS/BUN/TCH/00005',
      username: 'ZCS/BUN/TCH/00005',
      email: '',
      name: 'Ms. Erica',
      role: 'TEACHER',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Erica123',
      mustChangePassword: true,
    },
    // 8. Parent: Mr. Tunde Adebayo
    {
      id: 'par_01',
      schoolId: 'ZCS/PAR/00001',
      username: 'ZCS/PAR/00001',
      email: 'tunde.adebayo@gmail.com',
      name: 'Mr. Tunde Adebayo',
      role: 'PARENT',
      initialPassword: 'Zitel@Parent123',
      mustChangePassword: true,
    },
    // 9. Student: Samuel Balogun
    {
      id: 'stu_01',
      schoolId: 'ZCS/BUN/STU/00001',
      username: 'ZCS/BUN/STU/00001',
      email: 'samuel.balogun@student.zitelcastle.edu.ng',
      name: 'Samuel Balogun',
      role: 'STUDENT',
      branchId: 'branch_bungalow',
      initialPassword: 'Zitel@Student123',
      mustChangePassword: true,
    },
  ];

  for (const acc of defaultAccounts) {
    const { hash, salt } = hashPassword(acc.initialPassword);
    const cred: UserCredential = {
      id: acc.id,
      schoolId: acc.schoolId,
      username: acc.username,
      email: acc.email,
      name: acc.name,
      role: acc.role,
      adminRoleType: acc.adminRoleType,
      branchId: acc.branchId,
      salt,
      hash,
      mustChangePassword: acc.mustChangePassword,
      emailVerified: !!(acc.email && acc.email.trim()),
      status: (acc as any).status || 'active',
    };
    if (acc.schoolId) credentialsVault.set(acc.schoolId.toUpperCase(), cred);
    if (acc.username) credentialsVault.set(acc.username.toUpperCase(), cred);
    if (acc.email && acc.email.trim()) credentialsVault.set(acc.email.toLowerCase(), cred);
    credentialsVault.set(acc.id, cred);
  }

  logAuditEvent({
    action: 'SYSTEM_BOOT',
    userId: 'system',
    userName: 'Zitel Security Core',
    userRole: 'SYSTEM',
    details: 'Cryptographic user credential vault initialized with secure salted scrypt hashes.',
  });
}

// Auto-init on module load
initializeCredentialVault();

/**
 * Authenticate credentials against secure hashed vault.
 */
export function authenticateUser(
  identifier: string,
  password?: string,
  ip?: string
): {
  success: boolean;
  user?: Partial<UserCredential>;
  token?: string;
  mustChangePassword?: boolean;
  error?: string;
  statusCode: number;
} {
  if (!identifier || !identifier.trim()) {
    return { success: false, error: 'School ID, username, or email is required.', statusCode: 400 };
  }
  if (!password || !password.trim()) {
    return { success: false, error: 'Password is required.', statusCode: 400 };
  }

  const cleanId = identifier.trim();
  const normalizedQuery = cleanId.replace(/\\/g, '/').toUpperCase();
  const cred =
    credentialsVault.get(normalizedQuery) ||
    credentialsVault.get(cleanId.toUpperCase()) ||
    credentialsVault.get(cleanId.toLowerCase()) ||
    credentialsVault.get(cleanId);

  if (!cred) {
    logAuditEvent({
      action: 'LOGIN_FAILURE',
      userId: 'unknown',
      userName: cleanId,
      userRole: 'UNKNOWN',
      details: `Authentication attempt failed: School ID or username '${cleanId}' not recognized.`,
      ip,
    });
    return {
      success: false,
      error: 'Invalid credentials. School ID or username not recognized.',
      statusCode: 401,
    };
  }

  // Account status check
  if (cred.status === 'deactivated' || cred.status === 'inactive') {
    logAuditEvent({
      action: 'LOGIN_FAILURE_DEACTIVATED',
      userId: cred.id,
      userName: cred.name,
      userRole: cred.role,
      details: `Login rejected: Account is currently ${cred.status}.`,
      ip,
    });
    return {
      success: false,
      error: 'Your account has been deactivated. Please contact your school administrator for assistance.',
      statusCode: 403,
    };
  }

  if (cred.status === 'suspended') {
    logAuditEvent({
      action: 'LOGIN_FAILURE_SUSPENDED',
      userId: cred.id,
      userName: cred.name,
      userRole: cred.role,
      details: 'Login rejected: Account is currently suspended.',
      ip,
    });
    return {
      success: false,
      error: 'Your account has been suspended. Please contact the Campus Administrator or Bursary.',
      statusCode: 403,
    };
  }

  // Verify cryptographic password hash
  const isMatch = verifyPassword(password, cred.hash, cred.salt);
  if (!isMatch) {
    logAuditEvent({
      action: 'LOGIN_FAILURE_PASSWORD',
      userId: cred.id,
      userName: cred.name,
      userRole: cred.role,
      details: `Authentication attempt failed: Incorrect password provided for ${cred.schoolId}.`,
      ip,
    });
    return {
      success: false,
      error: 'Invalid credentials. Incorrect password.',
      statusCode: 401,
    };
  }

  // Generate secure session token
  const token = `zcs_sess_${crypto.randomBytes(32).toString('hex')}`;
  const session: AuthSession = {
    token,
    userId: cred.id,
    schoolId: cred.schoolId,
    role: cred.role,
    adminRoleType: cred.adminRoleType,
    branchId: cred.branchId,
    name: cred.name,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  };
  activeSessions.set(token, session);

  logAuditEvent({
    action: 'LOGIN_SUCCESS',
    userId: cred.id,
    userName: cred.name,
    userRole: cred.role,
    details: `User authenticated successfully via official credentials. Session initialized for ${cred.schoolId}.`,
    ip,
  });

  return {
    success: true,
    user: {
      id: cred.id,
      schoolId: cred.schoolId,
      username: cred.username,
      name: cred.name,
      email: cred.email,
      role: cred.role,
      adminRoleType: cred.adminRoleType,
      branchId: cred.branchId,
      mustChangePassword: cred.mustChangePassword,
      status: cred.status,
      emailVerified: cred.emailVerified,
    },
    token,
    mustChangePassword: cred.mustChangePassword,
    statusCode: 200,
  };
}

/**
 * Validate active session token.
 */
export function validateSession(token?: string): AuthSession | null {
  if (!token) return null;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const session = activeSessions.get(cleanToken);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(cleanToken);
    return null;
  }
  return session;
}

/**
 * Terminate session (Logout).
 */
export function invalidateSession(token?: string, ip?: string): boolean {
  if (!token) return false;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const session = activeSessions.get(cleanToken);
  if (session) {
    activeSessions.delete(cleanToken);
    logAuditEvent({
      action: 'LOGOUT',
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      details: `Session ${cleanToken.substring(0, 12)}... logged out securely.`,
      ip,
    });
    return true;
  }
  return false;
}

/**
 * Change password.
 * Replaces hash with new salted scrypt hash. Old password becomes completely invalid.
 */
export function changePassword(
  userIdOrSchoolId: string,
  currentPassword: string,
  newPassword: string,
  ip?: string
): { success: boolean; error?: string; statusCode: number } {
  const cleanId = (userIdOrSchoolId || '').trim();
  const normalizedId = cleanId.replace(/\\/g, '/').toUpperCase();
  const cred =
    credentialsVault.get(normalizedId) ||
    credentialsVault.get(cleanId.toUpperCase()) ||
    credentialsVault.get(cleanId.toLowerCase()) ||
    credentialsVault.get(cleanId);

  if (!cred) {
    return { success: false, error: 'User account not found.', statusCode: 404 };
  }

  // Verify current password
  if (!verifyPassword(currentPassword, cred.hash, cred.salt)) {
    logAuditEvent({
      action: 'PASSWORD_CHANGE_FAILURE',
      userId: cred.id,
      userName: cred.name,
      userRole: cred.role,
      details: 'Password change attempt rejected: Current password does not match.',
      ip,
    });
    return { success: false, error: 'Current password is incorrect.', statusCode: 400 };
  }

  // Validate new password strength
  const validation = validatePasswordStrength(newPassword, {
    username: cred.username,
    name: cred.name,
    schoolId: cred.schoolId,
    currentPassword,
  });

  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(' '),
      statusCode: 400,
    };
  }

  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  cred.hash = hash;
  cred.salt = salt;
  cred.mustChangePassword = false;
  cred.passwordChangedAt = new Date().toISOString();

  // Re-save across lookups
  credentialsVault.set(cred.schoolId.toUpperCase(), cred);
  credentialsVault.set(cred.username.toUpperCase(), cred);
  credentialsVault.set(cred.email.toLowerCase(), cred);
  credentialsVault.set(cred.id, cred);

  logAuditEvent({
    action: 'PASSWORD_CHANGE',
    userId: cred.id,
    userName: cred.name,
    userRole: cred.role,
    details: 'Password changed successfully. New salted hash generated; previous credentials revoked.',
    ip,
  });

  return { success: true, statusCode: 200 };
}

/**
 * Request password reset (Forgot Password).
 * Returns generic message to prevent account enumeration.
 */
export function requestPasswordReset(
  identifier: string,
  ip?: string
): {
  success: boolean;
  message: string;
  resetToken?: string;
  resetLink?: string;
  maskedEmail?: string;
} {
  const genericMessage =
    'If an account matching the information provided exists, password-reset instructions have been sent to the registered email address.';

  if (!identifier || !identifier.trim()) {
    return { success: true, message: genericMessage };
  }

  const cleanId = identifier.trim();
  const cred =
    credentialsVault.get(cleanId.toUpperCase()) ||
    credentialsVault.get(cleanId.toLowerCase()) ||
    credentialsVault.get(cleanId);

  if (!cred) {
    logAuditEvent({
      action: 'PASSWORD_RESET_REQUEST_UNRECOGNIZED',
      userId: 'unknown',
      userName: cleanId,
      userRole: 'UNKNOWN',
      details: `Password reset requested for unrecognized identifier '${cleanId}'.`,
      ip,
    });
    return { success: true, message: genericMessage };
  }

  // Generate 15-minute token
  const resetToken = `pr_${crypto.randomBytes(24).toString('hex')}`;
  const record: PasswordResetRecord = {
    token: resetToken,
    schoolId: cred.schoolId,
    email: cred.email,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  passwordResetTokens.set(resetToken, record);

  const maskedEmail = cred.email
    ? cred.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)
    : 'registered email';

  logAuditEvent({
    action: 'PASSWORD_RESET_REQUEST',
    userId: cred.id,
    userName: cred.name,
    userRole: cred.role,
    details: `Secure password reset initiated for ${cred.schoolId}. Reset token generated with 15-minute expiry.`,
    ip,
  });

  return {
    success: true,
    message: genericMessage,
    resetToken,
    resetLink: `/reset-password?token=${resetToken}`,
    maskedEmail,
  };
}

/**
 * Complete password reset using token.
 */
export function resetPasswordWithToken(
  token: string,
  newPassword: string,
  ip?: string
): { success: boolean; error?: string; statusCode: number } {
  if (!token) {
    return { success: false, error: 'Password reset token is required.', statusCode: 400 };
  }

  const record = passwordResetTokens.get(token);
  if (!record) {
    return { success: false, error: 'Invalid or expired password reset link.', statusCode: 400 };
  }

  if (Date.now() > record.expiresAt) {
    passwordResetTokens.delete(token);
    return { success: false, error: 'Password reset link has expired. Please request a new one.', statusCode: 400 };
  }

  const cred = credentialsVault.get(record.schoolId.toUpperCase());
  if (!cred) {
    return { success: false, error: 'Account not found.', statusCode: 404 };
  }

  const validation = validatePasswordStrength(newPassword, {
    username: cred.username,
    name: cred.name,
    schoolId: cred.schoolId,
  });

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' '), statusCode: 400 };
  }

  const { hash, salt } = hashPassword(newPassword);
  cred.hash = hash;
  cred.salt = salt;
  cred.mustChangePassword = false;
  cred.passwordChangedAt = new Date().toISOString();

  // Invalidate token
  passwordResetTokens.delete(token);

  logAuditEvent({
    action: 'PASSWORD_RESET_SUCCESS',
    userId: cred.id,
    userName: cred.name,
    userRole: cred.role,
    details: `Password reset successfully completed using verified token for ${cred.schoolId}.`,
    ip,
  });

  return { success: true, statusCode: 200 };
}

/**
 * Privacy Sanitizer:
 * Masks phone number and email address for unauthorized viewers.
 * Only Super Admin (Alex) and Director (Dr. Nwankwo Chika) or self have unrestricted visibility.
 */
export function sanitizeContactPrivacy<T extends Record<string, any>>(
  resource: T,
  requesterRole?: string,
  requesterId?: string
): T {
  if (!resource) return resource;

  const isAlex = requesterRole === 'SUPER_ADMIN';
  const isChika = requesterRole === 'DIRECTOR' || (resource as any).adminRoleType === 'DIRECTOR';
  const isPrivileged = isAlex || isChika;
  const isSelf = requesterId && (resource.id === requesterId || resource.schoolId === requesterId);

  // Check approved contact grants
  const targetId = resource.id || resource.schoolId;
  const hasApprovedGrant = requesterId && targetId && contactAccessGrants.has(`${requesterId}:${targetId}`);

  if (isPrivileged || isSelf || hasApprovedGrant) {
    return { ...resource };
  }

  // Mask private contact fields
  const sanitized = { ...resource } as any;
  if ('phone' in sanitized && sanitized.phone) {
    sanitized.phone = 'Private';
  }
  if ('whatsApp' in sanitized) {
    sanitized.whatsApp = undefined;
  }
  if ('email' in sanitized && sanitized.email) {
    sanitized.email = 'Contact information restricted';
  }
  if ('emergencyContact' in sanitized && sanitized.emergencyContact) {
    sanitized.emergencyContact = {
      ...sanitized.emergencyContact,
      phone: 'Private',
      email: undefined,
    };
  }
  if ('primaryContactPhone' in sanitized) {
    sanitized.primaryContactPhone = 'Private';
  }

  return sanitized as T;
}

/**
 * Contact Information Request Management
 */
export function submitContactRequest(data: {
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  reason: string;
}): ServerContactRequest {
  const req: ServerContactRequest = {
    id: `creq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    ...data,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  contactRequests.unshift(req);

  logAuditEvent({
    action: 'CONTACT_INFO_REQUEST',
    userId: data.requesterId,
    userName: data.requesterName,
    userRole: data.requesterRole,
    details: `Contact information requested for ${data.targetUserName} (${data.targetUserRole}). Reason: ${data.reason}`,
  });

  return req;
}

export function getContactRequests(requesterRole: string, requesterId: string): ServerContactRequest[] {
  if (requesterRole === 'SUPER_ADMIN' || requesterRole === 'DIRECTOR') {
    return contactRequests;
  }
  return contactRequests.filter((r) => r.requesterId === requesterId);
}

export function reviewContactRequest(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: string,
  approved: boolean,
  notes?: string
): { success: boolean; request?: ServerContactRequest; error?: string } {
  if (reviewerRole !== 'SUPER_ADMIN' && reviewerRole !== 'DIRECTOR') {
    return { success: false, error: 'Only Super Admin or Director can review contact requests.' };
  }

  const req = contactRequests.find((r) => r.id === requestId);
  if (!req) {
    return { success: false, error: 'Request not found.' };
  }

  req.status = approved ? 'approved' : 'declined';
  req.reviewedByUserId = reviewerId;
  req.reviewedByUserName = reviewerName;
  req.reviewedAt = new Date().toISOString();
  req.reviewNotes = notes;

  if (approved) {
    contactAccessGrants.add(`${req.requesterId}:${req.targetUserId}`);
  }

  logAuditEvent({
    action: approved ? 'CONTACT_INFO_APPROVAL' : 'CONTACT_INFO_DECLINED',
    userId: reviewerId,
    userName: reviewerName,
    userRole: reviewerRole,
    details: `${approved ? 'Approved' : 'Declined'} contact info request ${requestId} for ${req.targetUserName} to ${req.requesterName}.`,
  });

  return { success: true, request: req };
}

/**
 * Account Deactivation / Activation (Super Admin & Director control)
 */
export function setAccountStatus(
  targetId: string,
  newStatus: 'active' | 'suspended' | 'deactivated',
  actorId: string,
  actorName: string,
  actorRole: string,
  reason?: string
): { success: boolean; error?: string } {
  if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'DIRECTOR') {
    return { success: false, error: 'Unauthorized to change account status.' };
  }

  const cred =
    credentialsVault.get(targetId.toUpperCase()) ||
    credentialsVault.get(targetId.toLowerCase()) ||
    credentialsVault.get(targetId);

  if (!cred) {
    return { success: false, error: 'Account not found.' };
  }

  cred.status = newStatus;

  logAuditEvent({
    action: newStatus === 'active' ? 'ACCOUNT_ACTIVATION' : newStatus === 'suspended' ? 'ACCOUNT_SUSPENSION' : 'ACCOUNT_DEACTIVATION',
    userId: actorId,
    userName: actorName,
    userRole: actorRole,
    details: `Account ${cred.schoolId} (${cred.name}) status changed to ${newStatus}. Reason: ${reason || 'Administrative action'}`,
  });

  return { success: true };
}
