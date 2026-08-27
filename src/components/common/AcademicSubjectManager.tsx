import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Award,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
  ChevronRight,
  HelpCircle,
  Save,
  Check,
  Shield,
  Sliders,
  UserCheck,
  BookMarked,
  Tag
} from 'lucide-react';
import {
  User,
  Subject,
  ClassRoom,
  GradingStructure,
  ClassSubjectAssignment,
  AcademicSection,
  SubjectCategory,
  TeacherAssignmentType,
  GradingBreakdown
} from '../../types';
import { db } from '../../services/db';

interface AcademicSubjectManagerProps {
  currentUser: User;
  onSubjectUpdated?: () => void;
}

export const AcademicSubjectManager: React.FC<AcademicSubjectManagerProps> = ({
  currentUser,
  onSubjectUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'assignments' | 'grading'>('catalogue');
  
  // Catalogue filters
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<ClassSubjectAssignment | null>(null);
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState<string>('ALL');

  const [showGradingModal, setShowGradingModal] = useState<boolean>(false);
  const [editingGrading, setEditingGrading] = useState<GradingStructure | null>(null);
  const [gradingValidationError, setGradingValidationError] = useState<string | null>(null);

  // Data queries
  const allSubjects = db.getSubjects();
  const allClasses = db.getClasses();
  const allTeachers = db.getUsers().filter(u => u.role === 'TEACHER' || u.role === 'ADMIN');
  const allAssignments = db.getClassSubjectAssignments();
  const allGradingStructures = db.getGradingStructures();
  const branches = db.getBranches();

  // Filtered subjects
  const filteredSubjects = allSubjects.filter(sub => {
    if (selectedLevel !== 'ALL' && sub.educationalLevel !== selectedLevel && sub.sectionType !== selectedLevel) {
      return false;
    }
    if (selectedCategory !== 'ALL' && sub.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'ALL' && (sub.status || 'active') !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = sub.name.toLowerCase().includes(q);
      const matchCode = sub.code.toLowerCase().includes(q);
      const matchDesc = sub.description?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc) return false;
    }
    return true;
  });

  // Subject Form State
  const [subjectForm, setSubjectForm] = useState<{
    name: string;
    code: string;
    category: SubjectCategory;
    educationalLevel: AcademicSection;
    isCompulsory: boolean;
    status: 'active' | 'inactive';
    description: string;
    icon: string;
    gradeLevels: number[];
  }>({
    name: '',
    code: '',
    category: 'Core',
    educationalLevel: 'PRIMARY',
    isCompulsory: true,
    status: 'active',
    description: '',
    icon: 'BookOpen',
    gradeLevels: [1, 2, 3, 4, 5, 6],
  });

  // Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState<{
    classId: string;
    subjectId: string;
    teacherId: string;
    teacherType: TeacherAssignmentType;
    isCompulsory: boolean;
    periodsPerWeek: number;
    notes?: string;
  }>({
    classId: allClasses[0]?.id || '',
    subjectId: allSubjects[0]?.id || '',
    teacherId: allTeachers[0]?.id || '',
    teacherType: 'SUBJECT_TEACHER',
    isCompulsory: true,
    periodsPerWeek: 4,
  });

  // Grading Scheme Form State
  const [gradingForm, setGradingForm] = useState<{
    name: string;
    description: string;
    level: 'SCHOOL_DEFAULT' | 'SECTION' | 'CLASS' | 'SUBJECT';
    targetId?: string;
    caWeight: number;
    examWeight: number;
    breakdown: GradingBreakdown[];
    isDefault: boolean;
  }>({
    name: 'Nigerian Universal (30% CA / 70% Exam)',
    description: 'Standard continuous assessment & terminal examination scheme',
    level: 'SCHOOL_DEFAULT',
    caWeight: 30,
    examWeight: 70,
    breakdown: [
      { name: '1st Continuous Assessment (Test)', weight: 10, maxScore: 10 },
      { name: '2nd Continuous Assessment (Mid-Term / Project)', weight: 10, maxScore: 10 },
      { name: 'Assignments, Homework & Class Participation', weight: 10, maxScore: 10 },
      { name: 'End of Term Examination', weight: 70, maxScore: 70 },
    ],
    isDefault: true,
  });

  // Handlers for Subjects
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      code: '',
      category: 'Core',
      educationalLevel: 'PRIMARY',
      isCompulsory: true,
      status: 'active',
      description: '',
      icon: 'BookOpen',
      gradeLevels: [1, 2, 3, 4, 5, 6],
    });
    setShowAddSubjectModal(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      code: sub.code,
      category: sub.category,
      educationalLevel: sub.educationalLevel || sub.sectionType || 'PRIMARY',
      isCompulsory: sub.isCompulsory !== undefined ? sub.isCompulsory : true,
      status: sub.status || 'active',
      description: sub.description || '',
      icon: sub.icon || 'BookOpen',
      gradeLevels: sub.gradeLevels || [1, 2, 3, 4, 5, 6],
    });
    setShowAddSubjectModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      alert('Please fill in both the Subject Name and Code.');
      return;
    }

    if (editingSubject) {
      db.updateSubject(
        editingSubject.id,
        {
          name: subjectForm.name.trim(),
          code: subjectForm.code.trim().toUpperCase(),
          category: subjectForm.category,
          educationalLevel: subjectForm.educationalLevel,
          sectionType: subjectForm.educationalLevel,
          isCompulsory: subjectForm.isCompulsory,
          status: subjectForm.status,
          description: subjectForm.description.trim(),
          icon: subjectForm.icon,
          gradeLevels: subjectForm.gradeLevels,
        },
        currentUser
      );
    } else {
      db.createSubject(
        {
          name: subjectForm.name.trim(),
          code: subjectForm.code.trim().toUpperCase(),
          category: subjectForm.category,
          educationalLevel: subjectForm.educationalLevel,
          sectionType: subjectForm.educationalLevel,
          isCompulsory: subjectForm.isCompulsory,
          status: subjectForm.status,
          description: subjectForm.description.trim(),
          icon: subjectForm.icon,
          gradeLevels: subjectForm.gradeLevels,
        },
        currentUser
      );
    }

    setShowAddSubjectModal(false);
    if (onSubjectUpdated) onSubjectUpdated();
  };

  const handleToggleSubjectStatus = (sub: Subject) => {
    db.toggleSubjectStatus(sub.id, currentUser);
    if (onSubjectUpdated) onSubjectUpdated();
  };

  const handleDeleteSubject = (sub: Subject) => {
    if (confirm(`Are you sure you want to delete the subject "${sub.name}" (${sub.code})?`)) {
      db.deleteSubject(sub.id, currentUser);
      if (onSubjectUpdated) onSubjectUpdated();
    }
  };

  // Handlers for Assignment
  const handleOpenAssignModal = (prefillClassId?: string, prefillSubjectId?: string) => {
    setEditingAssignment(null);
    setAssignmentForm({
      classId: prefillClassId || (allClasses[0]?.id || ''),
      subjectId: prefillSubjectId || (allSubjects[0]?.id || ''),
      teacherId: allTeachers[0]?.id || '',
      teacherType: 'SUBJECT_TEACHER',
      isCompulsory: true,
      periodsPerWeek: 4,
    });
    setShowAssignModal(true);
  };

  const handleOpenEditAssignment = (assignment: ClassSubjectAssignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      teacherType: assignment.teacherType,
      isCompulsory: assignment.isCompulsory,
      periodsPerWeek: assignment.periodsPerWeek,
      notes: assignment.notes,
    });
    setShowAssignModal(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = allClasses.find(c => c.id === assignmentForm.classId);
    const sub = allSubjects.find(s => s.id === assignmentForm.subjectId);
    const tchr = allTeachers.find(t => t.id === assignmentForm.teacherId);

    if (!cls || !sub || !tchr) {
      alert('Please ensure valid class, subject, and teacher selections.');
      return;
    }

    if (editingAssignment) {
      db.updateClassSubjectAssignment(
        editingAssignment.id,
        {
          classId: cls.id,
          className: cls.name,
          branchId: cls.branchId,
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          category: sub.category,
          teacherId: tchr.id,
          teacherName: tchr.name,
          teacherType: assignmentForm.teacherType,
          isCompulsory: assignmentForm.isCompulsory,
          periodsPerWeek: assignmentForm.periodsPerWeek,
          notes: assignmentForm.notes,
        },
        currentUser
      );
    } else {
      db.assignTeacherToClassSubject(
        {
          classId: cls.id,
          className: cls.name,
          branchId: cls.branchId,
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          category: sub.category,
          teacherId: tchr.id,
          teacherName: tchr.name,
          teacherType: assignmentForm.teacherType,
          isCompulsory: assignmentForm.isCompulsory,
          status: 'active',
          periodsPerWeek: assignmentForm.periodsPerWeek,
          notes: assignmentForm.notes,
        },
        currentUser
      );
    }

    setShowAssignModal(false);
    if (onSubjectUpdated) onSubjectUpdated();
  };

  const handleRemoveAssignment = (assignment: ClassSubjectAssignment) => {
    if (confirm(`Remove allocation for ${assignment.subjectName} taught by ${assignment.teacherName} in ${assignment.className}?`)) {
      db.removeClassSubjectAssignment(assignment.id, currentUser);
      if (onSubjectUpdated) onSubjectUpdated();
    }
  };

  // Handlers for Grading Structures
  const handleOpenAddGrading = () => {
    setEditingGrading(null);
    setGradingValidationError(null);
    setGradingForm({
      name: 'Continuous Assessment Scheme (40/60)',
      description: '40% Continuous Assessment and 60% Terminal Examination weighting',
      level: 'SCHOOL_DEFAULT',
      caWeight: 40,
      examWeight: 60,
      breakdown: [
        { name: '1st Test', weight: 15, maxScore: 15 },
        { name: '2nd Test / Assignment', weight: 15, maxScore: 15 },
        { name: 'Class Project & Practical', weight: 10, maxScore: 10 },
        { name: 'Terminal Examination', weight: 60, maxScore: 60 },
      ],
      isDefault: false,
    });
    setShowGradingModal(true);
  };

  const handleOpenEditGrading = (gs: GradingStructure) => {
    setEditingGrading(gs);
    setGradingValidationError(null);
    setGradingForm({
      name: gs.name,
      description: gs.description,
      level: gs.level,
      targetId: gs.targetId,
      caWeight: gs.caWeight,
      examWeight: gs.examWeight,
      breakdown: gs.breakdown || [],
      isDefault: Boolean(gs.isDefault),
    });
    setShowGradingModal(true);
  };

  const handleBreakdownChange = (index: number, field: 'name' | 'weight' | 'maxScore', val: string | number) => {
    const updated = [...gradingForm.breakdown];
    updated[index] = { ...updated[index], [field]: val };
    
    // Auto-calculate CA and Exam weight from breakdown
    const examItem = updated.find(b => b.name.toLowerCase().includes('exam'));
    const caItems = updated.filter(b => !b.name.toLowerCase().includes('exam'));
    const sumCA = caItems.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    const sumExam = examItem ? Number(examItem.weight) || 0 : Number(gradingForm.examWeight) || 0;

    setGradingForm({
      ...gradingForm,
      breakdown: updated,
      caWeight: sumCA,
      examWeight: sumExam,
    });
  };

  const handleAddBreakdownItem = () => {
    setGradingForm({
      ...gradingForm,
      breakdown: [
        ...gradingForm.breakdown,
        { name: 'New Assessment Milestone', weight: 10, maxScore: 10 },
      ],
    });
  };

  const handleRemoveBreakdownItem = (index: number) => {
    const updated = gradingForm.breakdown.filter((_, i) => i !== index);
    setGradingForm({ ...gradingForm, breakdown: updated });
  };

  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(gradingForm.caWeight) + Number(gradingForm.examWeight);
    if (total !== 100) {
      setGradingValidationError(`Total weighting must equal exactly 100%. Currently it totals ${total}%.`);
      return;
    }

    try {
      if (editingGrading) {
        db.updateGradingStructure(
          editingGrading.id,
          {
            name: gradingForm.name.trim(),
            description: gradingForm.description.trim(),
            level: gradingForm.level,
            targetId: gradingForm.targetId,
            caWeight: Number(gradingForm.caWeight),
            examWeight: Number(gradingForm.examWeight),
            breakdown: gradingForm.breakdown,
            isDefault: gradingForm.isDefault,
          },
          currentUser
        );
      } else {
        db.createGradingStructure(
          {
            name: gradingForm.name.trim(),
            description: gradingForm.description.trim(),
            level: gradingForm.level,
            targetId: gradingForm.targetId,
            caWeight: Number(gradingForm.caWeight),
            examWeight: Number(gradingForm.examWeight),
            breakdown: gradingForm.breakdown,
            isDefault: gradingForm.isDefault,
          },
          currentUser
        );
      }

      setShowGradingModal(false);
      if (onSubjectUpdated) onSubjectUpdated();
    } catch (err: any) {
      setGradingValidationError(err.message || 'Error saving grading structure.');
    }
  };

  const handleDeleteGrading = (gs: GradingStructure) => {
    if (gs.isDefault) {
      alert('Cannot delete the active default grading structure. Please set another scheme as default first.');
      return;
    }
    if (confirm(`Are you sure you want to delete the grading scheme "${gs.name}"?`)) {
      db.deleteGradingStructure(gs.id, currentUser);
      if (onSubjectUpdated) onSubjectUpdated();
    }
  };

  // Groupings for Assignment View
  const displayedClasses = selectedClassForAssignment === 'ALL'
    ? allClasses
    : allClasses.filter(c => c.id === selectedClassForAssignment);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Nigerian Academic & Subject Management System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Subjects, Grading & Academic Allocations
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Manage complete Nigerian curricula (Primary, Junior & Senior Secondary), configure continuous assessment vs. examination weighting (100% total rule), and enforce strict subject-based teacher permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'catalogue' && (
              <button
                id="btn-add-new-subject"
                onClick={handleOpenAddSubject}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Subject</span>
              </button>
            )}

            {activeTab === 'assignments' && (
              <button
                id="btn-allocate-teacher-subject"
                onClick={() => handleOpenAssignModal()}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Allocate Subject Teacher</span>
              </button>
            )}

            {activeTab === 'grading' && (
              <button
                id="btn-add-grading-scheme"
                onClick={handleOpenAddGrading}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Create Grading Scheme</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'catalogue'
                ? 'bg-white text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject Catalogue ({allSubjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'assignments'
                ? 'bg-white text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Teacher Allocations ({allAssignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'grading'
                ? 'bg-white text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Grading Schemes & Weighting ({allGradingStructures.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBJECT CATALOGUE */}
      {/* ========================================================================= */}
      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          {/* Filtering Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject by name, code (e.g. ENG-JSS, MTH-PRI), or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Educational Levels</option>
                <option value="PRIMARY">Primary School (Basic 1–6)</option>
                <option value="JUNIOR_SECONDARY">Junior Secondary (JSS 1–3)</option>
                <option value="SENIOR_SECONDARY">Senior Secondary (SS 1–3)</option>
                <option value="EARLY_YEARS">Early Years / Nursery</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Categories</option>
                <option value="Core">Core / General</option>
                <option value="Science">Science & Technology</option>
                <option value="Humanities">Humanities & Arts</option>
                <option value="Business">Business & Commercial</option>
                <option value="Vocational">Vocational & Technical</option>
                <option value="Trade">Trade Subjects</option>
                <option value="Language">Language & Literacy</option>
                <option value="Practical">Special / Practical</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Educational Level Section Cards */}
          {(['PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY'] as AcademicSection[]).map(levelKey => {
            if (selectedLevel !== 'ALL' && selectedLevel !== levelKey) return null;

            const levelSubjects = filteredSubjects.filter(
              s => (s.educationalLevel === levelKey || s.sectionType === levelKey)
            );

            const levelTitleMap = {
              PRIMARY: 'Primary School (Basic 1–6)',
              JUNIOR_SECONDARY: 'Junior Secondary School (JSS 1–3)',
              SENIOR_SECONDARY: 'Senior Secondary School (SS 1–3)',
              EARLY_YEARS: 'Early Years / Nursery (Pre-KG – Nursery 2)',
            };

            const levelBadgeColor = {
              PRIMARY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              JUNIOR_SECONDARY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              SENIOR_SECONDARY: 'bg-purple-50 text-purple-700 border-purple-200',
              EARLY_YEARS: 'bg-amber-50 text-amber-700 border-amber-200',
            };

            return (
              <div key={levelKey} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${levelBadgeColor[levelKey]}`}>
                      {levelKey.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {levelTitleMap[levelKey]}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      ({levelSubjects.length} subjects)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjectForm({
                        name: '',
                        code: '',
                        category: 'Core',
                        educationalLevel: levelKey,
                        isCompulsory: true,
                        status: 'active',
                        description: '',
                        icon: 'BookOpen',
                        gradeLevels: levelKey === 'PRIMARY' ? [1, 2, 3, 4, 5, 6] : levelKey === 'JUNIOR_SECONDARY' ? [7, 8, 9] : [10, 11, 12],
                      });
                      setShowAddSubjectModal(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {levelKey.replace('_', ' ')}</span>
                  </button>
                </div>

                {levelSubjects.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No subjects found matching the filter criteria in this academic division.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                      {levelSubjects.map(subject => {
                        const isInactive = subject.status === 'inactive';
                        const assignmentsCount = allAssignments.filter(a => a.subjectId === subject.id).length;

                        return (
                          <div
                            key={subject.id}
                            id={`subject-card-${subject.id}`}
                            className={`p-4 rounded-xl border transition-all ${
                              isInactive
                                ? 'bg-slate-50/70 border-slate-200 opacity-60'
                                : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {subject.code}
                                  </span>
                                  {subject.isCompulsory && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                                      Compulsory
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    isInactive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {subject.status || 'active'}
                                  </span>
                                </div>

                                <h4 className="font-bold text-sm text-slate-900 mt-2 truncate">
                                  {subject.name}
                                </h4>

                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {subject.description || 'Nigerian standard curriculum course module'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                              <span className="inline-flex items-center space-x-1 font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                <Tag className="w-3 h-3" />
                                <span>{subject.category}</span>
                              </span>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleToggleSubjectStatus(subject)}
                                  title={isInactive ? 'Activate Subject' : 'Deactivate Subject'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isInactive
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  }`}
                                >
                                  {isInactive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </button>

                                <button
                                  onClick={() => handleOpenEditSubject(subject)}
                                  title="Edit Subject"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteSubject(subject)}
                                  title="Delete Subject"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASS & SUBJECT TEACHER ALLOCATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Class Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter By Class:</span>
              <select
                value={selectedClassForAssignment}
                onChange={e => setSelectedClassForAssignment(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Classes & Cohorts ({allClasses.length})</option>
                {allClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.branchName || 'Branch'})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Allocated Subjects: <strong className="text-indigo-600">{allAssignments.length}</strong> subject-teacher links
            </div>
          </div>

          {/* Classes Breakdown */}
          <div className="space-y-6">
            {displayedClasses.map(cls => {
              const classAssignments = allAssignments.filter(a => a.classId === cls.id);
              const formTeacher = allTeachers.find(t => t.id === cls.formTeacherId);

              return (
                <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Class Header */}
                  <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-lg font-black text-slate-900">{cls.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {cls.sectionType || 'ACADEMIC'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          📍 {cls.branchName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-600">
                        <span>
                          Form Teacher:{' '}
                          <strong className="text-slate-900">
                            {cls.formTeacherName || formTeacher?.name || 'Not Assigned'}
                          </strong>{' '}
                          <span className="text-[11px] text-slate-400">(Class Oversight & General Reports)</span>
                        </span>
                        <span>•</span>
                        <span>Enrolled: <strong>{cls.enrolledCount || 0} students</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenAssignModal(cls.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Subject to {cls.name}</span>
                    </button>
                  </div>

                  {/* Allocated Subjects Table */}
                  {classAssignments.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      No explicit subject teachers assigned yet. In primary classes, the Form Teacher oversees all subjects by default.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3">Subject Code & Name</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Assigned Teacher</th>
                            <th className="px-6 py-3">Role Type</th>
                            <th className="px-6 py-3">Periods / Week</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {classAssignments.map(assignment => (
                            <tr key={assignment.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-3.5 font-bold text-slate-900">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-2 border">
                                  {assignment.subjectCode}
                                </span>
                                {assignment.subjectName}
                              </td>
                              <td className="px-6 py-3.5 text-slate-600 font-medium">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                                  {assignment.category}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-slate-800">
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span>{assignment.teacherName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  assignment.teacherType === 'SPECIALIST_TEACHER'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : assignment.teacherType === 'FORM_TEACHER'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  {assignment.teacherType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-slate-600 font-bold">
                                {assignment.periodsPerWeek || 4} periods
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => handleOpenEditAssignment(assignment)}
                                    title="Edit Assignment"
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveAssignment(assignment)}
                                    title="Remove Allocation"
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GRADING & ASSESSMENT WEIGHTING SCHEMES */}
      {/* ========================================================================= */}
      {activeTab === 'grading' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Strict 100% Weighting Rule:</strong>
              <p className="mt-0.5 text-amber-800">
                All continuous assessments (CA) and examination percentages must sum to exactly 100%. The system will enforce this constraint during configuration and report card computation.
              </p>
            </div>
          </div>

          {/* List of Grading Schemes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allGradingStructures.map(gs => {
              const isDefault = Boolean(gs.isDefault);

              return (
                <div
                  key={gs.id}
                  id={`grading-scheme-${gs.id}`}
                  className={`bg-white rounded-2xl border p-6 transition-all relative ${
                    isDefault
                      ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                      : 'border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900">{gs.name}</span>
                        {isDefault && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                            Active Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{gs.description}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditGrading(gs)}
                        title="Edit Scheme"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => handleDeleteGrading(gs)}
                          title="Delete Scheme"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weighting Meter */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Continuous Assessment: <strong className="text-indigo-600">{gs.caWeight}%</strong></span>
                      <span>Terminal Exam: <strong className="text-purple-600">{gs.examWeight}%</strong></span>
                    </div>

                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${gs.caWeight}%` }}
                        className="bg-indigo-600 h-full"
                        title={`CA ${gs.caWeight}%`}
                      />
                      <div
                        style={{ width: `${gs.examWeight}%` }}
                        className="bg-purple-600 h-full"
                        title={`Exam ${gs.examWeight}%`}
                      />
                    </div>
                  </div>

                  {/* Sub-component Breakdown List */}
                  {Array.isArray(gs.breakdown) && gs.breakdown.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Assessment Weight Breakdown:
                      </p>
                      {gs.breakdown.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-600 py-1 px-2 rounded-lg bg-slate-50">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-bold text-slate-900">{item.weight}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scope Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Applicability Scope: <strong>{gs.level.replace('_', ' ')}</strong>
                    </span>
                    {gs.updatedBy && <span>Updated by {gs.updatedBy}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUBJECT */}
      {/* ========================================================================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Add New Academic Subject'}
              </h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Mathematics, Literature in English"
                    value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MTH-SSS, LIT-JSS"
                    value={subjectForm.code}
                    onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Educational Level *</label>
                  <select
                    value={subjectForm.educationalLevel}
                    onChange={e => setSubjectForm({ ...subjectForm, educationalLevel: e.target.value as AcademicSection })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="PRIMARY">Primary School (Basic 1–6)</option>
                    <option value="JUNIOR_SECONDARY">Junior Secondary (JSS 1–3)</option>
                    <option value="SENIOR_SECONDARY">Senior Secondary (SS 1–3)</option>
                    <option value="EARLY_YEARS">Early Years / Nursery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={subjectForm.category}
                    onChange={e => setSubjectForm({ ...subjectForm, category: e.target.value as SubjectCategory })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Core">Core</option>
                    <option value="Science">Science</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Business">Business</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Trade">Trade Subjects</option>
                    <option value="Language">Language</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Curriculum Syllabus</label>
                <textarea
                  rows={2}
                  placeholder="Summary of syllabus scope, objectives, or external exam references (e.g. WASSCE, BECE)..."
                  value={subjectForm.description}
                  onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectForm.isCompulsory}
                    onChange={e => setSubjectForm({ ...subjectForm, isCompulsory: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Compulsory for all enrolled students in cohort</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectForm.status === 'active'}
                    onChange={e => setSubjectForm({ ...subjectForm, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Active & Available for Teacher Allocation</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-colors"
                >
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALLOCATE TEACHER TO CLASS SUBJECT */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAssignment ? 'Edit Subject Teacher Allocation' : 'Allocate Teacher to Class Subject'}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Class Cohort *</label>
                <select
                  value={assignmentForm.classId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {allClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.branchName || 'Campus'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject to Assign *</label>
                <select
                  value={assignmentForm.subjectId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {allSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.educationalLevel || s.sectionType || 'ALL'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty / Teacher *</label>
                <select
                  value={assignmentForm.teacherId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.customRoleTitle || t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Role Type *</label>
                  <select
                    value={assignmentForm.teacherType}
                    onChange={e => setAssignmentForm({ ...assignmentForm, teacherType: e.target.value as TeacherAssignmentType })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="SUBJECT_TEACHER">Subject Teacher</option>
                    <option value="SPECIALIST_TEACHER">Specialist Teacher (e.g. French, Music, Robotics)</option>
                    <option value="FORM_TEACHER">Form Teacher (Class Head)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Periods</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={assignmentForm.periodsPerWeek}
                    onChange={e => setAssignmentForm({ ...assignmentForm, periodsPerWeek: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-colors"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT GRADING STRUCTURE */}
      {/* ========================================================================= */}
      {showGradingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGrading ? `Edit Grading Scheme: ${editingGrading.name}` : 'Configure Academic Grading Scheme'}
              </h3>
              <button
                onClick={() => setShowGradingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {gradingValidationError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gradingValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGrading} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nigerian Universal 30/70, Continuous Assessment 40/60"
                  value={gradingForm.name}
                  onChange={e => setGradingForm({ ...gradingForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe when this scheme is applied (e.g. Primary Basic 1-6 CA and Exam breakdown)..."
                  value={gradingForm.description}
                  onChange={e => setGradingForm({ ...gradingForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Weighting Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <label className="block text-xs font-bold text-indigo-900 mb-1">CA Total Weight (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingForm.caWeight}
                    onChange={e => {
                      const ca = parseInt(e.target.value, 10) || 0;
                      setGradingForm({ ...gradingForm, caWeight: ca, examWeight: 100 - ca });
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-base font-black text-indigo-900 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <label className="block text-xs font-bold text-purple-900 mb-1">Exam Total Weight (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingForm.examWeight}
                    onChange={e => {
                      const exam = parseInt(e.target.value, 10) || 0;
                      setGradingForm({ ...gradingForm, examWeight: exam, caWeight: 100 - exam });
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-base font-black text-purple-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Status */}
              <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                Number(gradingForm.caWeight) + Number(gradingForm.examWeight) === 100
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <span>Total Assessment Weighting:</span>
                <span>{Number(gradingForm.caWeight) + Number(gradingForm.examWeight)}% / 100%</span>
              </div>

              {/* Breakdown Items Editor */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Continuous Assessment Sub-Components
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBreakdownItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Assessment Milestone</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {gradingForm.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Milestone (e.g. 1st Test)"
                        value={item.name}
                        onChange={e => handleBreakdownChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                      />
                      <div className="w-24 relative">
                        <input
                          type="number"
                          placeholder="%"
                          value={item.weight}
                          onChange={e => handleBreakdownChange(idx, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full pr-6 pl-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBreakdownItem(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gradingForm.isDefault}
                    onChange={e => setGradingForm({ ...gradingForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Set as Active School-Wide Default Scheme</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Number(gradingForm.caWeight) + Number(gradingForm.examWeight) !== 100}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md transition-colors"
                >
                  Save Grading Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
