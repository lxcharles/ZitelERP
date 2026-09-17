import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  LogOut,
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { isSuperAdmin, isDirector } from '../../utils/roles';
import { AdvancedAccountInfoSection } from './AdvancedAccountInfoSection';

interface HeaderProps {
  currentUser: User;
  onSearchOpen: () => void;
  onNavigateToNotifications?: () => void;
  onOpenAuditLog?: () => void;
  activeBranchId?: string;
  onBranchChange?: (branchId: string) => void;
  onOpenNewBranchModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSearchOpen,
  onOpenAuditLog,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const notifications = db.getNotifications().filter(
    n => n.userId === currentUser.id || n.userId === 'all' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DIRECTOR'
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    DIRECTOR: 'bg-blue-100 text-blue-800 border-blue-200',
    ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    TEACHER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PARENT: 'bg-amber-100 text-amber-800 border-amber-200',
    STUDENT: 'bg-sky-100 text-sky-800 border-sky-200',
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    DIRECTOR: 'Director',
    ADMIN: 'Branch Administrator',
    TEACHER: 'Teaching Staff / Teacher',
    PARENT: 'Parent / Guardian',
    STUDENT: 'Student',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-xs">
      {/* Click-outside backdrop to close dropdowns and search */}
      {(showNotifications || showUserMenu || isSearchExpanded) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
            setIsSearchExpanded(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* 1. Our Logo */}
          <div className="flex items-center shrink-0">
            <img
              src="https://res.cloudinary.com/dehvk3bre/image/upload/v1782745354/20260304_140255_weozqy.png"
              alt="Zitel Castle School"
              className="h-9 sm:h-11 w-auto max-h-12 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* 2. Revealed Search Column (When Search Icon is Clicked) */}
          {isSearchExpanded && (
            <div
              id="header-search-column"
              className="flex-1 max-w-xl mx-2 sm:mx-6 md:mx-8 relative z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearchOpen();
                }}
                className="flex items-center w-full px-3 sm:px-4 py-2 rounded-xl bg-slate-100/95 border border-purple-300/80 shadow-xs ring-2 ring-purple-500/20"
              >
                <Search className="w-4 h-4 text-purple-600 shrink-0 mr-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchExpanded(false);
                    }
                  }}
                  placeholder="Search students, staff, classes, records..."
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
                <div className="flex items-center space-x-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={onSearchOpen}
                    className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-600 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                    title="Open full global search results (Enter or ⌘K)"
                  >
                    ⌘K
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="Close search bar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Right Action Icons: Search Icon (when collapsed), Notifications, Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Search Icon Trigger (Visible when search column is collapsed) */}
            {!isSearchExpanded && (
              <button
                id="header-search-icon-btn"
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="p-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Search platform (Ctrl+K or ⌘K)"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* 3. Notifications Icon */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                  setIsSearchExpanded(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => db.markNotificationAsRead(n.id)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5">
                              {n.type === 'ACADEMIC' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {n.type === 'ATTENDANCE' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                              {n.type === 'FEE' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                              {n.type === 'SYSTEM' && <Shield className="w-4 h-4 text-purple-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Profile */}
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                  setIsSearchExpanded(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-400/40 shadow-xs"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <span className={`inline-block text-[10px] font-semibold px-1.5 rounded border ${roleColors[currentUser.role]}`}>
                    {roleLabels[currentUser.role]}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleColors[currentUser.role]}`}>
                        {roleLabels[currentUser.role]}
                      </span>
                    </div>
                  </div>
                  <div className="py-1">
                    <div className="px-4 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                      <span>Official School ID:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {currentUser.schoolId || currentUser.staffId || currentUser.username}
                      </span>
                    </div>
                    {currentUser.role === 'SUPER_ADMIN' && (
                      <div className="px-3">
                        <AdvancedAccountInfoSection
                          currentUserRole={currentUser.role}
                          targetUser={{
                            id: currentUser.id,
                            name: currentUser.name,
                            role: currentUser.role,
                            schoolId: currentUser.schoolId || currentUser.staffId || currentUser.username,
                            firebaseUid: currentUser.firebaseUid,
                            email: currentUser.email,
                            username: currentUser.username
                          }}
                        />
                      </div>
                    )}
                    {currentUser.branchName && (
                      <div className="px-4 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                        <span>Branch:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[140px]">{currentUser.branchName}</span>
                      </div>
                    )}
                    <div className="px-4 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                      <span>Status:</span>
                      <span className="inline-flex items-center text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Active
                      </span>
                    </div>

                    {(isSuperAdmin(currentUser) || isDirector(currentUser)) && (
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenAuditLog) onOpenAuditLog();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center justify-between transition-colors"
                          id="btn-header-audit-log"
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Institutional Audit Log</span>
                          </span>
                          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                            Secure
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        db.logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

