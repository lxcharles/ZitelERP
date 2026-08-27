import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

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

  // AI Assistant Chat endpoint (Teacher & Admin Co-Pilot)
  app.post('/api/ai/teacher-chat', async (req: Request, res: Response) => {
    try {
      const { message, teacherName, currentClass, schoolContext } = req.body;
      const ai = getGeminiClient();

      const systemInstruction = `You are SchoolOS AI, the official pedagogical and administrative AI Co-Pilot for Zitel Castle School (a prestigious multi-branch Nigerian institution with Bungalow and Ijegun campuses).
You assist faculty, heads of department, and school administrators with:
1. School Policies: Attendance tracking (target 95%+, chronic alert at <85% or 3+ consecutive days), Continuous Assessment (40% continuous assessment comprising 10% classwork, 10% homework, 20% midterm test; 60% terminal examination), grading scheme (A+: 90-100%, A: 80-89%, B: 70-79%, C: 60-69%, D: 50-59%, F: <50%).
2. Currency & Fees: School fees and accounting are in Nigerian Naira (₦).
3. Pedagogical Strategies: Differentiated instruction (Tier 1-3), lesson warm-ups, exit slips, STEM & Phonics scaffolding for Nursery to Primary levels.
4. Administrative support: Parent correspondence, rubric design, student encouragement notes.

Context for current conversation:
- Teacher/Staff Name: ${teacherName || 'Faculty Member'}
- Active Class/Section: ${currentClass || 'General'}
- Campus Scope: ${schoolContext?.branchName || 'Zitel Castle School (Bungalow / Ijegun)'}

Provide concise, friendly, and structured responses using clear Markdown (bullet points, bolding).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
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
