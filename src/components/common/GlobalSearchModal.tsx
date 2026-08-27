import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { User, Student, ClassRoom, Subject } from '../../types';
import { db } from '../../services/db';

interface GlobalSearchModalProps {
  currentUser: User;
  onClose: () => void;
  onSelectStudent?: (student: Student) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  currentUser,
  onClose,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Role-filtered data access
  const allStudents = db.getStudents();
  const allClasses = db.getClasses();
  const allSubjects = db.getSubjects();

  let visibleStudents: Student[] = [];
  let visibleClasses: ClassRoom[] = [];
  let visibleSubjects: Subject[] = [];

  if (currentUser.role === 'SUPER_ADMIN' || (currentUser.role === 'ADMIN' && currentUser.scope !== 'FINANCE_ONLY')) {
    visibleStudents = allStudents;
    visibleClasses = allClasses;
    visibleSubjects = allSubjects;
  } else if (currentUser.role === 'TEACHER') {
    const teacherClasses = db.getTeacherAssignedClasses(currentUser.id);
    const teacherClassIds = new Set(teacherClasses.map(c => c.id));
    visibleStudents = allStudents.filter(s => teacherClassIds.has(s.classId));
    visibleClasses = teacherClasses;
    visibleSubjects = allSubjects.filter(sub => 
      teacherClasses.some(c => db.isTeacherAuthorizedForSubject(currentUser.id, c.id, sub.id))
    );
  } else if (currentUser.role === 'PARENT') {
    visibleStudents = allStudents.filter(s =>
      currentUser.linkedStudentIds?.includes(s.id)
    );
    visibleClasses = allClasses.filter(c => visibleStudents.some(s => s.classId === c.id));
    visibleSubjects = allSubjects;
  } else if (currentUser.role === 'STUDENT') {
    visibleStudents = allStudents.filter(s => s.id === currentUser.studentProfileId);
    visibleClasses = allClasses.filter(c => visibleStudents.some(s => s.classId === c.id));
    visibleSubjects = allSubjects;
  }

  const q = query.trim().toLowerCase();

  const filteredStudents = q
    ? visibleStudents.filter(
        s =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q)
      )
    : [];

  const filteredClasses = q
    ? visibleClasses.filter(c => c.name.toLowerCase().includes(q) || c.roomNumber.toLowerCase().includes(q))
    : [];

  const filteredSubjects = q
    ? visibleSubjects.filter(sub => sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q))
    : [];

  const hasResults = filteredStudents.length > 0 || filteredClasses.length > 0 || filteredSubjects.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search students by name or ID, classes, subjects... (e.g. Leo, STU-2026, Primary 3A)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-800 focus:outline-hidden placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="p-6 text-center text-slate-400 text-xs">
              Type keywords above to search authorized school records.
            </div>
          )}

          {q && !hasResults && (
            <div className="p-6 text-center text-slate-400 text-xs">
              No authorized records found matching "<span className="font-semibold text-slate-600">{query}</span>".
            </div>
          )}

          {/* Student Results */}
          {filteredStudents.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Students ({filteredStudents.length})
              </span>
              <div className="space-y-1.5">
                {filteredStudents.map(st => (
                  <div
                    key={st.id}
                    onClick={() => {
                      if (onSelectStudent) onSelectStudent(st);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/80 cursor-pointer flex items-center justify-between border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={st.avatar}
                        alt={st.fullName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{st.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {st.studentId} • <span className="font-sans font-medium text-indigo-600">{st.className}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-100 flex items-center space-x-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes Results */}
          {filteredClasses.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Classes ({filteredClasses.length})
              </span>
              <div className="space-y-1.5">
                {filteredClasses.map(cl => (
                  <div
                    key={cl.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cl.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Teacher: {cl.formTeacherName} • {cl.roomNumber} ({cl.enrolledCount} enrolled)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Results */}
          {filteredSubjects.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Subjects ({filteredSubjects.length})
              </span>
              <div className="space-y-1.5">
                {filteredSubjects.map(sub => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {sub.code} • Category: {sub.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-between px-4">
          <span>Search results filtered strictly by user role and permissions</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
