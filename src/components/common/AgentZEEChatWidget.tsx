import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  HelpCircle,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from '../../types';
import { aiService } from '../../services/aiService';
import { db } from '../../services/db';
import { CommunicationHubModal } from './CommunicationHubModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  showAdminPrompt?: boolean;
}

interface AgentZEEChatWidgetProps {
  currentUser: User;
  activeTab?: string;
  activeClass?: { id: string; name: string };
}

export const AgentZEEChatWidget: React.FC<AgentZEEChatWidgetProps> = ({
  currentUser,
  activeTab = 'overview',
  activeClass,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Turn count & Admin Escalation
  const [unresolvedTurns, setUnresolvedTurns] = useState<number>(0);
  const [showAdminContact, setShowAdminContact] = useState<boolean>(false);
  const [openChatWithAdmin, setOpenChatWithAdmin] = useState<boolean>(false);

  // Branch Administrator Data for the authenticated user's branch
  const effectiveBranchId = useMemo(() => {
    return currentUser.branchId || db.getActiveBranchId() || 'branch_bungalow';
  }, [currentUser.branchId]);

  const branchAdmin = useMemo(() => {
    return db.getBranchAdmin(effectiveBranchId);
  }, [effectiveBranchId]);

  const initialGreeting = `Hi **${currentUser.name}**, I'm **Agent ZEE**, your dedicated platform assistant for **${branchAdmin.branchName}**.\n\nHow can I assist you with using the **ZITEL CASTLE SCHOOL** platform today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, loading, showAdminContact]);

  // Role-Aware Quick Prompts tailored to specific user workflow
  const getRoleQuickPrompts = (): string[] => {
    const role = currentUser.role;
    if (role === 'TEACHER') {
      return [
        'How do I submit results?',
        'How do I create a lesson note?',
        'How do I generate a report?',
        'How do I contact a parent?',
        'Contact Branch Admin',
        'What do I do here?',
      ];
    }
    if (role === 'PARENT') {
      return [
        "How do I view my child's result?",
        'How do I make a payment?',
        'How do I contact the teacher?',
        'Where can I see the school calendar?',
        'Contact Branch Admin',
        'What do I do here?',
      ];
    }
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const prompts = [
        'How do I create a teacher?',
        'How do I manage students?',
        'How do I upload the calendar?',
        'How do I view reports?',
      ];
      if (role === 'SUPER_ADMIN') {
        prompts.push('How do I create a new branch?');
      }
      prompts.push('Contact Branch Admin');
      prompts.push('What do I do here?');
      return prompts;
    }
    if ((role as string) === 'BURSAR') {
      return [
        'How do I confirm offline payment?',
        'How do I view outstanding fees?',
        'How do I generate a financial report?',
        'Contact Branch Admin',
        'What do I do here?',
      ];
    }
    if (role === 'STUDENT') {
      return [
        'How do I view my homework?',
        'Where do I check my report sheet?',
        'How do I see my class timetable?',
        'Contact Branch Admin',
        'What do I do here?',
      ];
    }
    return [
      'How do I use ZITEL CHAT ROOM?',
      'Where can I see the school calendar?',
      'Contact Branch Admin',
      'I need help with my login',
    ];
  };

  const quickPrompts = getRoleQuickPrompts();

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    // Detect keywords: 'help', 'support', 'admin', 'escalate', etc.
    const isHelpKeyword = /(\bhelp\b|\bsupport\b|contact admin|reach admin|speak to admin|talk to admin|call admin|escalate|trouble|stuck)/i.test(
      textToSend
    );

    // Track conversational turns
    const nextTurnCount = unresolvedTurns + 1;
    setUnresolvedTurns(nextTurnCount);

    // Should we automatically trigger the Branch Admin contact card?
    // Trigger condition: contains keywords like 'help' or 'support' OR unresolved after two turns (>= 2)
    const shouldDisplayAdminCard = isHelpKeyword || nextTurnCount >= 2;
    if (shouldDisplayAdminCard) {
      setShowAdminContact(true);
    }

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await aiService.askAgentZEE(
        {
          message: textToSend,
          user: currentUser,
          currentTab: activeTab,
          activeClass: activeClass?.name,
          branchId: effectiveBranchId,
          branchName: branchAdmin.branchName,
          branchAdmin: branchAdmin,
          schoolContext: {
            branchName: branchAdmin.branchName,
            branchId: effectiveBranchId,
            role: currentUser.role,
          },
          unresolvedTurns: nextTurnCount,
          isHelpOrSupport: shouldDisplayAdminCard,
          history: messages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        },
        currentUser
      );

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showAdminPrompt: shouldDisplayAdminCard,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Notice:** ${err.message || 'Unable to connect to Agent ZEE. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showAdminPrompt: true,
      };
      setMessages(prev => [...prev, errMsg]);
      setShowAdminContact(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setUnresolvedTurns(0);
    setShowAdminContact(false);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'ai',
        text: `Conversation reset. How can I help you use the **ZITEL CASTLE SCHOOL** platform, **${currentUser.name}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleFeedback = (resolved: boolean) => {
    if (resolved) {
      setUnresolvedTurns(0);
      setShowAdminContact(false);
      const ackMsg: ChatMessage = {
        id: `ack_${Date.now()}`,
        sender: 'ai',
        text: `Glad that helped! Let me know if you have any more questions about the platform.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, ackMsg]);
    } else {
      setShowAdminContact(true);
    }
  };

  // Render markdown bold and numbered/bullet lists cleanly for clarity
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (line.startsWith('### ')) {
        return (
          <h4
            key={idx}
            className="text-xs font-bold text-indigo-900 mt-2 mb-1 flex items-center space-x-1"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^###\s+/, '') }}
          />
        );
      }
      if (line.startsWith('---')) {
        return <hr key={idx} className="my-2 border-slate-200" />;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-slate-700 text-xs my-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, '') }}
          />
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li
            key={idx}
            className="ml-4 list-decimal text-slate-700 text-xs my-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s+/, '') }}
          />
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p
          key={idx}
          className="text-xs text-slate-800 my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  const formatRoleLabel = (role: string) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatTabLabel = (tab: string) => {
    return tab.replace(/[-_]/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <>
      {/* Floating Action Trigger Bubble (When Closed) */}
      {!isOpen && (
        <div className="fixed bottom-22 sm:bottom-6 right-4 sm:right-6 z-30 no-print animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            id="agent-zee-open-trigger"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center space-x-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-400/30 backdrop-blur-md cursor-pointer active:scale-95"
            title="Open Agent ZEE Platform Assistant"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-900" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                <span>Agent ZEE</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full font-bold text-slate-950">
                  AI Co-pilot
                </span>
              </span>
              <span className="text-[10px] text-purple-200 leading-tight">Support & Copilot</span>
            </div>
          </button>
        </div>
      )}

      {/* Minimized Docked Pill (Centered at Bottom) */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-[440px] bg-slate-900 text-white rounded-full shadow-2xl border border-indigo-700/60 px-4 py-2.5 flex items-center justify-between no-print animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white truncate">Agent ZEE</span>
            <span className="text-[10px] text-indigo-200 truncate hidden sm:inline">
              • {branchAdmin.branchName}
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition-colors"
              title="Expand to Center"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Centralized Chat Pop-Up Modal (Without Overshooting Screen) */}
      {isOpen && !isMinimized && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/45 backdrop-blur-xs no-print animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            id="agent-zee-central-chat-modal"
            className="relative w-full max-w-[500px] h-[640px] max-h-[min(650px,calc(100dvh-2rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800 select-none">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-800 border border-indigo-600/60 flex items-center justify-center text-amber-300 shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold text-white tracking-tight truncate">
                      Agent ZEE
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold shrink-0">
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-200 font-medium truncate">
                    Zitel Castle School • Platform Support
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => setShowAdminContact(prev => !prev)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center space-x-1 ${
                    showAdminContact
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/10 text-indigo-200 hover:text-white hover:bg-white/20'
                  }`}
                  title="Contact Branch Administrator"
                >
                  <Building2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Admin Help</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Clear Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* System Context Header Bar */}
            <div className="shrink-0 px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center space-x-2 truncate">
                <span className="flex items-center space-x-1 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{formatRoleLabel(currentUser.role)}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center space-x-1 text-slate-600 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{branchAdmin.branchName}</span>
                </span>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-2 py-0.5 rounded-md font-medium shrink-0">
                {formatTabLabel(activeTab)}
              </span>
            </div>

            {/* Collapsible Direct Branch Admin Support Banner (Shown automatically on help/unresolved >=2 turns) */}
            {showAdminContact && (
              <div
                id="agent-zee-admin-card"
                className="shrink-0 bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-50 border-b border-amber-200 p-3 sm:p-3.5 transition-all duration-200 animate-in slide-in-from-top-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Designated Branch Administrator
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {branchAdmin.name}
                      </h4>
                      <p className="text-[10px] text-slate-600">{branchAdmin.roleTitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAdminContact(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Direct Action Buttons */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setOpenChatWithAdmin(true)}
                    className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="truncate">Zitel Chat</span>
                  </button>
                  <a
                    href={`tel:${branchAdmin.phone.replace(/\s+/g, '')}`}
                    className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-[10px] font-semibold transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Call Line</span>
                  </a>
                  <a
                    href={`mailto:${branchAdmin.email}?subject=Zitel%20Platform%20Support%20Request%20-%20${currentUser.name}`}
                    className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-[10px] font-semibold transition-colors shadow-2xs"
                  >
                    <Mail className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">Email</span>
                  </a>
                </div>

                {/* Clear Step-by-Step Instructions */}
                <div className="mt-2 text-[10px] text-slate-700 bg-white/80 rounded-lg p-2 border border-amber-200/80 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-0.5">Instructions for Branch Support:</p>
                  <p>
                    1. Click <strong>Zitel Chat</strong> above to message <strong>{branchAdmin.name}</strong> directly in the official chat room.
                  </p>
                  <p>
                    2. Branch Office: <strong>{branchAdmin.address}</strong> (Open 7:30 AM – 4:00 PM).
                  </p>
                </div>
              </div>
            )}

            {/* Scrollable Message List (Flex-1, prevents overflow/overshooting) */}
            <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[92%] ${
                      msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-indigo-700 text-white'
                          : 'bg-white border border-slate-200 text-indigo-700'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <UserIcon className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs relative group ${
                        msg.sender === 'user'
                          ? 'bg-indigo-700 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div>{renderFormattedText(msg.text)}</div>
                      )}

                      {/* Footer & Copy & Resolution feedback for AI replies */}
                      {msg.sender === 'ai' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                          <span>{msg.timestamp}</span>

                          <div className="flex items-center space-x-2">
                            {/* Did this resolve feedback */}
                            <div className="flex items-center space-x-1 mr-1">
                              <span className="text-[9px] text-slate-400">Helpful?</span>
                              <button
                                onClick={() => handleFeedback(true)}
                                className="p-1 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                                title="Yes, this helped"
                              >
                                <ThumbsUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(false)}
                                className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                                title="No, need admin help"
                              >
                                <ThumbsDown className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start space-x-2 max-w-[90%]">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-xs flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Agent ZEE is checking the platform...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips (Shrink-0) */}
            <div className="shrink-0 px-3 py-2 bg-white border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1.5">
                <span className="flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Suggested questions:</span>
                </span>
                {!showAdminContact && (
                  <button
                    onClick={() => setShowAdminContact(true)}
                    className="text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    Need Branch Admin?
                  </button>
                )}
              </div>
              <div className="overflow-x-auto flex space-x-1.5 pb-1 scrollbar-none">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (prompt === 'Contact Branch Admin') {
                        setShowAdminContact(true);
                        handleSendMessage('I need help from the branch administrator');
                      } else {
                        handleSendMessage(prompt);
                      }
                    }}
                    className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors border ${
                      prompt === 'Contact Branch Admin'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border-slate-200 hover:border-indigo-200'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form (Shrink-0, bottom) */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="shrink-0 p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder={`Ask Agent ZEE about ${branchAdmin.branchName}...`}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Direct Zitel Chat Modal with Branch Administrator */}
      {openChatWithAdmin && (
        <CommunicationHubModal
          currentUser={currentUser}
          isOpen={openChatWithAdmin}
          onClose={() => setOpenChatWithAdmin(false)}
          initialRecipientId={branchAdmin.id}
        />
      )}
    </>
  );
};
