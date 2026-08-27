import React, { useState, useEffect } from 'react';
import { User, Student } from './types';
import { db, initDatabase } from './services/db';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ReportCardModal } from './components/common/ReportCardModal';
import { LoginPage } from './components/auth/LoginPage';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';

export function App() {
  // Ensure database is initialized
  const [, setTick] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string>(() => db.getActiveBranchId());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  useEffect(() => {
    initDatabase();
    const user = db.getCurrentUser();
    setCurrentUser(user);
    setActiveBranchId(db.getActiveBranchId());

    // Subscribe to DB state updates
    const unsubscribe = db.subscribe(() => {
      setTick(t => t + 1);
      const u = db.getCurrentUser();
      setCurrentUser(u);
      setActiveBranchId(db.getActiveBranchId());
    });

    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSwitchUser = (userId: string) => {
    db.setCurrentUser(userId);
    const u = db.getCurrentUser();
    setCurrentUser(u);
    setActiveTab('overview');
  };

  const handleBranchChange = (branchId: string) => {
    db.setActiveBranchId(branchId);
    setActiveBranchId(branchId);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('overview');
  };

  // If no authenticated user, display clean Login view
  if (!currentUser || !currentUser.id) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        activeBranchId={activeBranchId}
        onBranchChange={handleBranchChange}
        onSearchOpen={() => setIsSearchOpen(true)}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {currentUser.role === 'SUPER_ADMIN' && (
            <SuperAdminDashboard
              currentUser={currentUser}
              activeTab={activeTab}
            />
          )}

          {currentUser.role === 'ADMIN' && (
            <AdminDashboard
              currentUser={currentUser}
              activeTab={activeTab}
            />
          )}

          {currentUser.role === 'TEACHER' && (
            <TeacherDashboard
              currentUser={currentUser}
              activeTab={activeTab}
            />
          )}

          {currentUser.role === 'PARENT' && (
            <ParentDashboard
              currentUser={currentUser}
              activeTab={activeTab}
            />
          )}

          {currentUser.role === 'STUDENT' && (
            <StudentDashboard
              currentUser={currentUser}
              activeTab={activeTab}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      {isSearchOpen && (
        <GlobalSearchModal
          currentUser={currentUser}
          onClose={() => setIsSearchOpen(false)}
          onSelectStudent={st => {
            setSelectedStudentForReport(st);
            setIsSearchOpen(false);
          }}
        />
      )}

      {/* Global Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}
    </div>
  );
}

export default App;
