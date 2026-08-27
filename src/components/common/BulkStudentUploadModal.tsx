import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  Eye,
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { User, Student, ClassRoom } from '../../types';
import { db } from '../../services/db';
import { downloadCSV } from '../../utils/exportCsv';

interface BulkStudentUploadModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedStudentRow {
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  className: string;
  classId: string;
  dob?: string;
  house?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isValid: boolean;
  validationError?: string;
}

const SAMPLE_CSV_TEMPLATE = `Full Name,Gender,Class Name,Date of Birth,House,Blood Group,Emergency Contact Name,Emergency Contact Phone
"Liam Alexander Carter",Male,"Primary 3A",2016-05-14,"Blue House","O+","Emma Carter","+1 555-019-2831"
"Sophia Isabella Martinez",Female,"Primary 3A",2016-08-22,"Gold House","A+","Carlos Martinez","+1 555-019-4829"
"Noah Elijah Robinson",Male,"Primary 4A",2015-11-03,"Red House","B+","Rachel Robinson","+1 555-019-8812"
"Ava Charlotte Zhang",Female,"Primary 4A",2015-03-19,"Green House","AB+","Wei Zhang","+1 555-019-9941"`;

const SAMPLE_JSON_TEMPLATE = [
  {
    fullName: "Liam Alexander Carter",
    gender: "Male",
    className: "Primary 3A",
    dob: "2016-05-14",
    house: "Blue House",
    bloodGroup: "O+",
    emergencyContact: {
      name: "Emma Carter",
      relationship: "Mother",
      phone: "+1 555-019-2831"
    }
  },
  {
    fullName: "Sophia Isabella Martinez",
    gender: "Female",
    className: "Primary 3A",
    dob: "2016-08-22",
    house: "Gold House",
    bloodGroup: "A+",
    emergencyContact: {
      name: "Carlos Martinez",
      relationship: "Father",
      phone: "+1 555-019-4829"
    }
  }
];

