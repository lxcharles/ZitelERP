export interface TermProgressRecord {
  termId: string;
  academicYear: string;
  termName: string;
  termCode: string;
  periodLabel: string;
  gpa: number;
  overallScore: number;
  cohortAverage: number;
  gradeLetter: string;
  rankInClass: string;
  percentile: number;
  attendanceRate: number;
  subjectScores: {
    subjectName: string;
    score: number;
    cohortAvg: number;
    gradeLetter: string;
    effort: 'Outstanding' | 'Good' | 'Satisfactory';
  }[];
  teacherRemarks: string;
  coreCompetencies: {
    domain: string;
    score: number;
    cohortAvg: number;
  }[];
}

export interface StudentProgressionProfile {
  studentId: string;
  studentName: string;
  className: string;
  enrolledYear: string;
  terms: TermProgressRecord[];
  growthVelocity: {
    annualScoreDelta: number; // e.g. +10%
    bestImprovingSubject: string;
    consistencyScore: number; // 0-100
    learningTrajectory: 'Accelerating' | 'Steady Growth' | 'Stable' | 'Needs Support';
  };
}

export const STUDENT_PROGRESSION_DATA: Record<string, StudentProgressionProfile> = {
  // Leo Rodriguez (Primary 3A) - Continuous Growth from 2024 to 2026
  stu_leo_01: {
    studentId: 'stu_leo_01',
    studentName: 'Leo Rodriguez',
    className: 'Primary 3A',
    enrolledYear: '2024',
    growthVelocity: {
      annualScoreDelta: 10.2,
      bestImprovingSubject: 'Mathematics',
      consistencyScore: 94,
      learningTrajectory: 'Accelerating',
    },
    terms: [
      {
        termId: 'term_24_t1',
        academicYear: '2024/2025',
        termName: 'Term 1 (Autumn 2024)',
        termCode: '24-T1',
        periodLabel: 'Autumn 2024',
        gpa: 3.4,
        overallScore: 82,
        cohortAverage: 78,
        gradeLetter: 'A',
        rankInClass: '5th of 28',
        percentile: 82,
        attendanceRate: 95,
        subjectScores: [
          { subjectName: 'Mathematics', score: 80, cohortAvg: 77, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'English Language', score: 82, cohortAvg: 79, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 81, cohortAvg: 76, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Social Studies', score: 80, cohortAvg: 78, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts', score: 88, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 83, cohortAvg: 76, gradeLetter: 'A', effort: 'Good' },
        ],
        teacherRemarks: 'Leo settled into Primary 2 smoothly with keen enthusiasm for creative tasks.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 80, cohortAvg: 77 },
          { domain: 'Reading & Literacy', score: 82, cohortAvg: 79 },
          { domain: 'Scientific Inquiry', score: 81, cohortAvg: 76 },
          { domain: 'Digital Skills', score: 83, cohortAvg: 76 },
          { domain: 'Creative Expression', score: 88, cohortAvg: 82 },
          { domain: 'Social Cooperation', score: 84, cohortAvg: 80 },
        ],
      },
      {
        termId: 'term_24_t2',
        academicYear: '2024/2025',
        termName: 'Term 2 (Spring 2025)',
        termCode: '24-T2',
        periodLabel: 'Spring 2025',
        gpa: 3.6,
        overallScore: 85,
        cohortAverage: 79,
        gradeLetter: 'A',
        rankInClass: '4th of 28',
        percentile: 86,
        attendanceRate: 96,
        subjectScores: [
          { subjectName: 'Mathematics', score: 85, cohortAvg: 78, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 84, cohortAvg: 80, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 84, cohortAvg: 77, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Social Studies', score: 82, cohortAvg: 79, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts', score: 90, cohortAvg: 83, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 87, cohortAvg: 78, gradeLetter: 'A', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Showed noticeable improvements in mathematical problem-solving speed and group projects.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 85, cohortAvg: 78 },
          { domain: 'Reading & Literacy', score: 84, cohortAvg: 80 },
          { domain: 'Scientific Inquiry', score: 84, cohortAvg: 77 },
          { domain: 'Digital Skills', score: 87, cohortAvg: 78 },
          { domain: 'Creative Expression', score: 90, cohortAvg: 83 },
          { domain: 'Social Cooperation', score: 88, cohortAvg: 82 },
        ],
      },
      {
        termId: 'term_24_t3',
        academicYear: '2024/2025',
        termName: 'Term 3 (Summer 2025)',
        termCode: '24-T3',
        periodLabel: 'Summer 2025',
        gpa: 3.8,
        overallScore: 88,
        cohortAverage: 80,
        gradeLetter: 'A',
        rankInClass: '3rd of 28',
        percentile: 90,
        attendanceRate: 97,
        subjectScores: [
          { subjectName: 'Mathematics', score: 89, cohortAvg: 79, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 86, cohortAvg: 81, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Basic Science', score: 87, cohortAvg: 78, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 85, cohortAvg: 80, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts', score: 92, cohortAvg: 84, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 90, cohortAvg: 79, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Concluded Primary 2 with top-tier marks in Science experiments and numeracy.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 89, cohortAvg: 79 },
          { domain: 'Reading & Literacy', score: 86, cohortAvg: 81 },
          { domain: 'Scientific Inquiry', score: 87, cohortAvg: 78 },
          { domain: 'Digital Skills', score: 90, cohortAvg: 79 },
          { domain: 'Creative Expression', score: 92, cohortAvg: 84 },
          { domain: 'Social Cooperation', score: 90, cohortAvg: 84 },
        ],
      },
      {
        termId: 'term_25_t1',
        academicYear: '2025/2026',
        termName: 'Term 1 (Autumn 2025)',
        termCode: '25-T1',
        periodLabel: 'Autumn 2025',
        gpa: 3.85,
        overallScore: 89,
        cohortAverage: 81,
        gradeLetter: 'A',
        rankInClass: '2nd of 28',
        percentile: 93,
        attendanceRate: 96,
        subjectScores: [
          { subjectName: 'Mathematics', score: 91, cohortAvg: 80, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 87, cohortAvg: 82, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 89, cohortAvg: 79, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 86, cohortAvg: 81, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts', score: 93, cohortAvg: 86, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 92, cohortAvg: 80, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Transitioned smoothly into Primary 3A. Demonstrates proactive peer mentoring.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 91, cohortAvg: 80 },
          { domain: 'Reading & Literacy', score: 87, cohortAvg: 82 },
          { domain: 'Scientific Inquiry', score: 89, cohortAvg: 79 },
          { domain: 'Digital Skills', score: 92, cohortAvg: 80 },
          { domain: 'Creative Expression', score: 93, cohortAvg: 86 },
          { domain: 'Social Cooperation', score: 92, cohortAvg: 85 },
        ],
      },
      {
        termId: 'term_25_t2',
        academicYear: '2025/2026',
        termName: 'Term 2 (Spring 2026 - Current)',
        termCode: '25-T2 (Current)',
        periodLabel: 'Current Term',
        gpa: 3.95,
        overallScore: 92,
        cohortAverage: 82,
        gradeLetter: 'A+',
        rankInClass: '1st of 28',
        percentile: 98,
        attendanceRate: 96,
        subjectScores: [
          { subjectName: 'Mathematics', score: 94, cohortAvg: 81, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 88, cohortAvg: 83, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Basic Science', score: 92, cohortAvg: 79, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 87, cohortAvg: 82, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts', score: 95, cohortAvg: 88, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 94, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Exemplary term performance with remarkable focus on geometry and fraction problem sets.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 94, cohortAvg: 81 },
          { domain: 'Reading & Literacy', score: 88, cohortAvg: 83 },
          { domain: 'Scientific Inquiry', score: 92, cohortAvg: 79 },
          { domain: 'Digital Skills', score: 94, cohortAvg: 82 },
          { domain: 'Creative Expression', score: 95, cohortAvg: 88 },
          { domain: 'Social Cooperation', score: 94, cohortAvg: 86 },
        ],
      },
      {
        termId: 'term_25_t3_proj',
        academicYear: '2025/2026',
        termName: 'Term 3 (Summer 2026 - Target)',
        termCode: '25-T3 (Target)',
        periodLabel: 'Target Projection',
        gpa: 4.0,
        overallScore: 94.5,
        cohortAverage: 83,
        gradeLetter: 'A+',
        rankInClass: 'Projected 1st',
        percentile: 99,
        attendanceRate: 98,
        subjectScores: [
          { subjectName: 'Mathematics', score: 96, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 91, cohortAvg: 84, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Basic Science', score: 94, cohortAvg: 80, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 90, cohortAvg: 83, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Creative Arts', score: 96, cohortAvg: 89, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Computer Literacy', score: 96, cohortAvg: 83, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Projected to attain the Principal Honor Roll and Junior STEM Academic Badge.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 96, cohortAvg: 82 },
          { domain: 'Reading & Literacy', score: 91, cohortAvg: 84 },
          { domain: 'Scientific Inquiry', score: 94, cohortAvg: 80 },
          { domain: 'Digital Skills', score: 96, cohortAvg: 83 },
          { domain: 'Creative Expression', score: 96, cohortAvg: 89 },
          { domain: 'Social Cooperation', score: 95, cohortAvg: 87 },
        ],
      },
    ],
  },

  // Maya Rodriguez (Primary 1A) - Early Childhood Foundation Growth
  stu_maya_02: {
    studentId: 'stu_maya_02',
    studentName: 'Maya Rodriguez',
    className: 'Primary 1A',
    enrolledYear: '2025',
    growthVelocity: {
      annualScoreDelta: 8.5,
      bestImprovingSubject: 'English Language',
      consistencyScore: 96,
      learningTrajectory: 'Accelerating',
    },
    terms: [
      {
        termId: 'term_m_25_t1',
        academicYear: '2025/2026',
        termName: 'Term 1 (Autumn 2025)',
        termCode: '25-T1',
        periodLabel: 'Autumn 2025',
        gpa: 3.5,
        overallScore: 84,
        cohortAverage: 80,
        gradeLetter: 'A',
        rankInClass: '4th of 24',
        percentile: 85,
        attendanceRate: 98,
        subjectScores: [
          { subjectName: 'Early Numeracy', score: 83, cohortAvg: 79, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Phonics & Literacy', score: 85, cohortAvg: 81, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Discovery Science', score: 84, cohortAvg: 80, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Creative Arts & Music', score: 92, cohortAvg: 86, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Maya has adapted wonderfully to Primary 1 with a delightful love for storytelling.',
        coreCompetencies: [
          { domain: 'Early Numeracy', score: 83, cohortAvg: 79 },
          { domain: 'Phonics Fluency', score: 85, cohortAvg: 81 },
          { domain: 'Motor Skills & Art', score: 92, cohortAvg: 86 },
          { domain: 'Social Sharing', score: 88, cohortAvg: 83 },
        ],
      },
      {
        termId: 'term_m_25_t2',
        academicYear: '2025/2026',
        termName: 'Term 2 (Spring 2026 - Current)',
        termCode: '25-T2 (Current)',
        periodLabel: 'Current Term',
        gpa: 3.8,
        overallScore: 89,
        cohortAverage: 82,
        gradeLetter: 'A',
        rankInClass: '2nd of 24',
        percentile: 94,
        attendanceRate: 99,
        subjectScores: [
          { subjectName: 'Early Numeracy', score: 88, cohortAvg: 81, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Phonics & Literacy', score: 91, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Discovery Science', score: 88, cohortAvg: 80, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Creative Arts & Music', score: 95, cohortAvg: 88, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Thriving with advanced sentence formation, reading fluency, and enthusiastic participation.',
        coreCompetencies: [
          { domain: 'Early Numeracy', score: 88, cohortAvg: 81 },
          { domain: 'Phonics Fluency', score: 91, cohortAvg: 82 },
          { domain: 'Motor Skills & Art', score: 95, cohortAvg: 88 },
          { domain: 'Social Sharing', score: 93, cohortAvg: 85 },
        ],
      },
      {
        termId: 'term_m_25_t3',
        academicYear: '2025/2026',
        termName: 'Term 3 (Summer 2026 - Target)',
        termCode: '25-T3 (Target)',
        periodLabel: 'Target Projection',
        gpa: 3.9,
        overallScore: 92,
        cohortAverage: 83,
        gradeLetter: 'A+',
        rankInClass: 'Projected 1st',
        percentile: 97,
        attendanceRate: 100,
        subjectScores: [
          { subjectName: 'Early Numeracy', score: 91, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Phonics & Literacy', score: 94, cohortAvg: 84, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Discovery Science', score: 90, cohortAvg: 81, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Creative Arts & Music', score: 97, cohortAvg: 89, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'On track to be recognized as top reader of Primary 1 cohort.',
        coreCompetencies: [
          { domain: 'Early Numeracy', score: 91, cohortAvg: 82 },
          { domain: 'Phonics Fluency', score: 94, cohortAvg: 84 },
          { domain: 'Motor Skills & Art', score: 97, cohortAvg: 89 },
          { domain: 'Social Sharing', score: 95, cohortAvg: 87 },
        ],
      },
    ],
  },

  // Ethan Chen (Primary 5B) - STEM Specialist
  stu_ethan_03: {
    studentId: 'stu_ethan_03',
    studentName: 'Ethan Chen',
    className: 'Primary 5B',
    enrolledYear: '2023',
    growthVelocity: {
      annualScoreDelta: 7.8,
      bestImprovingSubject: 'Basic Science & Technology',
      consistencyScore: 95,
      learningTrajectory: 'Accelerating',
    },
    terms: [
      {
        termId: 'term_e_24_t1',
        academicYear: '2024/2025',
        termName: 'Term 1 (Autumn 2024)',
        termCode: '24-T1',
        periodLabel: 'Autumn 2024',
        gpa: 3.7,
        overallScore: 88,
        cohortAverage: 81,
        gradeLetter: 'A',
        rankInClass: '3rd of 28',
        percentile: 91,
        attendanceRate: 98,
        subjectScores: [
          { subjectName: 'Mathematics', score: 92, cohortAvg: 82, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 84, cohortAvg: 81, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 91, cohortAvg: 80, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 85, cohortAvg: 82, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Computer Literacy', score: 94, cohortAvg: 83, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Exceptional computational thinking and analytical problem solving.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 92, cohortAvg: 82 },
          { domain: 'Reading & Literacy', score: 84, cohortAvg: 81 },
          { domain: 'Scientific Inquiry', score: 91, cohortAvg: 80 },
          { domain: 'Digital Skills', score: 94, cohortAvg: 83 },
          { domain: 'Social Cooperation', score: 89, cohortAvg: 84 },
        ],
      },
      {
        termId: 'term_e_25_t2',
        academicYear: '2025/2026',
        termName: 'Term 2 (Spring 2026 - Current)',
        termCode: '25-T2 (Current)',
        periodLabel: 'Current Term',
        gpa: 3.95,
        overallScore: 94,
        cohortAverage: 82,
        gradeLetter: 'A+',
        rankInClass: '1st of 28',
        percentile: 99,
        attendanceRate: 99,
        subjectScores: [
          { subjectName: 'Mathematics', score: 98, cohortAvg: 83, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 89, cohortAvg: 82, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'Basic Science', score: 96, cohortAvg: 81, gradeLetter: 'A+', effort: 'Outstanding' },
          { subjectName: 'Social Studies', score: 90, cohortAvg: 83, gradeLetter: 'A+', effort: 'Good' },
          { subjectName: 'Computer Literacy', score: 99, cohortAvg: 84, gradeLetter: 'A+', effort: 'Outstanding' },
        ],
        teacherRemarks: 'Ranked top in national primary math and robotics challenge.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 98, cohortAvg: 83 },
          { domain: 'Reading & Literacy', score: 89, cohortAvg: 82 },
          { domain: 'Scientific Inquiry', score: 96, cohortAvg: 81 },
          { domain: 'Digital Skills', score: 99, cohortAvg: 84 },
          { domain: 'Social Cooperation', score: 93, cohortAvg: 86 },
        ],
      },
    ],
  },
};

export const getStudentProgression = (studentId: string): StudentProgressionProfile => {
  if (STUDENT_PROGRESSION_DATA[studentId]) {
    return STUDENT_PROGRESSION_DATA[studentId];
  }

  // Generate a dynamic fallback profile for any other student
  return {
    studentId,
    studentName: 'Student Profile',
    className: 'Primary Section',
    enrolledYear: '2025',
    growthVelocity: {
      annualScoreDelta: 6.4,
      bestImprovingSubject: 'Mathematics',
      consistencyScore: 91,
      learningTrajectory: 'Steady Growth',
    },
    terms: [
      {
        termId: 'fallback_t1',
        academicYear: '2025/2026',
        termName: 'Term 1 (Autumn)',
        termCode: '25-T1',
        periodLabel: 'Autumn 2025',
        gpa: 3.5,
        overallScore: 82,
        cohortAverage: 78,
        gradeLetter: 'A',
        rankInClass: '6th of 28',
        percentile: 80,
        attendanceRate: 94,
        subjectScores: [
          { subjectName: 'Mathematics', score: 81, cohortAvg: 77, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'English Language', score: 82, cohortAvg: 79, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 80, cohortAvg: 76, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Social Studies', score: 83, cohortAvg: 80, gradeLetter: 'A', effort: 'Good' },
        ],
        teacherRemarks: 'Consistent dedication and steady participation.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 81, cohortAvg: 77 },
          { domain: 'Reading & Literacy', score: 82, cohortAvg: 79 },
          { domain: 'Scientific Inquiry', score: 80, cohortAvg: 76 },
          { domain: 'Creative Expression', score: 85, cohortAvg: 82 },
        ],
      },
      {
        termId: 'fallback_t2',
        academicYear: '2025/2026',
        termName: 'Term 2 (Spring - Current)',
        termCode: '25-T2',
        periodLabel: 'Current Term',
        gpa: 3.75,
        overallScore: 87,
        cohortAverage: 81,
        gradeLetter: 'A',
        rankInClass: '4th of 28',
        percentile: 88,
        attendanceRate: 96,
        subjectScores: [
          { subjectName: 'Mathematics', score: 88, cohortAvg: 80, gradeLetter: 'A', effort: 'Outstanding' },
          { subjectName: 'English Language', score: 86, cohortAvg: 82, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Basic Science', score: 86, cohortAvg: 78, gradeLetter: 'A', effort: 'Good' },
          { subjectName: 'Social Studies', score: 87, cohortAvg: 81, gradeLetter: 'A', effort: 'Good' },
        ],
        teacherRemarks: 'Good upward momentum and strong classroom conduct.',
        coreCompetencies: [
          { domain: 'Mathematical Logic', score: 88, cohortAvg: 80 },
          { domain: 'Reading & Literacy', score: 86, cohortAvg: 82 },
          { domain: 'Scientific Inquiry', score: 86, cohortAvg: 78 },
          { domain: 'Creative Expression', score: 89, cohortAvg: 84 },
        ],
      },
    ],
  };
};
