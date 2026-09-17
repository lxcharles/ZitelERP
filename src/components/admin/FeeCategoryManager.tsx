import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { User, FeeCategory, AcademicSection } from '../../types';
import { db } from '../../services/db';

interface FeeCategoryManagerProps {
  currentUser: User;
}

export const FeeCategoryManager: React.FC<FeeCategoryManagerProps> = ({ currentUser }) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';

  const [categories, setCategories] = useState<FeeCategory[]>(db.getFeeCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [frequency, setFrequency] = useState<FeeCategory['frequency']>('TERMLY');
  const [defaultAmount, setDefaultAmount] = useState<number>(25000);
  const [applicableSection, setApplicableSection] = useState<AcademicSection | 'ALL'>('ALL');

  const reload = () => {
    setCategories(db.getFeeCategories());
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setCode('');
    setDescription('');
    setIsMandatory(true);
    setFrequency('TERMLY');
    setDefaultAmount(25000);
    setApplicableSection('ALL');
    setShowModal(true);
  };

  const openEditModal = (cat: FeeCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || '');
    setIsMandatory(cat.isMandatory);
    setFrequency(cat.frequency);
    setDefaultAmount(cat.defaultAmount || 0);
    setApplicableSection(cat.applicableSection || 'ALL');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Please provide category name and code');
      return;
    }

    if (editingCategory) {
      db.updateFeeCategory(
        editingCategory.id,
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          isMandatory,
          frequency,
          defaultAmount: Number(defaultAmount) || 0,
          applicableSection,
        },
        currentUser
      );
      setFeedbackMsg(`Updated fee category "${name.trim()}" successfully.`);
    } else {
      db.createFeeCategory(
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          isMandatory,
          frequency,
          defaultAmount: Number(defaultAmount) || 0,
          applicableSection,
          status: 'active',
        },
        currentUser
      );
      setFeedbackMsg(`Created new fee category "${name.trim()}" successfully.`);
    }

    setShowModal(false);
    reload();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = (cat: FeeCategory) => {
    if (window.confirm(`Are you sure you want to remove fee category "${cat.name}"?`)) {
      db.deleteFeeCategory(cat.id, currentUser);
      setFeedbackMsg(`Removed category "${cat.name}".`);
      reload();
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const filteredCategories = categories.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchSection =
      sectionFilter === 'ALL' ||
      c.applicableSection === 'ALL' ||
      c.applicableSection === sectionFilter;

    return matchSearch && matchSection;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <span>School Fee Categories & Levy Catalogue</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure approved fee components, billing frequencies, default amounts, and section applicability.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fee Category</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search fee category by name, code or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Sections</option>
            <option value="PRIMARY">Primary Section</option>
            <option value="JUNIOR_SECONDARY">Junior Secondary</option>
            <option value="SENIOR_SECONDARY">Senior Secondary</option>
          </select>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(cat => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-xs flex flex-col justify-between space-y-4 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {cat.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{cat.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    cat.isMandatory
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {cat.isMandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Billing Frequency:</span>
                <span className="font-semibold text-slate-800 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                  {cat.frequency}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Default Rate:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currency}{(cat.defaultAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Applicable Section:</span>
                <span className="font-medium text-slate-700">
                  {cat.applicableSection || 'ALL'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                  title="Edit fee category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  title="Delete fee category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          No fee categories found matching your filter criteria.
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-display">
                {editingCategory ? 'Edit Fee Category' : 'Create New Fee Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition & Instructional Fee"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TUI, DEV, ICT"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Default Amount ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={defaultAmount}
                    onChange={e => setDefaultAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billing Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="TERMLY">Termly (Each Term)</option>
                    <option value="SESSIONAL">Sessional (Annual / Once a Year)</option>
                    <option value="ONE_TIME">One-Time (New Enrollment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Applicable Section</label>
                  <select
                    value={applicableSection}
                    onChange={e => setApplicableSection(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All Sections (Primary & Secondary)</option>
                    <option value="PRIMARY">Primary Section Only</option>
                    <option value="JUNIOR_SECONDARY">Junior Secondary Only</option>
                    <option value="SENIOR_SECONDARY">Senior Secondary Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Billing Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Outline the learning modules, supplies, or infrastructure covered by this fee levy..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catMandatory"
                  checked={isMandatory}
                  onChange={e => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="catMandatory" className="text-slate-800 font-bold cursor-pointer">
                  Mandatory fee item for all enrolled students in section
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
