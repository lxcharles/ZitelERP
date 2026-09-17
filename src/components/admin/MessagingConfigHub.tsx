import React, { useState } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Shield,
  Send,
  Lock,
  ExternalLink,
  Info,
  Clock
} from 'lucide-react';
import { User, MessagingIntegrationConfig, StudentCredentialDeliveryRecord } from '../../types';
import { db } from '../../services/db';

interface MessagingConfigHubProps {
  currentUser: User;
  onPrintSlip?: (studentId: string) => void;
}

export const MessagingConfigHub: React.FC<MessagingConfigHubProps> = ({ currentUser, onPrintSlip }) => {
  const [config, setConfig] = useState<MessagingIntegrationConfig>(db.getMessagingConfig());
  const [deliveries, setDeliveries] = useState<StudentCredentialDeliveryRecord[]>(db.getCredentialDeliveries());
  const [activeTab, setActiveTab] = useState<'gateways' | 'deliveries'>('gateways');
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'WhatsApp' | 'SMS' | 'Email' | 'Slip_Generated'>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable config state
  const [smsEnabled, setSmsEnabled] = useState(config.sms?.enabled ?? config.smsConfigured);
  const [smsProvider, setSmsProvider] = useState(config.sms?.provider || config.smsProvider || 'Termii Nigeria');
  const [smsApiKey, setSmsApiKey] = useState(config.sms?.apiKey || '');
  const [smsSenderId, setSmsSenderId] = useState(config.sms?.senderId || 'ZITELSCH');

  const [whatsappEnabled, setWhatsappEnabled] = useState(config.whatsApp?.enabled ?? config.whatsAppConfigured);
  const [whatsappProvider, setWhatsappProvider] = useState(config.whatsApp?.provider || config.whatsAppProvider || 'Meta WhatsApp Cloud API');
  const [whatsappToken, setWhatsappToken] = useState(config.whatsApp?.apiKey || '');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(config.whatsApp?.phoneNumberId || '');

  const [emailEnabled, setEmailEnabled] = useState(config.email?.enabled ?? config.emailConfigured);
  const [emailProvider, setEmailProvider] = useState(config.email?.provider || config.emailProvider || 'SendGrid Transactional');
  const [emailApiKey, setEmailApiKey] = useState(config.email?.apiKey || '');
  const [emailFromAddress, setEmailFromAddress] = useState(config.email?.fromEmail || 'admissions@zitelcastleschool.com');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: MessagingIntegrationConfig = {
      smsConfigured: smsEnabled,
      smsProvider,
      whatsAppConfigured: whatsappEnabled,
      whatsAppProvider: whatsappProvider,
      emailConfigured: emailEnabled,
      emailProvider,
      schoolOfficialLoginUrl: config.schoolOfficialLoginUrl || 'https://portal.zitelcastleschool.com/login',
      sms: {
        provider: smsProvider,
        enabled: smsEnabled,
        apiKey: smsApiKey,
        senderId: smsSenderId,
      },
      whatsApp: {
        provider: whatsappProvider,
        enabled: whatsappEnabled,
        apiKey: whatsappToken,
        phoneNumberId: whatsappPhoneId,
      },
      email: {
        provider: emailProvider,
        enabled: emailEnabled,
        apiKey: emailApiKey,
        fromEmail: emailFromAddress,
      },
    };

    db.updateMessagingConfig(updated, currentUser);
    setConfig(updated);
    setIsSaving(false);
    setFeedbackMsg('Messaging integration configuration saved successfully.');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleRetryDelivery = (deliveryId: string, channel: 'WhatsApp' | 'SMS' | 'Email' | 'Slip_Generated') => {
    const res = db.retryCredentialDelivery(deliveryId, channel, currentUser);
    setDeliveries(db.getCredentialDeliveries());
    setFeedbackMsg(res.message);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const filteredDeliveries = deliveries.filter(d => {
    if (filterChannel === 'ALL') return true;
    return d.channel === filterChannel;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-500 hover:text-slate-900 font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-[10px] uppercase font-bold text-indigo-300">
              Gateway Authenticity Guard
            </span>
          </div>
          <h2 className="text-xl font-black">Messaging Gateways & Credential Delivery Logs</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Configure live messaging providers (WhatsApp Cloud API, Termii SMS, Resend/SendGrid). If no provider is connected, the system will never simulate fake deliveries and will automatically require printable slips.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className={`px-3 py-2 rounded-2xl border text-center ${config.whatsapp.enabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-rose-500/20 border-rose-400/40 text-rose-300'}`}>
            <p className="text-[9px] uppercase font-bold">WhatsApp</p>
            <p className="text-xs font-black">{config.whatsapp.enabled ? 'ONLINE' : 'OFFLINE'}</p>
          </div>
          <div className={`px-3 py-2 rounded-2xl border text-center ${config.sms.enabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-rose-500/20 border-rose-400/40 text-rose-300'}`}>
            <p className="text-[9px] uppercase font-bold">SMS</p>
            <p className="text-xs font-black">{config.sms.enabled ? 'ONLINE' : 'OFFLINE'}</p>
          </div>
          <div className={`px-3 py-2 rounded-2xl border text-center ${config.email.enabled ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-rose-500/20 border-rose-400/40 text-rose-300'}`}>
            <p className="text-[9px] uppercase font-bold">Email</p>
            <p className="text-xs font-black">{config.email.enabled ? 'ONLINE' : 'OFFLINE'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'gateways' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Provider Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'deliveries' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Credential Dispatch Logs ({deliveries.length})</span>
        </button>
      </div>

      {/* TAB 1: Provider Gateways */}
      {activeTab === 'gateways' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Strict Anti-Pretense Standard</p>
              <p className="text-[11px] text-amber-800">
                When a messaging gateway is disabled or unconfigured, student and parent credential notifications are safely halted with clear diagnostic logs, instructing staff to issue the physical Printable Slip.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* WhatsApp Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    WA
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">WhatsApp Gateway</h4>
                    <p className="text-[10px] text-slate-500">Cloud API / Twilio</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={e => setWhatsappEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Provider Type</label>
                  <select
                    value={whatsappProvider}
                    onChange={e => setWhatsappProvider(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="WHATSAPP_CLOUD_API">Meta WhatsApp Cloud API</option>
                    <option value="TWILIO_WHATSAPP">Twilio WhatsApp Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={whatsappPhoneId}
                    onChange={e => setWhatsappPhoneId(e.target.value)}
                    placeholder="e.g. 104829104928"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">API Token / Secret Key</label>
                  <input
                    type="password"
                    value={whatsappToken}
                    onChange={e => setWhatsappToken(e.target.value)}
                    placeholder="EAA..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SMS Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    SMS
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">SMS Gateway</h4>
                    <p className="text-[10px] text-slate-500">Termii / Africa's Talking</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={e => setSmsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Provider Type</label>
                  <select
                    value={smsProvider}
                    onChange={e => setSmsProvider(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="TERMII">Termii (Nigeria & West Africa)</option>
                    <option value="AFRICAS_TALKING">Africa's Talking</option>
                    <option value="TWILIO_SMS">Twilio Global SMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sender ID (Alpha-Header)</label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={e => setSmsSenderId(e.target.value)}
                    placeholder="e.g. ZITELSCH"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">API Key</label>
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={e => setSmsApiKey(e.target.value)}
                    placeholder="TL..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Email Gateway</h4>
                    <p className="text-[10px] text-slate-500">SendGrid / Resend</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={e => setEmailEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Provider Type</label>
                  <select
                    value={emailProvider}
                    onChange={e => setEmailProvider(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="SENDGRID">SendGrid</option>
                    <option value="RESEND">Resend</option>
                    <option value="AWS_SES">AWS SES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">From Email Address</label>
                  <input
                    type="email"
                    value={emailFromAddress}
                    onChange={e => setEmailFromAddress(e.target.value)}
                    placeholder="admissions@school.com"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">API Key</label>
                  <input
                    type="password"
                    value={emailApiKey}
                    onChange={e => setEmailApiKey(e.target.value)}
                    placeholder="SG..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Messaging Integration Config'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Credential Delivery Logs */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Filter Channel:</span>
              {(['ALL', 'WHATSAPP', 'SMS', 'EMAIL', 'PRINTABLE_SLIP'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    filterChannel === ch ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ch.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 font-bold">
              {filteredDeliveries.length} Records
            </p>
          </div>

          {/* Delivery Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student / Recipient</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Contact Detail</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.map(d => {
                    const isSuccess = d.status === 'DELIVERED';
                    const isPending = d.status === 'PENDING_GATEWAY';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{d.studentName}</p>
                          <p className="text-[11px] text-slate-500">Parent: {d.recipientName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-slate-100 text-slate-700">
                            {d.channel}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {d.recipientContact}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.status.replace('_', ' ')}
                          </span>
                          {d.errorMessage && (
                            <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate" title={d.errorMessage}>
                              {d.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                          {new Date(d.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {d.channel !== 'PRINTABLE_SLIP' && (
                            <button
                              onClick={() => handleRetryDelivery(d.id, d.channel as any)}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold inline-flex items-center space-x-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                          <button
                            onClick={() => onPrintSlip && onPrintSlip(d.studentId)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold inline-flex items-center space-x-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
