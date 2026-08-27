import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Image,
  FileText,
  CheckCheck,
  Check,
  Search,
  User,
  Shield,
  X,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { User as UserType, Message, MessageAttachment, Student } from '../../types';
import { db } from '../../services/db';

interface CommunicationHubModalProps {
  currentUser: UserType;
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
  const contacts = useMemo(() => db.getAccessibleChatContacts(currentUser), [currentUser]);

  const [selectedContactId, setSelectedContactId] = useState<string>(
    initialRecipientId || contacts[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [selectedStudentContext, setSelectedStudentContext] = useState<string>(
    initialStudentContext?.id || ''
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync contacts and selected contact
  useEffect(() => {
    if (initialRecipientId) {
      setSelectedContactId(initialRecipientId);
    } else if (!selectedContactId && contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
    }
  }, [initialRecipientId, contacts]);

  // Refresh messages periodically or upon action
  const refreshMessages = () => {
    setMessages(db.getMessages());
  };

  const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

  // Filter conversation messages between currentUser and activeContact
  const currentThread = useMemo(() => {
    if (!activeContact) return [];
    return messages.filter(
      m =>
        (m.senderId === currentUser.id && m.recipientId === activeContact.id) ||
        (m.senderId === activeContact.id && m.recipientId === currentUser.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser.id, activeContact]);

  // Mark unread messages in current thread as read
  useEffect(() => {
    if (activeContact) {
      currentThread.forEach(m => {
        if (m.recipientId === currentUser.id && !m.read) {
          db.markMessageAsRead(m.id);
        }
      });
    }
  }, [currentThread, activeContact, currentUser.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread]);

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
        subject: subjectText.trim() || (studentObj ? `Update regarding ${studentObj.fullName}` : 'Direct Discussion'),
        content: messageText.trim(),
        body: messageText.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      currentUser
    );

    setMessageText('');
    setSubjectText('');
    setAttachments([]);
    refreshMessages();
  };

  // Filtered contacts list
  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Unread badge per contact
  const getUnreadCount = (contactId: string) => {
    return messages.filter(m => m.senderId === contactId && m.recipientId === currentUser.id && !m.read).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] max-h-[750px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight">
                  Parent ↔ Teacher Direct Communication Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Secure & Role-Governed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authorized direct messaging with secure file attachments and real-time read status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all font-bold"
          >
            ✕
          </button>
        </div>

        {/* Main Body: 2 Columns (Contacts sidebar + Chat viewport) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Contacts Sidebar */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Search contacts */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search authorized contacts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredContacts.map(c => {
                const isSelected = c.id === selectedContactId;
                const unread = getUnreadCount(c.id);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContactId(c.id)}
                    className={`w-full text-left p-3.5 flex items-start space-x-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/60 bg-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 truncate">{c.name}</h4>
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {c.roleLabel}
                        </span>
                      </div>
                      {c.subtitle && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No contacts found matching your query.
                </div>
              )}
            </div>
          </div>

          {/* Chat Viewport */}
          <div className="flex-1 flex flex-col bg-white">
            {activeContact ? (
              <>
                {/* Active Contact Header */}
                <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {activeContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          {activeContact.name}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Online
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {activeContact.subtitle || activeContact.roleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400 text-xs">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline text-[11px] font-bold text-slate-600">School Monitored Thread</span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                  {currentThread.map(msg => {
                    const isMe = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        {/* Student / Subject Context Badge */}
                        {msg.studentName && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-200 mb-0.5">
                            Regarding: {msg.studentName}
                          </span>
                        )}

                        <div
                          className={`max-w-md rounded-2xl p-4 space-y-2 shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {msg.subject && msg.subject !== 'Direct Discussion' && (
                            <div className={`text-xs font-bold pb-1 border-b ${
                              isMe ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-900'
                            }`}>
                              {msg.subject}
                            </div>
                          )}

                          <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content || msg.body}
                          </p>

                          {/* Attachments rendering */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {msg.attachments.map(att => (
                                <div
                                  key={att.id}
                                  className={`p-2 rounded-xl border flex items-center justify-between space-x-2 text-xs ${
                                    isMe
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    {att.type === 'image' ? (
                                      <Image className="w-4 h-4 shrink-0 text-indigo-300" />
                                    ) : (
                                      <FileText className="w-4 h-4 shrink-0 text-amber-300" />
                                    )}
                                    <span className="truncate text-[11px] font-bold">{att.name}</span>
                                  </div>
                                  <span className="text-[9px] opacity-75 shrink-0">{att.size}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Read Receipts */}
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono px-1">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            msg.read ? (
                              <span className="text-indigo-600 font-bold flex items-center">
                                <CheckCheck className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {currentThread.length === 0 && (
                    <div className="text-center py-16 space-y-2">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-600">No messages in this conversation yet</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Send a message to start a direct, authorized discussion with {activeContact.name}.
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachments Preview Tray */}
                {attachments.length > 0 && (
                  <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2">
                    {attachments.map(att => (
                      <div
                        key={att.id}
                        className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 flex items-center space-x-2 text-xs shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-700 truncate max-w-[140px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Subject (e.g. Mathematics homework inquiry)..."
                      value={subjectText}
                      onChange={e => setSubjectText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <textarea
                        rows={2}
                        placeholder={`Message ${activeContact.name}...`}
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <label className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-all shrink-0">
                      <Paperclip className="w-4 h-4" />
                      <input
                        type="file"
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!messageText.trim() && attachments.length === 0}
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
                Select a contact from the list on the left to begin messaging.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
