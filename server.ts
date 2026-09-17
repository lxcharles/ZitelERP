import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  authenticateUser,
  validateSession,
  invalidateSession,
  changePassword,
  requestPasswordReset,
  resetPasswordWithToken,
  sanitizeContactPrivacy,
  submitContactRequest,
  getContactRequests,
  reviewContactRequest,
  setAccountStatus,
  getServerAuditLogs,
} from './serverAuth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', school: 'Zitel Castle School', timestamp: new Date().toISOString() });
  });

  // AI Assistant Chat endpoint for Agent ZEE (Platform-Wide Technical Support Assistant)
  app.post('/api/ai/agent-zee', async (req: Request, res: Response) => {
    try {
      const {
        message,
        userRole,
        userName,
        branchId,
        branchName,
        branchAdmin,
        currentTab,
        activeClass,
        schoolContext,
        unresolvedTurns = 0,
        isHelpOrSupport = false,
      } = req.body;
      const ai = getGeminiClient();

      const effectiveBranchName = branchName || schoolContext?.branchName || (branchId === 'branch_ijegun' ? 'Zitel Castle School (Ijegun)' : 'Zitel Castle School (Bungalow)');
      const effectiveAdminName = branchAdmin?.name || (branchId === 'branch_ijegun' ? 'Mr. Chinedu Okafor, B.Sc, PGDE' : 'Mrs. Folake Adebayo, M.Ed');
      const effectiveAdminTitle = branchAdmin?.roleTitle || (branchId === 'branch_ijegun' ? 'Branch Principal (Ijegun Campus)' : 'Branch Principal (Bungalow Campus)');
      const effectiveAdminEmail = branchAdmin?.email || (branchId === 'branch_ijegun' ? 'okafor.chinedu@zitelcastle.edu.ng' : 'adebayo.folake@zitelcastle.edu.ng');
      const effectiveAdminPhone = branchAdmin?.phone || (branchId === 'branch_ijegun' ? '+234 803 987 6543' : '+234 802 345 6789');
      const effectiveAdminAddress = branchAdmin?.address || (branchId === 'branch_ijegun' ? 'Ijegun Campus, Ijegun-Ikotun Road, Alimosho, Lagos' : 'Bungalow Campus, Ikotun-Egbe Corridor, Alimosho, Lagos');

      const systemInstruction = `You are Agent ZEE, the official dedicated platform technical support assistant for ZITEL CASTLE SCHOOL (a prestigious multi-branch Nigerian school with Bungalow and Ijegun campuses).

=== INSTITUTIONAL LEADERSHIP IDENTITIES ===
- Super Admin: **Alex** (System Administrator / Platform Master Authority, School ID: **ZCS/SA/00001**). Alex manages administrators, branches, and system-level configurations. Alex is NOT the School Director or Principal.
- School Director: **Dr. Nwankwo Chika** (Female, School Director, School ID: **ZCS/DIR/00001**). Dr. Nwankwo Chika directs overall academic strategy, staff evaluation, and institutional oversight across all campuses.
- Branch Administrators: **Mrs. Folake Adebayo** (Bungalow Campus) and **Mr. Chinedu Okafor** (Ijegun Campus).
- Chief Bursar: **Mrs. Victoria Adeleke** (Bursary & Financial Control).

=== STRICT CONTACT PRIVACY DIRECTIVE ===
Phone numbers and email addresses are strictly private personal information.
Only **Super Admin (Alex)** and **Director (Dr. Nwankwo Chika)** have unrestricted authorized access to other users' contact information.
All other users (Teachers, Parents, Students, Branch Admins, Bursars) will see "Private" or "Contact information restricted".
If a teacher or parent needs to contact another person, they MUST use **ZITEL CHAT ROOM** or submit an official Contact Information Request through their dashboard for review by the Director or Super Admin.
NEVER disclose another user's personal phone number or email address in chat.

=== STRICT PASSWORD & SECURITY STANDARDS ===
- Passwords must be at least 12 characters long, containing uppercase letters, lowercase letters, numbers, and symbols.
- On first-time login, users must immediately set a new permanent strong password.
- Password recovery is conducted via "Forgot Password?" using a verified email reset link. Passwords are never sent by email or revealed by Agent ZEE.
- Passwords, cryptographic hashes, session tokens, and Firebase Admin credentials must NEVER be disclosed or bypassed.

=== SYSTEM-LEVEL CONTEXT ===
- Authenticated User: ${userName || 'User'}
- User Role: ${userRole || 'USER'}
- Branch ID: ${branchId || 'branch_bungalow'}
- Campus Name: ${effectiveBranchName}
- Assigned Branch Administrator: ${effectiveAdminName} (${effectiveAdminTitle})
- Administrator Contact: Email: ${effectiveAdminEmail} | Phone: ${effectiveAdminPhone} | Campus: ${effectiveAdminAddress}
- Current Portal Tab: ${currentTab || 'Overview'}
- Active Class: ${activeClass || 'N/A'}
- Unresolved Turns: ${unresolvedTurns}
- Escalation / Help Keyword Triggered: ${isHelpOrSupport ? 'YES' : 'NO'}

=== CRITICAL DIRECTIVE - STRICT PLATFORM-ONLY SCOPE ===
You must NOT answer questions that are unrelated to the ZITEL CASTLE SCHOOL platform.
You are NOT a general-purpose chatbot (like ChatGPT). You do NOT answer general trivia, poetry requests, science/quantum physics, football/sports scores, current weather, Bible verses/religious debates, business plans, external phone prices, jokes, general computer programming, or homework assistance unrelated to school platform usage.
If a user asks ANY question unrelated to the ZITEL CASTLE SCHOOL platform, you MUST politely and firmly refuse to answer using this EXACT response:
"I'm Agent ZEE, your ZITEL CASTLE SCHOOL platform assistant. I can help you with using the platform, troubleshooting, navigation, accounts, reports, and other system-related questions. I can't assist with topics outside the platform."
Do NOT answer the unrelated question under any circumstances.

=== ROLE-BASED TERMINOLOGY & TAILORED EXPLANATIONS ===
You MUST tailor all explanations, vocabulary, and functional framing using the system-level context: User Role: ${userRole}, Branch ID: ${branchId}.
1. If user is BURSAR (or finance role):
   - Use financial, treasury, and bursary terminology: invoices, tuition fee schedules, teller slips, Nigerian Naira (₦) amounts, bank payment reconciliation, offline transaction verification, receipt issuance, debtor registers, balance deficits, and financial audit logs.
2. If user is TEACHER:
   - Use academic, pedagogical, and classroom evaluation terminology: continuous assessment (CA) breakdown (10% classwork, 10% homework, 20% midterm test = 40% CA), terminal examinations (60%), weekly lesson notes & planners, curriculum learning objectives, differentiated learning tiers, 95% minimum attendance benchmark, pastoral remarks, and student report card submissions.
3. If user is PARENT:
   - Use warm, clear guardian terminology: children's term report cards, fee breakdown statements, paying fees via online card or offline bank transfer, downloading official payment receipts, school calendar events, and sending messages to class teachers via ZITEL CHAT ROOM.
4. If user is STUDENT:
   - Use friendly, accessible pupil terminology: viewing homework assignments, checking class timetables, subject lists, report sheet grades, and chatting with authorized class teachers via ZITEL CHAT ROOM.
5. If user is ADMIN / DIRECTOR / SUPER ADMIN:
   - Use institutional management, multi-branch oversight, and administrative governance terminology: staff onboarding, student admissions, class/subject assignments, timetable generation, promotion approvals, teacher reassignment with audit tracking, class performance and health evaluation, and audit trail records.

=== CONNECTED PLATFORM ADVANCED CAPABILITIES ===
1. TEACHER REASSIGNMENT:
   - Authorized: SUPER_ADMIN, DIRECTOR, ADMIN.
   - Teachers and parents are NOT authorized to reassign teachers.
   - Purpose: Move a teacher from one class to another with full audit logging, effective date, and preserved historical records (previous class, previous subject, past assignments, term attendance, and grades remain completely intact in history).
   - How to use: Open Staff Roster / Teaching Staff, click "REASSIGN TEACHER", select teacher, target class, subject assignments, and submit.

2. CLASS EVALUATION & HEALTH:
   - Authorized: DIRECTOR, SUPER_ADMIN, ADMIN.
   - Purpose: Comprehensive multi-metric class health scoring (0–100%) incorporating Academic Mastery (30%), Curriculum Topic Coverage (25%), Student Attendance (20%), Assignment Submissions (15%), and Fee Settlement (10%).
   - Health Bands: Exemplary (85%+), Healthy (70–84%), Attention Needed (55–69%), Critical Risk (<55%).
   - How to use: Navigate to "Class Evaluation & Health" from the left menu or Director Overview.

3. CURRICULUM TOPIC COMPLETION:
   - Authorized: TEACHERS (for their assigned classes/subjects) and DIRECTORS/ADMINS.
   - Purpose: Evidence-based syllabus progress tracking. Topics require verified academic evidence: 1) Delivered lesson plan/note, 2) Homework assignment with submissions, and 3) Continuous assessment test scores.
   - How to use: Open "Topic Completion & Syllabus" under Teacher Operations, pick class and subject, inspect evidence, and mark completed with teacher mastery remarks. This directly powers the institutional Class Evaluation index.

=== STRICT RESTRICTIONS ON UNAUTHORIZED WORKFLOWS ===
You MUST inspect what the user is attempting to do and verify whether their role (${userRole}) is authorized.
- PARENTS CANNOT: Enter or edit student marks, approve attendance, submit lesson notes, adjust school fees, or create classes.
- TEACHERS CANNOT: Confirm bank transfer payments, modify fee structures, create school branches, register administrators, or alter system permissions.
- BURSARS CANNOT: Submit or edit student exam scores, approve teacher lesson notes, or promote students to the next grade.
- STUDENTS CANNOT: Grade assessments, approve lesson notes, view other students' records, or edit attendance.

MANDATORY ENFORCEMENT RULE FOR UNAUTHORIZED REQUESTS:
If the user asks for instructions to perform an action outside their authorized role:
1. DO NOT provide step-by-step instructions or explain how to bypass permissions.
2. Clearly state: "Your account role (${userRole}) is not authorized to perform this action on the ZITEL CASTLE SCHOOL platform. This action is restricted to [authorized role]."
3. Provide instructions to contact their specific branch administrator (**${effectiveAdminName}** at ${effectiveBranchName}) if an official administrative change or exemption is required.

=== UNRESOLVED INQUIRIES & BRANCH ADMINISTRATOR CONTACT ===
If the query remains unresolved after two turns (Unresolved Turns: ${unresolvedTurns} >= 2), or if the message contains keywords like "help" or "support" (or if the user expresses confusion/difficulty):
You MUST automatically include direct contact instructions for their specific branch administrator:
- Branch: **${effectiveBranchName}**
- Branch Administrator: **${effectiveAdminName}** (${effectiveAdminTitle})
- Email: **${effectiveAdminEmail}**
- Phone: **${effectiveAdminPhone}**
- Action Steps:
  1. Open **ZITEL CHAT ROOM** from the portal navigation.
  2. Send a direct message to **${effectiveAdminName}**.
  3. Or visit the Administrative Office at **${effectiveAdminAddress}** during working hours (7:30 AM – 4:00 PM).

=== COMMUNICATION STYLE ===
- Make all explanations very clear, simple, and direct in plain layman language.
- Use numbered step-by-step lists (1, 2, 3), bold keywords, and clean formatting. Keep it friendly, structured, and easy to follow.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ reply: response.text || 'No response generated.' });
    } catch (err: any) {
      console.error('Agent ZEE AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to process Agent ZEE request' });
    }
  });

  // Backward compatibility: Teacher & Admin Chat endpoint forwarding to Agent ZEE
  app.post('/api/ai/teacher-chat', async (req: Request, res: Response) => {
    try {
      const { message, teacherName, currentClass, schoolContext } = req.body;
      const ai = getGeminiClient();

      const systemInstruction = `You are Agent ZEE, the official dedicated platform technical support assistant for ZITEL CASTLE SCHOOL.
You assist faculty, heads of department, and school administrators with using the platform, school policies (attendance, CA 40% / Exam 60% weighting, Naira ₦ fees, multi-branch operations, ZITEL CHAT ROOM, reports), and troubleshooting.
Strictly refuse non-platform questions with: "I'm Agent ZEE, your ZITEL CASTLE SCHOOL platform assistant. I can help you with using the platform, troubleshooting, navigation, accounts, reports, and other system-related questions. I can't assist with topics outside the platform."
Respond in simple, clear layman terms with numbered steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ reply: response.text || 'No response generated.' });
    } catch (err: any) {
      console.error('Teacher chat AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to process AI chat request' });
    }
  });

  // AI Lesson Plan Generator endpoint
  app.post('/api/ai/lesson-plan', async (req: Request, res: Response) => {
    try {
      const { subject, grade, topic, duration, objectives, difficulty } = req.body;
      const ai = getGeminiClient();

      const prompt = `Generate a comprehensive, structured lesson plan for ${subject}, Grade/Class: ${grade}, Topic: "${topic}".
Duration: ${duration || '45 mins'}, Difficulty: ${difficulty || 'Standard'}.
Specific Objectives: ${objectives || 'Standard primary curriculum outcomes'}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              grade: { type: Type.STRING },
              topic: { type: Type.STRING },
              duration: { type: Type.STRING },
              learningObjectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              materialsNeeded: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              introduction: { type: Type.STRING },
              explanation: { type: Type.STRING },
              classroomActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    grouping: { type: Type.STRING },
                  },
                  required: ['name', 'duration', 'instructions', 'grouping'],
                },
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                  },
                  required: ['question', 'expectedAnswer'],
                },
              },
              differentiation: {
                type: Type.OBJECT,
                properties: {
                  support: { type: Type.STRING },
                  extension: { type: Type.STRING },
                },
                required: ['support', 'extension'],
              },
              assessment: { type: Type.STRING },
              homework: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: [
              'title',
              'subject',
              'grade',
              'topic',
              'duration',
              'learningObjectives',
              'materialsNeeded',
              'introduction',
              'explanation',
              'classroomActivities',
              'questions',
              'differentiation',
              'assessment',
              'homework',
              'summary',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Lesson plan AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate lesson plan' });
    }
  });

  // AI Quiz Generator endpoint
  app.post('/api/ai/quiz', async (req: Request, res: Response) => {
    try {
      const { subject, grade, topic, questionCount, difficulty } = req.body;
      const ai = getGeminiClient();

      const prompt = `Create a ${questionCount || 5}-question practice quiz for primary school students on "${topic}" in ${subject} (${grade}).
Difficulty: ${difficulty || 'Medium'}. Provide clear options and marking instructions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              grade: { type: Type.STRING },
              subject: { type: Type.STRING },
              instructions: { type: Type.STRING },
              timeLimitMinutes: { type: Type.INTEGER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    type: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    points: { type: Type.INTEGER },
                  },
                  required: ['id', 'type', 'question', 'options', 'correctAnswer', 'explanation', 'points'],
                },
              },
              totalPoints: { type: Type.INTEGER },
              markingGuide: { type: Type.STRING },
            },
            required: ['title', 'grade', 'subject', 'instructions', 'timeLimitMinutes', 'questions', 'totalPoints', 'markingGuide'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Quiz AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate quiz' });
    }
  });

  // AI Report Card Comment Generator
  app.post('/api/ai/report-comment', async (req: Request, res: Response) => {
    try {
      const { studentName, term, subjectScores, attendanceRate, behaviorNotes } = req.body;
      const ai = getGeminiClient();

      const prompt = `Draft personalized, encouraging, and constructive terminal report card comments for student "${studentName}".
Term: ${term}.
Subject Scores: ${JSON.stringify(subjectScores || {})}.
Attendance Rate: ${attendanceRate || '96%'}.
Behavior Observations: ${behaviorNotes || 'Well-behaved, cooperative in class'}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              academicComment: { type: Type.STRING },
              socialBehaviorComment: { type: Type.STRING },
              growthRecommendation: { type: Type.STRING },
              fullComment: { type: Type.STRING },
            },
            required: ['academicComment', 'socialBehaviorComment', 'growthRecommendation', 'fullComment'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Report comment AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate report comment' });
    }
  });

  // AI Student Performance Insights
  app.post('/api/ai/student-insights', async (req: Request, res: Response) => {
    try {
      const { studentName, performanceData, classAverage } = req.body;
      const ai = getGeminiClient();

      const prompt = `Analyze academic strengths, learning patterns, and targeted intervention strategies for student "${studentName}".
Student Performance: ${JSON.stringify(performanceData || {})}.
Class Average Benchmark: ${JSON.stringify(classAverage || {})}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              areasForFocus: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              learningStyleRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              summaryNarrative: { type: Type.STRING },
            },
            required: ['strengths', 'areasForFocus', 'learningStyleRecommendations', 'summaryNarrative'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Student insights AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate student insights' });
    }
  });

  // AI Attendance Forecast
  app.post('/api/ai/attendance-forecast', async (req: Request, res: Response) => {
    try {
      const { studentName, className, attendanceRate, absentDays, lateDays, dayBreakdown, consecutiveAbsences } = req.body;
      const ai = getGeminiClient();

      const prompt = `Provide predictive attendance risk forecasting and proactive pastoral intervention for:
Student: ${studentName}, Class: ${className}
Attendance Rate: ${attendanceRate}%, Absent Days: ${absentDays}, Late Days: ${lateDays}
Day-of-Week Pattern: ${dayBreakdown || 'Even distribution'}
Consecutive Absences: ${consecutiveAbsences || 0}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING },
              projectedTermRate: { type: Type.NUMBER },
              rootCauseHypothesis: { type: Type.STRING },
              pedagogicalImpactAssessment: { type: Type.STRING },
              recommendedInterventions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              parentEmailDraft: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                },
                required: ['subject', 'body'],
              },
            },
            required: [
              'riskLevel',
              'projectedTermRate',
              'rootCauseHypothesis',
              'pedagogicalImpactAssessment',
              'recommendedInterventions',
              'parentEmailDraft',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Attendance forecast AI error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate attendance forecast' });
    }
  });

  // ==========================================
  // AUTHENTICATION & SECURITY ENDPOINTS
  // ==========================================

  // 1. Authenticate (Login)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const result = authenticateUser(identifier, password, req.ip);
    res.status(result.statusCode).json(result);
  });

  // 2. Validate Session
  app.get('/api/auth/session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session) {
      res.status(401).json({ success: false, error: 'Unauthorized or expired session.' });
      return;
    }
    res.json({ success: true, session });
  });

  // 3. Terminate Session (Logout)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const invalidated = invalidateSession(authHeader, req.ip);
    res.json({ success: invalidated });
  });

  // 4. Change Password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { currentPassword, newPassword, userId } = req.body;
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    const targetUserId = userId || session?.schoolId || session?.userId;

    if (!targetUserId) {
      res.status(401).json({ success: false, error: 'Unauthorized request.' });
      return;
    }

    const result = changePassword(targetUserId, currentPassword, newPassword, req.ip);
    res.status(result.statusCode).json(result);
  });

  // 5. Request Password Reset (Forgot Password)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { identifier } = req.body;
    const result = requestPasswordReset(identifier, req.ip);
    res.json(result);
  });

  // 6. Complete Password Reset With Token
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = resetPasswordWithToken(token, newPassword, req.ip);
    res.status(result.statusCode).json(result);
  });

  // 7. Update Account Status (Activation / Deactivation)
  app.post('/api/auth/account-status', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const { targetId, newStatus, reason } = req.body;
    const result = setAccountStatus(
      targetId,
      newStatus,
      session.userId,
      session.name,
      session.role,
      reason
    );
    res.status(result.success ? 200 : 403).json(result);
  });

  // 8. Contact Information Privacy Requests
  app.post('/api/contact-requests', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const { targetUserId, targetUserName, targetUserRole, reason } = req.body;
    const request = submitContactRequest({
      requesterId: session.userId,
      requesterName: session.name,
      requesterRole: session.role,
      targetUserId,
      targetUserName,
      targetUserRole,
      reason,
    });
    res.json({ success: true, request });
  });

  app.get('/api/contact-requests', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const requests = getContactRequests(session.role, session.userId);
    res.json({ success: true, requests });
  });

  app.post('/api/contact-requests/:id/review', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const { approved, notes } = req.body;
    const result = reviewContactRequest(
      req.params.id,
      session.userId,
      session.name,
      session.role,
      approved,
      notes
    );
    res.status(result.success ? 200 : 403).json(result);
  });

  // 9. Institutional Security Audit Log
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const session = validateSession(authHeader);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'DIRECTOR')) {
      res.status(403).json({ success: false, error: 'Unauthorized access to institutional audit log.' });
      return;
    }

    const logs = getServerAuditLogs();
    res.json({ success: true, logs });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zitel Castle SchoolOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
