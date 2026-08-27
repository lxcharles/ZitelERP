import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Plus,
  Trash2,
  HelpCircle,
  Percent,
  Sparkles,
  Info
} from 'lucide-react';
import { GradingStructure, User, ClassRoom, Subject, AcademicSection } from '../../types';
import { db } from '../../services/db';

interface AssessmentWeightingManagerProps {
  currentUser: User;
  onGradingStructureUpdated?: () => void;
}

export const AssessmentWeightingManager: React.FC<AssessmentWeightingManagerProps> = ({
  currentUser,
  onGradingStructureUpdated,
}) => {
  const structures = db.getGradingStructures();
  const classes = db.getClasses();
  const subjects = db.getSubjects();

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(structures[0]?.id || '');
  const activeScheme = structures.find(s => s.id === selectedSchemeId) || structures[0];

  // Config Form State
  const [schemeName, setSchemeName] = useState(activeScheme?.name || 'Standard 40/60 Scheme');
  const [schemeDescription, setSchemeDescription] = useState(activeScheme?.description || '');
  const [targetLevel, setTargetLevel] = useState<GradingStructure['level']>(activeScheme?.level || 'SCHOOL_DEFAULT');
  const [targetId, setTargetId] = useState<string>(activeScheme?.targetId || '');
  const [caWeight, setCaWeight] = useState<number>(activeScheme?.caWeight || 40);
  const [examWeight, setExamWeight] = useState<number>(activeScheme?.examWeight || 60);

  // Sub-components of Assessment (CA)
  const [components, setComponents] = useState<Array<{ name: string; weight: number; key: string }>>(() => {
    if (activeScheme?.breakdown) {
      const b = activeScheme.breakdown as any;
      if (Array.isArray(b)) {
        return b.map((item, idx) => ({
          key: `comp_${idx}`,
          name: item.name,
          weight: item.weight,
        }));
      }
      return [
        { key: 'classwork', name: 'Classwork & Exercises', weight: b.classwork || 10 },
        { key: 'assignment', name: 'Homework & Assignments', weight: b.assignment || 10 },
        { key: 'test', name: 'Periodic Tests & Quizzes', weight: b.test || 15 },
        { key: 'project', name: 'Projects & Practicals', weight: b.project || 5 },
      ];
    }
    return [
      { key: 'classwork', name: 'Classwork & Exercises', weight: 10 },
      { key: 'assignment', name: 'Homework & Assignments', weight: 10 },
      { key: 'test', name: 'Periodic Tests & Quizzes', weight: 15 },
      { key: 'project', name: 'Projects & Practicals', weight: 5 },
    ];
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Switch active scheme
  const handleSelectScheme = (scheme: GradingStructure) => {
    setSelectedSchemeId(scheme.id);
    setSchemeName(scheme.name);
    setSchemeDescription(scheme.description || '');
    setTargetLevel(scheme.level);
    setTargetId(scheme.targetId || '');
    setCaWeight(scheme.caWeight);
    setExamWeight(scheme.examWeight);

    if (scheme.breakdown) {
      const b = scheme.breakdown as any;
      if (Array.isArray(b)) {
        setComponents(
          b.map((item, idx) => ({
            key: `comp_${idx}`,
            name: item.name,
            weight: item.weight,
          }))
        );
      } else {
        const items: Array<{ name: string; weight: number; key: string }> = [];
        if (b.classwork !== undefined) items.push({ key: 'classwork', name: 'Classwork & Exercises', weight: b.classwork });
        if (b.assignment !== undefined) items.push({ key: 'assignment', name: 'Homework & Assignments', weight: b.assignment });
        if (b.test !== undefined) items.push({ key: 'test', name: 'Periodic Tests & Quizzes', weight: b.test });
        if (b.project !== undefined) items.push({ key: 'project', name: 'Projects & Practicals', weight: b.project });
        setComponents(items.length > 0 ? items : [
          { key: 'classwork', name: 'Classwork & Exercises', weight: Math.round(scheme.caWeight * 0.25) },
          { key: 'assignment', name: 'Homework & Assignments', weight: Math.round(scheme.caWeight * 0.25) },
          { key: 'test', name: 'Periodic Tests & Quizzes', weight: Math.round(scheme.caWeight * 0.5) },
        ]);
      }
    }
    setSaveSuccess(false);
    setErrorMessage('');
  };

  // Preset Option 1: 30% Assessment / 70% Exam
  const applyPresetOption1 = () => {
    setCaWeight(30);
    setExamWeight(70);
    setComponents([
      { key: 'classwork', name: 'Classwork & Exercises', weight: 5 },
      { key: 'assignment', name: 'Homework & Assignments', weight: 5 },
      { key: 'test', name: 'Periodic Tests & Quizzes', weight: 20 },
    ]);
  };

  // Preset Option 2: 40% Assessment / 60% Exam
  const applyPresetOption2 = () => {
    setCaWeight(40);
    setExamWeight(60);
    setComponents([
      { key: 'classwork', name: 'Classwork & Exercises', weight: 10 },
      { key: 'assignment', name: 'Homework & Assignments', weight: 10 },
      { key: 'test', name: 'Periodic Tests & Quizzes', weight: 15 },
      { key: 'project', name: 'Projects & Practicals', weight: 5 },
    ]);
  };

  // Component adjustments
  const handleComponentWeightChange = (index: number, newWeight: number) => {
    const next = [...components];
    next[index].weight = Math.max(0, newWeight);
    setComponents(next);
  };

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        key: `custom_${Date.now()}`,
        name: 'Class Participation & Inquiry',
        weight: 5,
      },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length <= 1) return;
    setComponents(components.filter((_, i) => i !== index));
  };

  // Mathematical validations
  const sumOfComponents = components.reduce((acc, curr) => acc + curr.weight, 0);
  const totalOverall = caWeight + examWeight;
  const isComponentsValid = sumOfComponents === caWeight;
  const isOverallValid = totalOverall === 100;
  const canSave = isComponentsValid && isOverallValid && schemeName.trim().length > 0;

  // Save Configuration
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      if (!isComponentsValid) {
        setErrorMessage(`Assessment components sum to ${sumOfComponents}%, but Continuous Assessment is set to ${caWeight}%. They must match exactly.`);
      } else if (!isOverallValid) {
        setErrorMessage(`Assessment (${caWeight}%) + Examination (${examWeight}%) = ${totalOverall}%. The overall sum must equal exactly 100%.`);
      }
      return;
    }

    try {
      const breakdownObj: Record<string, number> = { exam: examWeight };
      components.forEach(c => {
        breakdownObj[c.key] = c.weight;
      });

      if (activeScheme) {
        db.updateGradingStructure(
          activeScheme.id,
          {
            name: schemeName.trim(),
            description: schemeDescription.trim(),
            caWeight,
            examWeight,
            level: targetLevel,
            targetId,
            breakdown: breakdownObj as any,
          },
          currentUser
        );
      } else {
        db.createGradingStructure(
          {
            name: schemeName.trim(),
            description: schemeDescription.trim(),
            caWeight,
            examWeight,
            level: targetLevel,
            targetId,
            breakdown: breakdownObj as any,
          },
          currentUser
        );
      }

      setSaveSuccess(true);
      setErrorMessage('');
      onGradingStructureUpdated?.();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving grading structure');
    }
  };

  return (
    <div className="space-y-6" id="assessment-weighting-manager">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Curriculum Grading & Assessment Weighting Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Assessment & Examination Weight Configuration
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Configure default and custom assessment structures with live mathematical verification, sub-component breakdowns (Classwork, Homework, Tests, Projects), and overall 100% validation.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={applyPresetOption1}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              caWeight === 30 && examWeight === 70
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Option 1 (30% CA / 70% Exam)
          </button>
          <button
            type="button"
            onClick={applyPresetOption2}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              caWeight === 40 && examWeight === 60
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Option 2 (40% CA / 60% Exam)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scheme Selector & Current Schemes List */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Configured Grading Schemes ({structures.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {structures.map(s => {
                const isSelected = s.id === selectedSchemeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectScheme(s)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{s.name}</span>
                      {s.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                          School Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1 font-mono">
                      <span>CA: <strong className="text-indigo-600">{s.caWeight}%</strong></span>
                      <span>Exam: <strong className="text-slate-700">{s.examWeight}%</strong></span>
                      <span className="text-slate-400">Total: 100%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mathematical Rule Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Assessment Calculation Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 font-medium">
              <li>Assessment Components must equal the Total Assessment %</li>
              <li>Assessment % + Examination % must equal exactly 100%</li>
              <li>Invalid formulas are prevented from saving</li>
            </ul>
          </div>
        </div>

        {/* Right: Interactive Configuration & Validator */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                Scheme Parameters & Sub-Component Breakdown
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                Level: {targetLevel}
              </span>
            </div>

            {/* Scheme Name & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scheme Name
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={e => setSchemeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scope / Target Level
                </label>
                <select
                  value={targetLevel}
                  onChange={e => setTargetLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="SCHOOL_DEFAULT">School-Wide Default Scheme</option>
                  <option value="SECTION">Academic Section (Primary / JSS / SSS)</option>
                  <option value="CLASS">Class-Specific Scheme</option>
                  <option value="SUBJECT">Subject-Specific Scheme</option>
                </select>
              </div>
            </div>

            {/* Section 1: Major Split (Assessment vs Examination) */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Major Weight Distribution
                </span>
                <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                  isOverallValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Sum: {totalOverall}% / 100%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-indigo-900">
                    Total Assessment (CA) %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={caWeight}
                    onChange={e => setCaWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black font-mono text-indigo-700 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block">Classwork, Homework, Tests, Projects</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Terminal Examination %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={examWeight}
                    onChange={e => setExamWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black font-mono text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block">End-of-term standardized examination</span>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 text-[10px] text-white font-bold flex items-center justify-center transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, caWeight))}%` }}
                >
                  {caWeight > 10 ? `CA ${caWeight}%` : ''}
                </div>
                <div
                  className="bg-slate-700 text-[10px] text-white font-bold flex items-center justify-center transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, examWeight))}%` }}
                >
                  {examWeight > 10 ? `Exam ${examWeight}%` : ''}
                </div>
              </div>
            </div>

            {/* Section 2: Custom Assessment Breakdown */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    2. Custom Breakdown of Assessment Component ({caWeight}%)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Define individual weights for class tasks that combine to form the {caWeight}% CA total.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-all flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Component</span>
                </button>
              </div>

              {/* Components List */}
              <div className="space-y-3">
                {components.map((comp, idx) => (
                  <div key={comp.key || idx} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={comp.name}
                      onChange={e => {
                        const next = [...components];
                        next[idx].name = e.target.value;
                        setComponents(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                    />

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min={0}
                        max={caWeight}
                        value={comp.weight}
                        onChange={e => handleComponentWeightChange(idx, Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-center rounded-lg border border-slate-200 font-mono font-bold text-xs text-indigo-700 bg-indigo-50/50"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      disabled={components.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sub-components validation meter */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Total Sub-Components Calculated:</span>
                <span className={`font-mono font-black ${
                  isComponentsValid ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {sumOfComponents}% of {caWeight}% Required
                </span>
              </div>
            </div>

            {/* Live Calculation Display Box */}
            <div className="p-5 rounded-2xl bg-indigo-950 text-white space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span className="uppercase tracking-wider">Formal Calculation Formula</span>
                <span>{canSave ? '✓ Valid Mathematical Structure' : '⚠ Validation Action Required'}</span>
              </div>

              <div className="font-mono text-xs sm:text-sm space-y-1.5 bg-white/10 p-4 rounded-xl border border-white/15">
                <div className="text-amber-300 font-bold">
                  Assessment ({caWeight}%) = {components.map(c => `${c.name.split(' ')[0]} ${c.weight}%`).join(' + ')} = {sumOfComponents}%
                </div>
                <div className="text-slate-300 font-bold">
                  Examination = {examWeight}%
                </div>
                <div className="pt-1 text-emerald-400 font-black border-t border-white/10">
                  Overall Total = Assessment ({caWeight}%) + Examination ({examWeight}%) = {totalOverall}%
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center space-x-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Grading structure & assessment component weights successfully updated!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="submit"
                disabled={!canSave}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>Save Assessment Weights</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
