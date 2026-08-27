import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function aiApiPlugin(): Plugin {
  return {
    name: 'school-ai-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/ai/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
        const endpoint = url.pathname;

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyStr ? JSON.parse(bodyStr) : {};
            const ai = getGeminiClient();

            if (endpoint === '/api/ai/lesson-plan') {
              const { subject, grade, topic, duration, objectives, difficulty } = body;
              const prompt = `You are an expert primary school educational curriculum designer. Create a highly structured, engaging lesson plan for primary school students.
Subject: ${subject || 'General'}
Grade/Class: ${grade || 'Primary 3'}
Topic: ${topic || 'Introduction to Science'}
Duration: ${duration || '45 minutes'}
Difficulty: ${difficulty || 'Intermediate'}
Key Objectives: ${objectives || 'Foster core conceptual understanding and hands-on participation'}

Format your response as valid JSON matching this schema:
{
  "title": "Clear Lesson Title",
  "subject": "${subject || 'General'}",
  "grade": "${grade || 'Primary 3'}",
  "topic": "${topic || 'Core Subject'}",
  "duration": "${duration || '45 mins'}",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"],
  "materialsNeeded": ["material 1", "material 2"],
  "introduction": "Engaging 5-minute hook / warm-up activity",
  "explanation": "Clear, age-appropriate conceptual breakdown with analogies and real-world examples",
  "classroomActivities": [
    {
      "name": "Activity Name",
      "duration": "15 mins",
      "instructions": "Step by step instructions",
      "grouping": "Pairs or small groups"
    }
  ],
  "questions": [
    { "question": "Question 1", "expectedAnswer": "Brief answer" },
    { "question": "Question 2", "expectedAnswer": "Brief answer" },
    { "question": "Question 3", "expectedAnswer": "Brief answer" }
  ],
  "differentiation": {
    "support": "Guidance for struggling learners",
    "extension": "Challenge for advanced learners"
  },
  "assessment": "Formative check of understanding",
  "homework": "Engaging, practical take-home task",
  "summary": "Key takeaway wrap-up points"
}
Return ONLY valid JSON without markdown wrapping.`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const fallback = {
                  title: `${topic || 'Foundational'} Mastery Plan: ${subject || 'Core Studies'}`,
                  subject: subject || 'General Studies',
                  grade: grade || 'Primary 3',
                  topic: topic || 'Core Foundations',
                  duration: duration || '45 mins',
                  learningObjectives: [
                    `Understand key fundamental principles of ${topic || 'the topic'}`,
                    `Identify real-world examples and practical applications in daily life`,
                    `Demonstrate mastery through guided and independent classroom exercises`
                  ],
                  materialsNeeded: ['Student notebooks', 'Interactive whiteboards/charts', 'Manipulatives/Activity cards'],
                  introduction: `Engage students with a real-life inquiry question: "Have you ever wondered how ${topic || 'this concept'} works around us?" Gather 3-4 student ideas.`,
                  explanation: `Break down ${topic || 'the subject matter'} into 3 simple concepts with visual metaphors, vocabulary building, and structured choral repetition.`,
                  classroomActivities: [
                    {
                      name: `Interactive ${topic || 'Concept'} Exploration`,
                      duration: '15 mins',
                      instructions: 'Students work in pairs with prompt cards to sort, discuss, and solve 3 progressive scenarios.',
                      grouping: 'Pairs'
                    }
                  ],
                  questions: [
                    { question: `What is the primary characteristic of ${topic || 'this concept'}?`, expectedAnswer: 'Core identifying attribute as taught during guided practice.' },
                    { question: `How can you apply this in everyday primary school life?`, expectedAnswer: 'Relating the concept to home or playground experiences.' },
                    { question: `Can you spot the difference between correct and incorrect applications?`, expectedAnswer: 'Applying analytical comparison skills.' }
                  ],
                  differentiation: {
                    support: 'Provide visual cue cards, sentence starters, and peer buddy assistance.',
                    extension: 'Encourage students to formulate their own challenge problem or create a mini-diagram.'
                  },
                  assessment: 'Thumbs up/down quick check followed by a 3-question exit ticket.',
                  homework: `Complete the short reflection worksheet: observe 2 instances of ${topic || 'the concept'} at home.`,
                  summary: `Recap key vocabulary terms and celebrate active student participation.`
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/quiz') {
              const { subject, grade, topic, questionCount, difficulty, questionType } = body;
              const count = parseInt(questionCount, 10) || 5;
              const prompt = `You are a certified primary school teacher. Generate a ${count}-question ${questionType || 'mixed'} quiz for grade ${grade || 'Primary 3'} on the topic "${topic || 'General Science'}" in subject "${subject || 'Science'}". Difficulty: ${difficulty || 'Medium'}.
Format your response as valid JSON matching this schema:
{
  "title": "${subject || 'General'} Quiz: ${topic || 'Core Knowledge'}",
  "grade": "${grade || 'Primary 3'}",
  "subject": "${subject || 'General'}",
  "instructions": "Answer all questions carefully.",
  "timeLimitMinutes": 15,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this answer is correct in simple terms for primary school children.",
      "points": 2
    }
  ],
  "totalPoints": ${count * 2},
  "markingGuide": "Scoring instructions for teachers"
}
Return ONLY valid JSON.`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.6,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const questions = Array.from({ length: count }, (_, i) => ({
                  id: i + 1,
                  type: i % 2 === 0 ? 'multiple_choice' : 'true_false',
                  question: `Question ${i + 1}: What is a primary concept regarding ${topic || 'this subject'} in ${subject || 'Science'}?`,
                  options: i % 2 === 0 ? ['Core Principle Alpha', 'Distractor Beta', 'Alternative Gamma', 'Variant Delta'] : ['True', 'False'],
                  correctAnswer: i % 2 === 0 ? 'Core Principle Alpha' : 'True',
                  explanation: `This demonstrates basic foundational knowledge for ${topic || 'the topic'}.`,
                  points: 2
                }));
                const fallback = {
                  title: `${subject || 'Academic'} Quiz: ${topic || 'Key Concepts'}`,
                  grade: grade || 'Primary 3',
                  subject: subject || 'General',
                  instructions: 'Read each question carefully and select the best answer.',
                  timeLimitMinutes: 15,
                  questions,
                  totalPoints: count * 2,
                  markingGuide: 'Each question carries 2 marks. Award full points for correct selection.'
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/report-comment') {
              const { studentName, subjectScores, attendanceRate, behaviorNotes, term } = body;
              const prompt = `You are a warm, encouraging, highly professional primary school educator. Write a personalized, constructive, and inspiring report card comment for a student.
Student Name: ${studentName || 'The Student'}
Term: ${term || 'Term 2'}
Subject Scores & Performance: ${JSON.stringify(subjectScores || {})}
Attendance Rate: ${attendanceRate || '96%'}
Teacher Observations: ${behaviorNotes || 'Attentive, participates enthusiastically, helpful to peers'}

Generate a JSON object with:
{
  "academicComment": "2-3 sentences acknowledging academic progress, strengths, and subject specific commendations.",
  "socialBehaviorComment": "1-2 sentences on classroom manners, peer collaboration, and diligence.",
  "growthRecommendation": "1 sentence providing actionable, encouraging guidance for the next term.",
  "fullComment": "The combined, flowing professional report card comment ready for official reporting."
}
Return ONLY valid JSON.`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const fallback = {
                  academicComment: `${studentName || 'The student'} has demonstrated impressive focus and academic enthusiasm this ${term || 'term'}, showing particular strength in core conceptual subjects.`,
                  socialBehaviorComment: `Consistently displays exemplary classroom conduct, works respectfully in team settings, and approaches new challenges with curiosity.`,
                  growthRecommendation: `Continuing daily reading habits and exploring supplementary practical exercises will further consolidate these outstanding achievements next term.`,
                  fullComment: `${studentName || 'The student'} has demonstrated commendable academic dedication and steady progress throughout this ${term || 'term'}. They participate enthusiastically during lessons, cooperate well with peers, and take pride in their work. Continued independent practice at home will further nurture their remarkable potential.`
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/student-insights') {
              const { studentName, performanceData, classAverage } = body;
              const prompt = `Analyze this primary school student's academic metrics and generate pedagogical insights for teachers:
Student: ${studentName}
Performance Metrics: ${JSON.stringify(performanceData)}
Class Benchmarks: ${JSON.stringify(classAverage)}

Return JSON:
{
  "strengths": ["Identified subject strength 1", "Strength 2"],
  "areasForFocus": ["Area requiring reinforcement 1", "Area 2"],
  "learningStyleRecommendations": ["Pedagogical strategy 1", "Pedagogical strategy 2"],
  "summaryNarrative": "Objective, encouraging pedagogical summary for the academic record."
}`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.5,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const fallback = {
                  strengths: ['High mathematical reasoning and rapid mental calculation', 'Strong participation and eagerness in scientific inquiry'],
                  areasForFocus: ['Creative writing vocabulary extension', 'Pacing during timed assessments'],
                  learningStyleRecommendations: ['Utilize structured graphic organizers for essay drafting', 'Encourage peer-led problem solving to boost confidence'],
                  summaryNarrative: `${studentName || 'The student'} maintains above-average mastery across analytical disciplines, with steady improvement observed in continuous assessments.`
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/parent-insights') {
              const { studentName, recentGrades, attendance, term } = body;
              const prompt = `Generate a clear, warm, jargon-free summary for parents about their child's school term progress:
Child Name: ${studentName}
Term: ${term || 'Current Term'}
Grades: ${JSON.stringify(recentGrades)}
Attendance: ${attendance || '95%'}

Return JSON:
{
  "headline": "Encouraging 1-line summary header",
  "academicHighlights": "Parent-friendly narrative of what their child excelled at",
  "homeReinforcementTips": ["Practical home tip 1 (e.g. 15 mins reading together)", "Practical home tip 2"],
  "encouragementMessage": "Uplifting message celebrating effort and growth"
}`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const fallback = {
                  headline: `${studentName || 'Your child'} is thriving and making wonderful progress this term!`,
                  academicHighlights: `${studentName || 'Your child'} has shown wonderful curiosity and steady improvement across all subject areas, notably excelling in numeracy and active class discussions.`,
                  homeReinforcementTips: [
                    'Dedicate 15 minutes each evening to shared reading or discussing their favorite school discoveries.',
                    'Celebrate small milestones and encourage curiosity through everyday problem-solving games at home.'
                  ],
                  encouragementMessage: `We are immensely proud of ${studentName || 'your child'}'s diligence, positive attitude, and kindness towards classmates!`
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/attendance-forecast') {
              const { studentName, className, attendanceRate, absentDays, lateDays, dayBreakdown, consecutiveAbsences } = body;
              const prompt = `You are an educational data analyst and pastoral care specialist. Analyze the following attendance metrics for a student and provide early warning insights:
Student: ${studentName || 'Student'}
Class: ${className || 'Primary Class'}
Current Rate: ${attendanceRate}%
Absent Days: ${absentDays}
Late Days: ${lateDays}
Day of Week Breakdown: ${dayBreakdown || 'None'}
Consecutive Absences: ${consecutiveAbsences || 0}

Return ONLY valid JSON matching this schema:
{
  "riskLevel": "CRITICAL_INTERVENTION_NEEDED" | "MODERATE_MONITORING" | "HEALTHY",
  "projectedTermRate": number,
  "rootCauseHypothesis": "Concise hypothesis based on day patterns and tardiness",
  "pedagogicalImpactAssessment": "Estimated lost instructional hours and learning consequences",
  "recommendedInterventions": ["Action 1", "Action 2", "Action 3"],
  "parentEmailDraft": {
    "subject": "Email Subject Line",
    "body": "Empathetic, partnership-oriented email to guardians"
  }
}`;

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.5,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(response.text || '{}');
                return;
              } else {
                const isSevere = absentDays >= 3 || attendanceRate < 85;
                const fallback = {
                  riskLevel: isSevere ? 'CRITICAL_INTERVENTION_NEEDED' : 'MODERATE_MONITORING',
                  projectedTermRate: Math.max(65, attendanceRate - 4),
                  rootCauseHypothesis: isSevere
                    ? 'Recurring day-of-week clustering indicates structured external scheduling barrier (transportation/family logistics) rather than acute illness.'
                    : 'Isolated occurrences with low systemic risk, manageable with routine morning check-ins.',
                  pedagogicalImpactAssessment: `${studentName} risks missing approximately ${Math.round((100 - attendanceRate) * 0.8)} hours of foundational instructional time if the current trajectory continues.`,
                  recommendedInterventions: [
                    'Arrange an empathetic 15-minute diagnostic conference with guardians.',
                    'Assign an arrival check-in buddy to incentivize timely 08:00 AM classroom entry.',
                    'Prepare a catch-up packet covering missed morning literacy/math warm-ups.'
                  ],
                  parentEmailDraft: {
                    subject: `Oakridge Academy: Supporting ${studentName}'s Attendance & Classroom Success`,
                    body: `Dear Guardian of ${studentName},\n\nWe value having ${studentName} in our classroom every day! We noticed a slight trend in recent absences (${absentDays} days) and want to proactively partner with you to support seamless morning routines.\n\nPlease let us know how we can best support your family.\n\nWarm regards,\n${className || 'Primary'} Teaching Team`
                  }
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallback));
                return;
              }
            }

            if (endpoint === '/api/ai/teacher-chat') {
              const { message, history, teacherName, currentClass, schoolContext } = body;
              const systemPrompt = `You are 'SchoolOS AI', an intelligent, helpful, and concise co-pilot assistant for teachers at Oakridge Academy.
You specialize in:
1. School policies:
   - Grading scale: A+ (90-100%, 4.0), A (80-89%, 3.8), B (70-79%, 3.0), C (60-69%, 2.0), D (50-59%, 1.0), F (<50%, 0.0).
   - Assessment weight: Continuous Assessment (40%) + End of Term Exam (60%).
   - Attendance policy: Chronic absenteeism warning threshold is <85% or 3+ consecutive unexcused absences. Form teachers must contact guardians and notify the Pastoral Lead.
   - Lesson planning standard: Involves 5-min Hook, 10-min Direct Instruction, 15-min Guided/Pair Activity, 10-min Independent Task, 5-min Exit Ticket.
2. Pedagogical resources: Quick classroom warm-ups, differentiated instruction strategies for mixed abilities, formative check techniques, inquiry-based STEM activities, behavior management tips.
3. Quick administrative lookups and guidelines for primary education (Grades 1 to 6).

Teacher using the assistant: ${teacherName || 'Teacher'}
Current Class Focus: ${currentClass || 'Primary 3A'}
Context: ${JSON.stringify(schoolContext || {})}

Keep answers structured, actionable, warm, and professional. Use markdown formatting (bullet points, bold text) for easy reading on busy teacher screens.`;

              const contents = [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\nTeacher Question: ${message}` }] }
              ];

              if (ai) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: `${systemPrompt}\n\nTeacher inquiry: ${message}`,
                  config: {
                    temperature: 0.7,
                  },
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ reply: response.text || 'I am here to assist you with school policies and lesson planning.' }));
                return;
              } else {
                let reply = `Here is guidance regarding your inquiry:\n\n`;
                const msgLower = (message || '').toLowerCase();
                if (msgLower.includes('attendance') || msgLower.includes('absent') || msgLower.includes('chronic')) {
                  reply = `**Oakridge Academy Attendance Policy & Protocols:**\n\n- **Target Attendance:** 95%+ across the academic year.\n- **Chronic Risk Alert:** Triggered when student rate drops below **85%** or upon **3 consecutive unexcused absences**.\n- **Required Action:**\n  1. Review day-of-week pattern in the *AI Attendance Forecasting* tab.\n  2. Issue a supportive guardian check-in email using the pre-drafted template.\n  3. Log the pastoral intervention in the SchoolOS registry for Pastoral Lead review.`;
                } else if (msgLower.includes('grading') || msgLower.includes('score') || msgLower.includes('weight') || msgLower.includes('assessment')) {
                  reply = `**Oakridge Continuous Assessment (CA) & Grading Policy:**\n\n- **Term Composition:** Continuous Assessment (**40%**) + Terminal Examination (**60%**).\n- **CA Sub-weights:** Classwork/Assignments (20 marks) + Midterm Test (40 marks) scaled down to 40%.\n- **Grading Scale:**\n  - **A+ (90-100%)**: 4.0 GPA — Exemplary Mastery\n  - **A (80-89%)**: 3.8 GPA — Excellent Comprehension\n  - **B (70-79%)**: 3.0 GPA — Commendable Progress\n  - **C (60-69%)**: 2.0 GPA — Satisfactory\n  - **D (50-59%)**: 1.0 GPA — Remedial Support Needed\n  - **F (<50%)**: 0.0 GPA — Critical Intervention`;
                } else if (msgLower.includes('differenti') || msgLower.includes('struggling') || msgLower.includes('reading') || msgLower.includes('math')) {
                  reply = `**3 Tier-1 Differentiation Strategies for Primary Classrooms:**\n\n1. **Tiered Task Cards (Must-Do, Should-Do, Aspire-To):** Provide foundational visual work cards with sentence starters for emergent learners while providing open-ended investigative problems for fast finishers.\n2. **Anchor Charts & Visual Manipulatives:** Place tactile counters or step-by-step visual process guides on desks to decrease cognitive overload.\n3. **Peer Collaboration & Partner Talk:** Pair students using reciprocal teaching roles (e.g., 'Reader' and 'Checker') to encourage active verbalization of concepts.`;
                } else {
                  reply = `**SchoolOS Teacher Assistant:**\n\nI can help you with:\n- **School Policies & Timetables:** Checking attendance thresholds, grading scales, and code of conduct.\n- **Pedagogical Strategies:** Quick 5-minute warm-ups, differentiated group activities, and formative checks.\n- **Administrative Support:** Report card comment ideas and parent communication drafts.\n\nHow can I help you with your class today?`;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ reply }));
                return;
              }
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal AI Server Error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
