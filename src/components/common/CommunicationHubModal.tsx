import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  X,
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  Shield,
  Clock,
  User as UserIcon,
  Download,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User, Message, MessageAttachment, Student } from '../../types';
import { db } from '../../services/db';
import { ReportDetailViewerModal } from './ReportDetailViewerModal';

interface CommunicationHubModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  initialRecipientId?: string;
  initialStudentContext?: Student;
}

export const CommunicationHubModal: React.FC<CommunicationHubModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  initialRecipientId,
  initialStudentContext,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => db.getMessages());
  const [contacts, setContacts] = useState(() => db.getAccessibleChatContacts(currentUser));

  // Navigation state: null = People / Conversation List, string = Full Chat View
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialRecipientId || null
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'TEACHER' | 'PARENT' | 'ADMIN'>('ALL');
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [selectedStudentContext, setSelectedStudentContext] = useState<string>(
    initialStudentContext?.id || ''
  );

  // Active report viewing state
  const [activeViewReport, setActiveViewReport] = useState<{
    reportId: string;
    reportType?: string;
    studentId?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync contacts and selected contact if initialRecipientId changes
  useEffect(() => {
    setContacts(db.getAccessibleChatContacts(currentUser));
    if (initialRecipientId) {
      setSelectedContactId(initialRecipientId);
    }
  }, [initialRecipientId, currentUser]);

  // Refresh messages handler
  const refreshMessages = () => {
    setMessages(db.getMessages());
  };

  // Real-time synchronization listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleChatUpdate = () => {
      refreshMessages();
      setContacts(db.getAccessibleChatContacts(currentUser));
    };

    window.addEventListener('zitel_chat_updated', handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);

    // Light polling fallback every 3s to guarantee real-time updates
    const interval = setInterval(() => {
      setMessages(db.getMessages());
    }, 3000);

    return () => {
      window.removeEventListener('zitel_chat_updated', handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
      clearInterval(interval);
    };
  }, [isOpen, currentUser]);

  // Active contact object when in full chat view
  const activeContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts.find(c => c.id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  // Current active conversation thread
  const currentThread = useMemo(() => {
    if (!activeContact) return [];
    return messages
      .filter(
        m =>
          (m.senderId === currentUser.id && m.recipientId === activeContact.id) ||
          (m.senderId === activeContact.id && m.recipientId === currentUser.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser.id, activeContact]);

  // Mark unread messages in current thread as read when active
  useEffect(() => {
    if (activeContact && isOpen) {
      let markedAny = false;
      currentThread.forEach(m => {
        if (m.recipientId === currentUser.id && !m.read) {
          db.markMessageAsRead(m.id);
          markedAny = true;
        }
      });
      if (markedAny) {
        setMessages(db.getMessages());
      }
    }
  }, [currentThread, activeContact, currentUser.id, isOpen]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (selectedContactId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentThread, selectedContactId]);

  // Handle mock file upload
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type.includes('pdf');
      const newAtt: MessageAttachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachments(prev => [...prev, newAtt]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && attachments.length === 0) || !activeContact) return;

    // Determine relevant student context
    const students = db.getStudents();
    const studentObj = selectedStudentContext ? students.find(s => s.id === selectedStudentContext) : undefined;

    db.sendMessage(
      {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId: activeContact.id,
        recipientName: activeContact.name,
        recipientRole: activeContact.role,
        studentId: studentObj?.id,
        studentName: studentObj?.fullName,
        subject: studentObj ? `Update: ${studentObj.fullName}` : 'Direct Discussion',
        content: messageText.trim(),
        body: messageText.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      currentUser
    );

    setMessageText('');
    setAttachments([]);
    refreshMessages();
  };

  // Helper to format timestamps nicely
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatDateHeader = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) return 'Today';
      if (isYesterday) return 'Yesterday';
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Get last message in thread between currentUser and a contact
  const getLastMessageInfo = (contactId: string) => {
    const thread = messages
      .filter(
        m =>
          (m.senderId === currentUser.id && m.recipientId === contactId) ||
          (m.senderId === contactId && m.recipientId === currentUser.id)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const lastMsg = thread[0];
    const unreadCount = messages.filter(
      m => m.senderId === contactId && m.recipientId === currentUser.id && !m.read
    ).length;

    return {
      lastMsg,
      unreadCount,
    };
  };

  // Contacts filtered by search and role tabs
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Role filter
      if (filterRole === 'TEACHER' && c.role !== 'TEACHER') return false;
      if (filterRole === 'PARENT' && c.role !== 'PARENT') return false;
      if (filterRole === 'ADMIN' && c.role !== 'ADMIN' && c.role !== 'SUPER_ADMIN') return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.roleLabel.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    });
  }, [contacts, filterRole, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] max-h-[750px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          
          {/* ========================================================= */}
          {/* HEADER: Dynamic based on whether in List or Full Chat     */}
          {/* ========================================================= */}
          {!selectedContactId ? (
            /* Contact List Header */
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                    <span>ZITEL CHAT ROOM</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Secure & Role-Governed
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official authorized school communication, real-time messaging, and verified academic report delivery.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Close ZITEL CHAT ROOM"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Full Chat View Header with clean small Back Arrow ← */
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                {/* Back Arrow button */}
                <button
                  type="button"
                  onClick={() => setSelectedContactId(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold shrink-0"
                  title="Back to Conversations List"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                {/* Contact Avatar & Meta */}
                {activeContact && (
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      {activeContact.avatar ? (
                        <img
                          src={activeContact.avatar}
                          alt={activeContact.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-xs border border-slate-700">
                          {activeContact.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate leading-tight">
                        {activeContact.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-indigo-400 font-semibold">{activeContact.roleLabel}</span>
                        {activeContact.subtitle && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{activeContact.subtitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Monitored Badge & Close Button */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700 font-medium">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span>Monitored School Thread</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Close ZITEL CHAT ROOM"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BODY: View 1 (Contact List) OR View 2 (Full Chat)         */}
          {/* ========================================================= */}
          {!selectedContactId ? (
            /* VIEW 1: CONTACT / CONVERSATION LIST (Full Modal Content Area) */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              {/* Search & Filter Toolbar */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search people and conversations by name, role, or student..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterRole('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                      filterRole === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Contacts ({contacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRole('TEACHER')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                      filterRole === 'TEACHER'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Teachers
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRole('PARENT')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                      filterRole === 'PARENT'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Parents
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRole('ADMIN')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                      filterRole === 'ADMIN'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Administration
                  </button>
                </div>
              </div>

              {/* People / Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">No authorized contacts found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {searchQuery
                        ? 'No authorized contacts match your current search query.'
                        : 'No active contacts are configured for your institutional profile.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredContacts.map(contact => {
                      const { lastMsg, unreadCount } = getLastMessageInfo(contact.id);
                      const isUnread = unreadCount > 0;

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className={`w-full p-3 sm:p-4 rounded-2xl text-left transition-all flex items-start gap-3 sm:gap-4 cursor-pointer group ${
                            isUnread
                              ? 'bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border border-slate-100/80 hover:border-slate-200 shadow-xs'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {contact.avatar ? (
                              <img
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                                {contact.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                          </div>

                          {/* Contact Info & Last Message */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className={`text-sm truncate ${isUnread ? 'font-black text-indigo-950' : 'font-bold text-slate-900 group-hover:text-indigo-600'}`}>
                                  {contact.name}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                  {contact.roleLabel}
                                </span>
                              </div>

                              {lastMsg && (
                                <span className={`text-[11px] shrink-0 font-medium ${isUnread ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                  {formatTime(lastMsg.timestamp)}
                                </span>
                              )}
                            </div>

                            {/* Subtitle / context */}
                            {contact.subtitle && (
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {contact.subtitle}
                              </p>
                            )}

                            {/* Last message preview row */}
                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                {lastMsg ? (
                                  lastMsg.reportMetadata ? (
                                    <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      <span>[{lastMsg.reportMetadata.reportTitle}]</span>
                                      <span className="text-slate-500 font-normal truncate">• {lastMsg.content}</span>
                                    </span>
                                  ) : (
                                    lastMsg.content || lastMsg.body || 'File attachment'
                                  )
                                ) : (
                                  <span className="italic text-slate-400">No messages yet. Click to start a conversation.</span>
                                )}
                              </p>

                              {/* Unread message count badge (e.g. 🔵 2) */}
                              {isUnread && (
                                <span className="shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white font-black text-[11px] shadow-xs">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: FULL CHAT VIEW (Occupies the ENTIRE content area of the modal) */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40">
              {/* Optional Student Context Tag Bar */}
              {initialStudentContext && (
                <div className="px-6 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Student Context:</span>
                    <span>{initialStudentContext.fullName} ({initialStudentContext.className})</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Homeroom Monitored
                  </span>
                </div>
              )}

              {/* Chat Message Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {currentThread.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Beginning of conversation with {activeContact?.name}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      This thread is encrypted and logged in compliance with Zitel Castle School communication policies.
                    </p>
                  </div>
                ) : (
                  currentThread.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const prevMsg = currentThread[idx - 1];
                    const showDateHeader =
                      !prevMsg ||
                      new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-bold tracking-wide uppercase shadow-2xs">
                              {formatDateHeader(msg.timestamp)}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-xs transition-all ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            {/* Sender Info for incoming messages */}
                            {!isMe && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-black text-indigo-700">{msg.senderName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {msg.senderRole}
                                </span>
                              </div>
                            )}

                            {/* Student Context Pill inside message */}
                            {msg.studentName && (
                              <div
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md mb-2 ${
                                  isMe ? 'bg-indigo-700/60 text-indigo-100' : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                <span>Child: {msg.studentName}</span>
                              </div>
                            )}

                            {/* Message Body Text */}
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {msg.content || msg.body}
                            </p>

                            {/* ======================================================== */}
                            {/* AUTOMATIC REPORT-TO-CHAT CARD (Requirements 14-19)       */}
                            {/* ======================================================== */}
                            {msg.reportMetadata && (
                              <div
                                className={`mt-3 p-3.5 rounded-xl border transition-all ${
                                  isMe
                                    ? 'bg-indigo-700/50 border-indigo-500/40 text-white'
                                    : 'bg-indigo-50/70 border-indigo-200/80 text-slate-900'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                        isMe ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span
                                        className={`text-[10px] font-black uppercase tracking-wider block ${
                                          isMe ? 'text-indigo-200' : 'text-indigo-700'
                                        }`}
                                      >
                                        {msg.reportMetadata.reportType === 'WEEKLY_STATUS'
                                          ? 'Weekly Status Report'
                                          : 'Academic Status Report'}
                                      </span>
                                      <h5
                                        className={`text-xs font-bold leading-tight ${
                                          isMe ? 'text-white' : 'text-slate-900'
                                        }`}
                                      >
                                        {msg.reportMetadata.reportTitle}
                                      </h5>
                                    </div>
                                  </div>
                                </div>

                                {msg.reportMetadata.summary && (
                                  <p
                                    className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${
                                      isMe ? 'text-indigo-100' : 'text-slate-600'
                                    }`}
                                  >
                                    {msg.reportMetadata.summary}
                                  </p>
                                )}

                                {/* Distinct "View Report" action button */}
                                <div className="mt-3 pt-2.5 border-t border-indigo-200/30 flex items-center justify-between">
                                  <span
                                    className={`text-[10px] ${
                                      isMe ? 'text-indigo-200' : 'text-slate-500'
                                    }`}
                                  >
                                    Term: {msg.reportMetadata.term || 'First Term'}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveViewReport({
                                        reportId: msg.reportMetadata!.reportId,
                                        reportType: msg.reportMetadata!.reportType,
                                        studentId: msg.reportMetadata!.studentId,
                                      })
                                    }
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                                      isMe
                                        ? 'bg-white text-indigo-700 hover:bg-slate-100'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View Report</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Attachments Tray */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 space-y-1.5">
                                {msg.attachments.map(att => (
                                  <div
                                    key={att.id}
                                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                      isMe ? 'bg-indigo-700/50 text-white' : 'bg-slate-50 text-slate-800 border border-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate font-medium">{att.name}</span>
                                      {att.size && <span className="text-[10px] opacity-75">({att.size})</span>}
                                    </div>
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      className="p-1 hover:opacity-80 transition-opacity ml-2 shrink-0"
                                      title="Download attachment"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Message Timestamp & Read Status */}
                            <div
                              className={`flex items-center justify-end space-x-1 mt-1.5 text-[10px] ${
                                isMe ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              <span>{formatTime(msg.timestamp)}</span>
                              {isMe && (
                                <span>
                                  {msg.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-white" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-indigo-200" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer (Bottom Area) */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
                {/* Uploaded attachments preview chip */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                    title="Attach File or Document"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder={`Type a message to ${activeContact?.name || 'recipient'}...`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() && attachments.length === 0}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Viewer Modal (opened when user clicks "View Report" in chat) */}
      {activeViewReport && (
        <ReportDetailViewerModal
          reportId={activeViewReport.reportId}
          reportType={activeViewReport.reportType}
          studentId={activeViewReport.studentId}
          currentUser={currentUser}
          onClose={() => setActiveViewReport(null)}
        />
      )}
    </>
  );
};

// Export alias for semantic clarity
export const ZitelChatRoomModal = CommunicationHubModal;