export const BulkStudentUploadModal: React.FC<BulkStudentUploadModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
}) => {
  const classes = db.getClasses();
  const [activeMode, setActiveMode] = useState<'file' | 'paste'>('file');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleDownloadTemplate = (type: 'csv' | 'json') => {
    if (type === 'csv') {
      downloadCSV('Oakridge_Student_Enrollment_Template.csv', SAMPLE_CSV_TEMPLATE);
    } else {
      const jsonStr = JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Oakridge_Student_Enrollment_Template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const parseCSVText = (text: string): ParsedStudentRow[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return [];

    // Header row check
    const headerLine = lines[0];
    const dataLines = lines.slice(1);

    const classMapByName = new Map(classes.map(c => [c.name.toLowerCase().trim(), c]));

    const results: ParsedStudentRow[] = [];

    dataLines.forEach((line, index) => {
      // Regex for CSV split handling quotes
      const pattern = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values: string[] = [];
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let val = match[1];
        if (val === undefined) continue;
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        values.push(val.trim());
      }

      const fullName = values[0] || '';
      const genderRaw = values[1] || 'Male';
      const classNameRaw = values[2] || 'Primary 3A';
      const dob = values[3] || '2016-01-01';
      const house = values[4] || 'Blue House';
      const bloodGroup = values[5] || 'O+';
      const contactName = values[6] || 'Parent / Guardian';
      const contactPhone = values[7] || '';

      const matchedClass = classMapByName.get(classNameRaw.toLowerCase().trim()) || classes[0];

      let isValid = true;
      let validationError = '';

      if (!fullName) {
        isValid = false;
        validationError = 'Missing student full name.';
      } else if (!matchedClass) {
        isValid = false;
        validationError = `Unknown class "${classNameRaw}". Available classes: ${classes.map(c => c.name).join(', ')}`;
      }

      const gender: 'Male' | 'Female' | 'Other' =
        genderRaw.toLowerCase().startsWith('f') ? 'Female' : 'Male';

      results.push({
        fullName,
        gender,
        className: matchedClass?.name || classNameRaw,
        classId: matchedClass?.id || classes[0]?.id || 'cls_p3a',
        dob,
        house,
        bloodGroup,
        emergencyContactName: contactName,
        emergencyContactPhone: contactPhone,
        isValid,
        validationError
      });
    });

    return results;
  };

  const parseJSONText = (text: string): ParsedStudentRow[] => {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setErrorBanner('JSON must be an array of student objects.');
        return [];
      }

      const classMapByName = new Map(classes.map(c => [c.name.toLowerCase().trim(), c]));
      const classMapById = new Map(classes.map(c => [c.id, c]));

      return data.map((item: any, i: number) => {
        const fullName = item.fullName || item.name || '';
        const classNameRaw = item.className || item.class || 'Primary 3A';
        const classIdRaw = item.classId;

        const matchedClass =
          (classIdRaw ? classMapById.get(classIdRaw) : null) ||
          classMapByName.get(classNameRaw.toLowerCase().trim()) ||
          classes[0];

        let isValid = true;
        let validationError = '';

        if (!fullName) {
          isValid = false;
          validationError = 'Missing fullName property.';
        }

        const gender: 'Male' | 'Female' | 'Other' =
          item.gender?.toLowerCase().startsWith('f') ? 'Female' : 'Male';

        return {
          fullName,
          gender,
          className: matchedClass?.name || classNameRaw,
          classId: matchedClass?.id || classes[0]?.id || 'cls_p3a',
          dob: item.dob || item.dateOfBirth || '2016-01-01',
          house: item.house || 'Blue House',
          bloodGroup: item.bloodGroup || 'O+',
          emergencyContactName:
            typeof item.emergencyContact === 'object'
              ? item.emergencyContact.name
              : item.emergencyContact || 'Guardian',
          emergencyContactPhone:
            typeof item.emergencyContact === 'object'
              ? item.emergencyContact.phone
              : item.primaryContactPhone || '',
          isValid,
          validationError
        };
      });
    } catch (err: any) {
      setErrorBanner(`JSON Parse Error: ${err.message}`);
      return [];
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorBanner(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) {
        setIsProcessing(false);
        return;
      }

      if (file.name.endsWith('.json') || file.type.includes('json')) {
        setFileType('json');
        const rows = parseJSONText(content);
        setParsedRows(rows);
      } else {
        setFileType('csv');
        const rows = parseCSVText(content);
        setParsedRows(rows);
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setErrorBanner('Failed to read selected file.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handlePasteProcess = () => {
    setErrorBanner(null);
    if (!pastedText.trim()) {
      setErrorBanner('Please paste CSV or JSON content in the text box.');
      return;
    }

    setIsProcessing(true);
    let rows: ParsedStudentRow[] = [];

    if (pastedText.trim().startsWith('[') || pastedText.trim().startsWith('{')) {
      setFileType('json');
      rows = parseJSONText(pastedText);
    } else {
      setFileType('csv');
      rows = parseCSVText(pastedText);
    }

    setParsedRows(rows);
    setIsProcessing(false);
  };

  const handleCommitUpload = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid student records to import.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Array<Omit<Student, 'id' | 'studentId'>> = validRows.map(r => ({
        fullName: r.fullName,
        gender: r.gender,
        classId: r.classId,
        className: r.className,
        dob: r.dob,
        dateOfBirth: r.dob,
        admissionDate: new Date().toISOString().split('T')[0],
        enrollmentDate: new Date().toISOString().split('T')[0],
        house: r.house,
        bloodGroup: r.bloodGroup,
        avatar: `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`,
        parentIds: [],
        emergencyContact: {
          name: r.emergencyContactName || 'Parent / Guardian',
          relationship: 'Guardian',
          phone: r.emergencyContactPhone || '+1 555-010-0000'
        },
        primaryContactPhone: r.emergencyContactPhone,
        status: 'Enrolled'
      }));

      const res = db.bulkCreateStudents(payload, currentUser);
      setIsSubmitting(false);
      onSuccess(res.count);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorBanner(`Import failed: ${err.message}`);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bulk Student Enrollment & Import
              </h2>
              <p className="text-xs text-slate-500">
                Streamline annual student intake via structured CSV or JSON spreadsheets
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
              title="Download CSV Template"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Template</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('json')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
              title="Download JSON Template"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorBanner && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Warning:</span> {errorBanner}
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveMode('file')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File (.csv / .json)
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Raw Data
            </button>
          </div>

          {/* Mode: File Upload Dropzone */}
          {activeMode === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all group relative cursor-pointer">
              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {fileName ? `Selected: ${fileName}` : 'Choose student roster file or drag & drop'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Supports official <strong>.CSV</strong> and <strong>.JSON</strong> format containing student names, class assignments, and guardian contacts.
              </p>
            </div>
          ) : (
            /* Mode: Paste Raw Data */
            <div className="space-y-3">
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste CSV rows or JSON student array here..."
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                onClick={handlePasteProcess}
                disabled={isProcessing || !pastedText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Parse & Validate Data</span>
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Validated Student Records ({parsedRows.length} total)
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold">
                    {validCount} Ready to Import
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[11px] font-bold">
                      {invalidCount} Needs Correction
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-500">
                  Target Term: <strong>2025/2026 Session</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] sticky top-0 bg-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Class Assignment</th>
                      <th className="py-2.5 px-3">House / Blood</th>
                      <th className="py-2.5 px-3">Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-700 font-bold text-[11px]" title={row.validationError}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.fullName}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.gender}</td>
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold text-[10px]">
                            {row.className}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {row.house || 'Blue'} • {row.bloodGroup || 'O+'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {row.emergencyContactName} ({row.emergencyContactPhone || 'No Phone'})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Automatic student IDs (e.g. STU-2026-XXX) and audit logs will be generated.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitUpload}
              disabled={isSubmitting || validCount === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrolling Students...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enroll {validCount} Students to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
