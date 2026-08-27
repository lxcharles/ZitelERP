import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  X,
  Search,
  Sparkles,
  Tag,
  Star
} from 'lucide-react';
import { User, BehaviorCategory } from '../../types';
import { db } from '../../services/db';

interface BehaviorCategorySettingsProps {
  currentUser: User;
}

export const BehaviorCategorySettings: React.FC<BehaviorCategorySettingsProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<BehaviorCategory[]>(db.getBehaviorCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BehaviorCategory | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDefaultType, setFormDefaultType] = useState<'Positive' | 'Neutral' | 'Concern' | 'Incident'>('Positive');
  const [formDefaultPoints, setFormDefaultPoints] = useState<number>(3);
  const [formColor, setFormColor] = useState<string>('emerald');

  const refreshList = () => {
    setCategories(db.getBehaviorCategories());
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormDefaultType('Positive');
    setFormDefaultPoints(3);
    setFormColor('emerald');
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: BehaviorCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormDefaultType(cat.defaultStatus || cat.defaultType || 'Positive');
    setFormDefaultPoints(cat.defaultPoints || 0);
    setFormColor(cat.color || 'indigo');
    setShowModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      db.updateBehaviorCategory(
        editingCategory.id,
        {
          name: formName.trim(),
          description: formDescription.trim(),
          defaultStatus: formDefaultType,
          defaultType: formDefaultType,
          defaultPoints: formDefaultPoints,
          color: formColor,
        },
        currentUser
      );
    } else {
      db.createBehaviorCategory(
        {
          name: formName.trim(),
          description: formDescription.trim(),
          defaultStatus: formDefaultType,
          defaultType: formDefaultType,
          defaultPoints: formDefaultPoints,
          color: formColor,
          isActive: true,
        },
        currentUser
      );
    }

    refreshList();
    setShowModal(false);
  };

  const handleToggleActive = (id: string) => {
    db.toggleBehaviorCategory(id, currentUser);
    refreshList();
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      db.deleteBehaviorCategory(id, currentUser);
      refreshList();
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="behavior-category-settings">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-900">Behavioral Categories Configuration</h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure standardized conduct categories, point weights, and default types for Form Teachers
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search categories (Participation, Punctuality, Respect, Homework, Conduct...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(cat => {
          const isActive = cat.isActive !== false;
          return (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                isActive ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200/60 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                    <Tag className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <span
                      className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md mt-0.5 ${
                        cat.defaultType === 'Positive'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cat.defaultType === 'Neutral'
                          ? 'bg-slate-100 text-slate-800'
                          : cat.defaultType === 'Concern'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cat.defaultType} ({cat.defaultPoints && cat.defaultPoints > 0 ? `+${cat.defaultPoints}` : cat.defaultPoints || 0} pts)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(cat.id)}
                  title={isActive ? 'Deactivate Category' : 'Activate Category'}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  {isActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                {cat.description || 'Standard pastoral observation classification.'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-medium text-slate-400">
                  Status: <strong className={isActive ? 'text-emerald-700' : 'text-slate-500'}>{isActive ? 'Active' : 'Disabled'}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create Behavior Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Leadership, Punctuality, Respect"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief guidance on what this category evaluates..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Type</label>
                  <select
                    value={formDefaultType}
                    onChange={e => setFormDefaultType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Concern">Concern</option>
                    <option value="Incident">Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Points</label>
                  <input
                    type="number"
                    value={formDefaultPoints}
                    onChange={e => setFormDefaultPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
