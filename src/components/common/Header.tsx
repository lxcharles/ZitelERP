import React, { useState } from 'react';
import {
  Bell,
  Search,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  School,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Plus
} from 'lucide-react';
import { User, NotificationItem, Branch } from '../../types';
import { db } from '../../services/db';

interface HeaderProps {
  currentUser: User;
  onSearchOpen: () => void;
  onSwitchUser: (userId: string) => void;
  onNavigateToNotifications?: () => void;
  activeBranchId?: string;
  onBranchChange?: (branchId: string) => void;
  onOpenNewBranchModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSearchOpen,
  onSwitchUser,
  activeBranchId,
  onBranchChange,
  onOpenNewBranchModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const school = db.getSchoolProfile();
  const allUsers = db.getUsers();
  const branches = db.getBranches();
  
  const currentBranchId = activeBranchId || db.getActiveBranchId();
  const activeBranch = branches.find(b => b.id === currentBranchId);

  const notifications = db.getNotifications().filter(
    n => n.userId === currentUser.id || currentUser.role === 'SUPER_ADMIN'
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    TEACHER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PARENT: 'bg-amber-100 text-amber-800 border-amber-200',
    STUDENT: 'bg-sky-100 text-sky-800 border-sky-200',
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    TEACHER: 'Faculty / Teacher',
    PARENT: 'Parent / Guardian',
    STUDENT: 'Student',
  };

  const handleSelectBranch = (branchId: string) => {
    db.setActiveBranchId(branchId);
    if (onBranchChange) {
      onBranchChange(branchId);
    }
    setShowBranchMenu(false);
  };

  const isBranchAuthorized = 
    currentUser.role === 'SUPER_ADMIN' || 
    currentUser.role === 'ADMIN' || 
    currentUser.role === 'TEACHER' ||
    Boolean(currentUser.permissions?.includes('manage_branches')) ||
    currentUser.scope === 'ALL_SCHOOL';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: School Logo ONLY */}
          <div className="flex items-center">
            <img
              src="https://res.cloudinary.com/dehvk3bre/image/upload/v1782745354/20260304_140255_weozqy.png"
              alt="Zitel Castle School"
              className="h-10 sm:h-12 w-auto max-h-12 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center & Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Branch Selector Dropdown (Super Admins & Authorized Staff) */}
            {isBranchAuthorized ? (
              <div className="relative">
                <button
                  id="header-branch-switcher-btn"
                  onClick={() => {
                    setShowBranchMenu(!showBranchMenu);
                    setShowDemoSwitcher(false);
                    setShowNotifications(false);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold shadow-xs transition-all border border-slate-700"
                  title="Switch Active Campus / Branch"
                >
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="max-w-[130px] sm:max-w-[210px] truncate">
                    {currentBranchId === 'all'
                      ? 'All Branches (Consolidated)'
                      : activeBranch?.name || 'Select Branch'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${showBranchMenu ? 'rotate-180' : ''}`} />
                </button>

                {showBranchMenu && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Branch / Campus Selector
                        </p>
                        <p className="text-[11px] text-slate-400">Toggle active school branch</p>
                      </div>
                      {currentUser.role === 'SUPER_ADMIN' && onOpenNewBranchModal && (
                        <button
                          onClick={() => {
                            setShowBranchMenu(false);
                            onOpenNewBranchModal();
                          }}
                          className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Campus</span>
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      {/* Individual School Campuses */}
                      <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 border-y border-slate-100 my-1">
                        Campuses ({branches.length})
                      </div>

                      {branches.map(branch => (
                        <button
                          key={branch.id}
                          id={`branch-select-${branch.id}`}
                          onClick={() => handleSelectBranch(branch.id)}
                          className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${
                            currentBranchId === branch.id
                              ? 'bg-indigo-50/90 font-bold text-indigo-900 border-l-4 border-indigo-600'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {branch.code.split('-')[1] || 'BR'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold truncate text-slate-900">{branch.name}</p>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase bg-emerald-100 text-emerald-800 shrink-0 ml-1">
                                {branch.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{branch.address}</span>
                            </p>
                          </div>
                          {currentBranchId === branch.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                          )}
                        </button>
                      ))}

                      {/* All Branches Option (for Super Admin or authorized multi-branch staff) */}
                      {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                        <>
                          <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 border-y border-slate-100 my-1">
                            Consolidated View
                          </div>
                          <button
                            id="branch-select-all"
                            onClick={() => handleSelectBranch('all')}
                            className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${
                              currentBranchId === 'all'
                                ? 'bg-indigo-50/90 font-bold text-indigo-900 border-l-4 border-indigo-600'
                                : 'text-slate-700'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              HQ
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">All Branches (Consolidated Analytics)</p>
                              <p className="text-[11px] text-slate-500 truncate">Combined data across Bungalow & Ijegun</p>
                            </div>
                            {currentBranchId === 'all' && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : currentUser.branchName ? (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate max-w-[160px]">{currentUser.branchName}</span>
              </div>
            ) : null}

            {/* Quick Global Search */}
            <button
              id="header-search-btn"
              onClick={onSearchOpen}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition-colors border border-slate-200/80"
              title="Search system (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {/* Quick Demo Switcher Button */}
            <div className="relative">
              <button
                id="header-demo-switcher-btn"
                onClick={() => {
                  setShowDemoSwitcher(!showDemoSwitcher);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                  setShowBranchMenu(false);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-xs font-semibold shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="hidden sm:inline">Role Switcher</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Demo Switcher Dropdown */}
              {showDemoSwitcher && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Switch Role Context (Test Workflows)
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
                    {allUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setShowDemoSwitcher(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${
                          u.id === currentUser.id ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {u.name}
                            </p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${roleColors[u.role]}`}>
                              {roleLabels[u.role]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {u.customRoleTitle || u.email}
                          </p>
                          {u.branchName && (
                            <p className="text-[10px] text-indigo-600 font-medium truncate">
                              📍 {u.branchName}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowDemoSwitcher(false);
                  setShowUserMenu(false);
                  setShowBranchMenu(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
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

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                  setShowDemoSwitcher(false);
                  setShowBranchMenu(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200"
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
                    <div className="px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>Staff/User ID:</span>
                      <span className="font-mono font-medium text-slate-700">{currentUser.staffId || currentUser.id.slice(0, 10)}</span>
                    </div>
                    {currentUser.branchName && (
                      <div className="px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
                        <span>Campus:</span>
                        <span className="font-medium text-indigo-700 truncate max-w-[140px]">{currentUser.branchName}</span>
                      </div>
                    )}
                    <div className="px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>Status:</span>
                      <span className="inline-flex items-center text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        db.resetToSeedData();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Reset Demo Database to Default</span>
                    </button>
                    <button
                      onClick={() => {
                        db.logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
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

