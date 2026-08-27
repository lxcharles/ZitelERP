import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Paperclip,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Copy,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Upload,
  X,
  ExternalLink,
  BookMarked
} from 'lucide-react';
import {
  User,
  ClassRoom,
  Subject,
  LessonNote,
  LessonNoteAttachment
} from '../../types';
import { db } from '../../services/db';

interface LessonNotesManagerProps {
  currentUser: User;
  assignedClasses?: ClassRoom[];
  teacherSubjects?: Subject[];
  initialClassId?: string;
  initialSubjectId?: string;
}

export const LessonNotesManager: React.FC<LessonNotesManagerProps> = ({
  currentUser,
  assignedClasses = [],
  teacherSubjects = [],
  initialClassId,
  initialSubjectId,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassId || 'all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(initialSubjectId || 'all');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Lesson Notes List from DB
  const [notes, setNotes] = useState<LessonNote[]>(() => {
    return db.getAuthorizedLessonNotes(currentUser.id);
  });

  // Modal & Detail States
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<LessonNote | null>(null);

  // Form State for creating/editing note
  const [formData, setFormData] = useState({
    classId: initialClassId || (assignedClasses[0]?.id || 'cls_basic3a_bgl'),
    subjectId: initialSubjectId || (teacherSubjects[0]?.id || 'sub_math_pri'),
    topic: '',
    subTopic: '',
    date: new Date().toISOString().split('T')[0],
    term: 'Term 1',
    weekNumber: 3,
    duration: '40 mins',
    learningObjectivesText: '',
    previousKnowledge: '',
    instructionalMaterialsText: '',
    introduction: '',
    lessonContent: '',
    teacherActivities: '',
    studentActivities: '',
    evaluation: '',
    assignment: '',
    conclusion: '',
    teacherRemarks: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    attachments: [] as LessonNoteAttachment[],
  });

  // Temporary attachment upload state
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | 'doc' | 'other'>('pdf');
  const [attachmentCategory, setAttachmentCategory] = useState<'Worksheet' | 'Board Work' | 'Teaching Aid' | 'Diagram' | 'Other'>('Worksheet');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const refreshNotes = () => {
    setNotes(db.getAuthorizedLessonNotes(currentUser.id));
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedClassFilter !== 'all' && n.classId !== selectedClassFilter) return false;
    if (selectedSubjectFilter !== 'all' && n.subjectId !== selectedSubjectFilter) return false;
    if (selectedTermFilter !== 'all' && n.term !== selectedTermFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.topic.toLowerCase().includes(q) ||
        (n.subTopic && n.subTopic.toLowerCase().includes(q)) ||
        n.subjectName.toLowerCase().includes(q) ||
        n.className.toLowerCase().includes(q) ||
        n.lessonContent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingNoteId(null);
    setFormData({
      classId: selectedClassFilter !== 'all' ? selectedClassFilter : (assignedClasses[0]?.id || 'cls_basic3a_bgl'),
      subjectId: selectedSubjectFilter !== 'all' ? selectedSubjectFilter : (teacherSubjects[0]?.id || 'sub_math_pri'),
      topic: '',
      subTopic: '',
      date: new Date().toISOString().split('T')[0],
      term: 'Term 1',
      weekNumber: 3,
      duration: '40 mins',
      learningObjectivesText: '1. \n2. \n3. ',
      previousKnowledge: 'Pupils are familiar with...',
      instructionalMaterialsText: 'Textbook, whiteboard markers, charts...',
      introduction: 'Introduce the lesson by asking diagnostic questions and presenting real-world examples.',
      lessonContent: `### Step 1: Definition & Background\n\n### Step 2: Key Concepts & Rules\n\n### Step 3: Worked Examples on the Board\n`,
      teacherActivities: '1. Guides pupils through explanations.\n2. Writes key points on the board.\n3. Supervises independent practice.',
      studentActivities: '1. Listen attentively and ask questions.\n2. Copy notes and participate in exercises.',
      evaluation: '1. \n2. \n3. ',
      assignment: 'Complete exercise questions in textbook.',
      conclusion: 'Review key points and assign homework.',
      teacherRemarks: 'Pupils actively participated in the lesson.',
      status: 'PUBLISHED',
      attachments: [],
    });
    setShowEditorModal(true);
  };

  const handleOpenEditModal = (note: LessonNote) => {
    setEditingNoteId(note.id);
    setFormData({
      classId: note.classId,
      subjectId: note.subjectId,
      topic: note.topic,
      subTopic: note.subTopic || '',
      date: note.date,
      term: note.term || 'Term 1',
      weekNumber: note.weekNumber,
      duration: note.duration || '40 mins',
      learningObjectivesText: Array.isArray(note.learningObjectives)
        ? note.learningObjectives.join('\n')
        : String(note.learningObjectives || ''),
      previousKnowledge: note.previousKnowledge || '',
      instructionalMaterialsText: Array.isArray(note.instructionalMaterials)
        ? note.instructionalMaterials.join('\n')
        : String(note.instructionalMaterials || ''),
      introduction: note.introduction || '',
      lessonContent: note.lessonContent || '',
      teacherActivities: note.teacherActivities || '',
      studentActivities: note.studentActivities || '',
      evaluation: note.evaluation || '',
      assignment: note.assignment || '',
      conclusion: note.conclusion || '',
      teacherRemarks: note.teacherRemarks || '',
      status: note.status,
      attachments: note.attachments || [],
    });
    setShowEditorModal(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) return;

    const targetClass = assignedClasses.find(c => c.id === formData.classId) || assignedClasses[0];
    const targetSubject = teacherSubjects.find(s => s.id === formData.subjectId) || teacherSubjects[0];

    const learningObjectives = formData.learningObjectivesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const instructionalMaterials = formData.instructionalMaterialsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (editingNoteId) {
      db.updateLessonNote(
        editingNoteId,
        {
          classId: targetClass.id,
          className: targetClass.name,
          branchId: targetClass.branchId,
          branchName: targetClass.branchName,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          topic: formData.topic.trim(),
          subTopic: formData.subTopic.trim(),
          date: formData.date,
          term: formData.term,
          weekNumber: Number(formData.weekNumber),
          duration: formData.duration,
          learningObjectives,
          previousKnowledge: formData.previousKnowledge,
          instructionalMaterials,
          introduction: formData.introduction,
          lessonContent: formData.lessonContent,
          teacherActivities: formData.teacherActivities,
          studentActivities: formData.studentActivities,
          evaluation: formData.evaluation,
          assignment: formData.assignment,
          conclusion: formData.conclusion,
          teacherRemarks: formData.teacherRemarks,
          status: formData.status,
          attachments: formData.attachments,
        },
        currentUser
      );
    } else {
      db.createLessonNote(
        {
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          classId: targetClass.id,
          className: targetClass.name,
          branchId: targetClass.branchId,
          branchName: targetClass.branchName,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          topic: formData.topic.trim(),
          subTopic: formData.subTopic.trim(),
          date: formData.date,
          term: formData.term,
          weekNumber: Number(formData.weekNumber),
          duration: formData.duration,
          learningObjectives,
          previousKnowledge: formData.previousKnowledge,
          instructionalMaterials,
          introduction: formData.introduction,
          lessonContent: formData.lessonContent,
          teacherActivities: formData.teacherActivities,
          studentActivities: formData.studentActivities,
          evaluation: formData.evaluation,
          assignment: formData.assignment,
          conclusion: formData.conclusion,
          teacherRemarks: formData.teacherRemarks,
          status: formData.status,
          attachments: formData.attachments,
        },
        currentUser
      );
    }

    refreshNotes();
    setShowEditorModal(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this lesson note?')) {
      db.deleteLessonNote(id, currentUser);
      refreshNotes();
      if (viewingNote?.id === id) setViewingNote(null);
    }
  };

  const handleDuplicateNote = (id: string) => {
    db.duplicateLessonNote(id, currentUser);
    refreshNotes();
  };

  const handleAddAttachment = () => {
    if (!attachmentName.trim()) return;

    const newAtt: LessonNoteAttachment = {
      id: `att_${Date.now()}`,
      name: attachmentName.trim(),
      type: attachmentType,
      url: attachmentUrl.trim() || (attachmentType === 'image'
        ? 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80'),
      size: '1.2 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      category: attachmentCategory,
    };

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAtt],
    }));

    setAttachmentName('');
    setAttachmentUrl('');
  };

  const handleRemoveAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id),
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="lesson-notes-manager">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Curriculum & Pedagogy
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {notes.length} Total Registered Notes
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span>Lesson Notes Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Prepare, store, and manage comprehensive pedagogical lesson notes with instructional objectives, step-by-step whiteboard layouts, and multimedia teaching aids.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-add-lesson-note"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD NEW LESSON NOTE</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topic, sub-topic, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Assigned Classes</option>
              {assignedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term Filter */}
          <div>
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Terms</option>
              <option value="Term 1">First Term (Term 1)</option>
              <option value="Term 2">Second Term (Term 2)</option>
              <option value="Term 3">Third Term (Term 3)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson Notes Cards Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No Lesson Notes Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedClassFilter !== 'all' || selectedSubjectFilter !== 'all'
              ? 'Try clearing your filters or search terms to view other lesson notes.'
              : 'You have not created any lesson notes yet. Click below to begin drafting your first note.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lesson Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {note.subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {note.className}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Wk {note.weekNumber}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      note.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {note.status}
                  </span>
                </div>

                {/* Main Topic */}
                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {note.topic}
                </h3>
                {note.subTopic && (
                  <p className="text-xs font-medium text-indigo-600 mt-1 line-clamp-1">
                    Sub-Topic: {note.subTopic}
                  </p>
                )}

                {/* Objectives Preview */}
                {note.learningObjectives && note.learningObjectives.length > 0 && (
                  <div className="mt-3 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-1 text-[11px]">
                      Objectives:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 line-clamp-2">
                      {note.learningObjectives.slice(0, 2).map((obj, i) => (
                        <li key={i} className="line-clamp-1">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Attachments pill */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''} ({note.attachments.map(a => a.category).filter(Boolean).slice(0, 2).join(', ')})
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-400 text-[11px]">
                  <span>{note.date}</span> • <span>{note.duration || '40 mins'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingNote(note)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center gap-1 text-xs"
                    title="Read / Preview Note"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Read</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(note)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Note"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateNote(note.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicate Note"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL PREVIEW / READING MODAL */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lesson Note Record</h3>
                  <p className="text-xs text-slate-500">
                    {viewingNote.className} • {viewingNote.subjectName} • Week {viewingNote.weekNumber} ({viewingNote.term})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Note</span>
                </button>
                <button
                  onClick={() => {
                    const noteToEdit = viewingNote;
                    setViewingNote(null);
                    handleOpenEditModal(noteToEdit);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setViewingNote(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Printable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 printable-lesson-note">
              {/* Note Header Grid */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Class / Level</span>
                  <strong className="text-slate-900 text-sm">{viewingNote.className}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Subject</span>
                  <strong className="text-slate-900 text-sm">{viewingNote.subjectName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Date / Duration</span>
                  <span className="font-semibold text-slate-900">{viewingNote.date} ({viewingNote.duration || '40 mins'})</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Week / Term</span>
                  <span className="font-semibold text-slate-900">Week {viewingNote.weekNumber} • {viewingNote.term}</span>
                </div>
              </div>

              {/* Topic & Sub Topic */}
              <div className="space-y-1 pb-4 border-b border-slate-200">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{viewingNote.topic}</h2>
                {viewingNote.subTopic && (
                  <p className="text-sm font-semibold text-indigo-700">Sub-Topic: {viewingNote.subTopic}</p>
                )}
                <div className="text-xs text-slate-500 pt-1">
                  Prepared by: <strong className="text-slate-700">{viewingNote.teacherName}</strong> ({viewingNote.branchName || 'Zitel Castle School'})
                </div>
              </div>

              {/* Learning Objectives */}
              {viewingNote.learningObjectives && viewingNote.learningObjectives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md inline-block">
                    I. Performance / Learning Objectives
                  </h4>
                  <p className="text-xs text-slate-600 italic">
                    By the end of the lesson, pupils should be able to:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm pl-2 text-slate-700 leading-relaxed font-medium">
                    {viewingNote.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Previous Knowledge & Instructional Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingNote.previousKnowledge && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      II. Previous Knowledge / Entry Behavior
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {viewingNote.previousKnowledge}
                    </p>
                  </div>
                )}

                {viewingNote.instructionalMaterials && viewingNote.instructionalMaterials.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      III. Instructional Materials / Teaching Aids
                    </h5>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1">
                      {viewingNote.instructionalMaterials.map((mat, i) => (
                        <li key={i}>{mat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Introduction / Hook */}
              {viewingNote.introduction && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md inline-block">
                    IV. Introduction / Set Induction
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    {viewingNote.introduction}
                  </p>
                </div>
              )}

              {/* Structured Lesson Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md inline-block">
                  V. Step-by-Step Lesson Presentation & Board Work
                </h4>
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line font-mono sm:font-sans">
                  {viewingNote.lessonContent}
                </div>
              </div>

              {/* Teacher and Student Activities */}
              {(viewingNote.teacherActivities || viewingNote.studentActivities) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingNote.teacherActivities && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Teacher's Activities
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {viewingNote.teacherActivities}
                      </p>
                    </div>
                  )}

                  {viewingNote.studentActivities && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Pupils' Activities
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {viewingNote.studentActivities}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation & Homework */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingNote.evaluation && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/30">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                      VI. Evaluation / Assessment Questions
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {viewingNote.evaluation}
                    </p>
                  </div>
                )}

                {viewingNote.assignment && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-blue-50/30">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5">
                      VII. Homework / Assignment
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {viewingNote.assignment}
                    </p>
                  </div>
                )}
              </div>

              {/* Conclusion & Teacher's Remarks */}
              {(viewingNote.conclusion || viewingNote.teacherRemarks) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {viewingNote.conclusion && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Conclusion
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {viewingNote.conclusion}
                      </p>
                    </div>
                  )}
                  {viewingNote.teacherRemarks && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Teacher's Evaluation Remarks
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {viewingNote.teacherRemarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Media & Attachments Section */}
              {viewingNote.attachments && viewingNote.attachments.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>Attached Instructional Media & Diagrams ({viewingNote.attachments.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingNote.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <h6 className="text-xs font-semibold text-slate-900 truncate">{att.name}</h6>
                            <span className="text-[11px] text-slate-500 block">
                              {att.category || 'Attachment'} • {att.size || '1.0 MB'}
                            </span>
                          </div>
                        </div>

                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LESSON NOTE MODAL */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingNoteId ? 'Edit Lesson Note' : 'Create New Lesson Note'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-6 overflow-y-auto space-y-5">
              {/* Row 1: Target Class, Subject, Term, Week */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {assignedClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {teacherSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Term 1">First Term (Term 1)</option>
                    <option value="Term 2">Second Term (Term 2)</option>
                    <option value="Term 3">Third Term (Term 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Week Number *</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={formData.weekNumber}
                    onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Topic and Sub-Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fractions and Equivalent Parts"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Simplifying Fractions with Common Denominators"
                    value={formData.subTopic}
                    onChange={(e) => setFormData({ ...formData, subTopic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Date & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 40 mins or 80 mins (Double Period)"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Learning Objectives (Mult-line) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Learning Objectives (Enter one objective per line) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Define fractions\n2. Identify numerator and denominator\n3. Solve 3 practice problems"
                  value={formData.learningObjectivesText}
                  onChange={(e) => setFormData({ ...formData, learningObjectivesText: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Previous Knowledge & Instructional Materials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Previous Knowledge</label>
                  <textarea
                    rows={2}
                    placeholder="What pupils already know before this lesson..."
                    value={formData.previousKnowledge}
                    onChange={(e) => setFormData({ ...formData, previousKnowledge: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructional Materials (One per line)</label>
                  <textarea
                    rows={2}
                    placeholder="Wall chart, real orange, cardboard strips, textbooks..."
                    value={formData.instructionalMaterialsText}
                    onChange={(e) => setFormData({ ...formData, instructionalMaterialsText: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Introduction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Introduction / Set Induction</label>
                <textarea
                  rows={2}
                  placeholder="How teacher will hook pupil interest and introduce key topic..."
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Main Structured Lesson Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Content & Step-by-Step Presentation *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Step 1: Concept definition...\nStep 2: Examples & rules...\nStep 3: Board illustrations..."
                  value={formData.lessonContent}
                  onChange={(e) => setFormData({ ...formData, lessonContent: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-mono text-slate-800"
                />
              </div>

              {/* Teacher & Student Activities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher's Activities</label>
                  <textarea
                    rows={3}
                    placeholder="Guides pupils, models calculation, checks desks..."
                    value={formData.teacherActivities}
                    onChange={(e) => setFormData({ ...formData, teacherActivities: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pupils' Activities</label>
                  <textarea
                    rows={3}
                    placeholder="Recite, fold strips, solve board problems in pairs..."
                    value={formData.studentActivities}
                    onChange={(e) => setFormData({ ...formData, studentActivities: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Evaluation & Homework */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Questions</label>
                  <textarea
                    rows={3}
                    placeholder="Oral or written checkpoint questions..."
                    value={formData.evaluation}
                    onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Homework / Assignment</label>
                  <textarea
                    rows={3}
                    placeholder="Textbook exercises, research, or take-home drill..."
                    value={formData.assignment}
                    onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Conclusion & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conclusion</label>
                  <input
                    type="text"
                    placeholder="Summary of key points and class dismissal..."
                    value={formData.conclusion}
                    onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Self-evaluation remarks on pupil mastery..."
                    value={formData.teacherRemarks}
                    onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* ATTACHMENTS & MEDIA SECTION */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      File & Image Attachments (Worksheets, Board Photos, PDFs)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {formData.attachments.length} attached
                  </span>
                </div>

                {/* Upload sub-form */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Attachment Title (e.g. Fraction Chart.pdf)"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <select
                    value={attachmentCategory}
                    onChange={(e) => setAttachmentCategory(e.target.value as any)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Worksheet">Worksheet</option>
                    <option value="Board Work">Board Work Photo</option>
                    <option value="Teaching Aid">Teaching Aid</option>
                    <option value="Diagram">Diagram / Poster</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={attachmentType}
                    onChange={(e) => setAttachmentType(e.target.value as any)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="image">Image / Photo (JPEG/PNG)</option>
                    <option value="doc">Word Doc</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach File</span>
                  </button>
                </div>

                {/* Attached list */}
                {formData.attachments.length > 0 && (
                  <div className="divide-y divide-slate-200 pt-2">
                    {formData.attachments.map((att) => (
                      <div key={att.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {att.category}
                          </span>
                          <span className="font-semibold text-slate-800">{att.name}</span>
                          <span className="text-[10px] text-slate-400">({att.type.toUpperCase()})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Status</label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noteStatus"
                      checked={formData.status === 'PUBLISHED'}
                      onChange={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">Published (Ready for Class)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="noteStatus"
                      checked={formData.status === 'DRAFT'}
                      onChange={() => setFormData({ ...formData, status: 'DRAFT' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-600">Draft (In Progress)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingNoteId ? 'Update Lesson Note' : 'Save Lesson Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
