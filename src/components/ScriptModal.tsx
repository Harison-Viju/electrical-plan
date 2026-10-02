/**
 * ELS 1 (Electrical Layout Script) Bridge Modal
 * Comprehensive parser, diagnostics, real-time preview, and lossless export.
 */

import React, { useState, useEffect } from 'react';
import { DocumentState, ELSParseResult, LayoutObject } from '../types/layout';
import { parseELS, exportToELS, applyELS1Patches } from '../utils/elsParser';
import { REFERENCE_ELS, COMPLEX_HALL_ELS } from '../constants/presets';
import { Copy, Check, AlertTriangle, AlertCircle, CheckCircle2, Play, Code2 } from 'lucide-react';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentState;
  onApplyScript: (newObjects: LayoutObject[], mode: 'replace' | 'add') => void;
  onSetPreviewObjects: (objects: LayoutObject[] | null) => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  doc,
  onApplyScript,
  onSetPreviewObjects,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [scriptText, setScriptText] = useState(REFERENCE_ELS);
  const [importMode, setImportMode] = useState<'replace' | 'add'>('replace');
  const [parseResult, setParseResult] = useState<ELSParseResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync export text when opening or switching to export tab
  const [exportText, setExportText] = useState('');
  useEffect(() => {
    if (isOpen) {
      setExportText(exportToELS(doc));
    }
  }, [isOpen, doc]);

  // Clean up preview on close
  const handleClose = () => {
    onSetPreviewObjects(null);
    onClose();
  };

  // Preview Handler
  const handlePreview = () => {
    const result = parseELS(scriptText, doc.page);
    setParseResult(result);

    if (result.errors.length === 0) {
      if (result.mode === 'patch') {
        const patched = applyELS1Patches(
          result.patches,
          doc.objects,
          doc.objects.find(o => o.type === 'room')
        );
        onSetPreviewObjects([...patched, ...result.objects]);
      } else {
        const preview = importMode === 'add' ? [...doc.objects, ...result.objects] : result.objects;
        onSetPreviewObjects(preview);
      }
    } else {
      onSetPreviewObjects(null);
    }
  };

  // Apply Handler
  const handleApply = () => {
    const result = parseResult || parseELS(scriptText, doc.page);
    if (result.errors.length > 0) return;

    if (result.mode === 'patch') {
      const patched = applyELS1Patches(
        result.patches,
        doc.objects,
        doc.objects.find(o => o.type === 'room')
      );
      onApplyScript([...patched, ...result.objects], 'replace');
    } else {
      onApplyScript(result.objects, importMode);
    }

    onSetPreviewObjects(null);
    handleClose();
  };

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">ELS 1 Script Bridge</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-1.5 px-4 rounded-md transition-colors ${
              activeTab === 'import'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Script to Drawing (Import)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setExportText(exportToELS(doc));
            }}
            className={`py-1.5 px-4 rounded-md transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Drawing to Script (Export)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Paste or edit an <code>ELS 1</code> script below. Test with Preview before applying.
                </p>
                {/* Sample Presets */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScriptText(REFERENCE_ELS);
                      setParseResult(null);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Sample Hall
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setScriptText(COMPLEX_HALL_ELS);
                      setParseResult(null);
                    }}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Sample Complex
                  </button>
                </div>
              </div>

              {/* Script Textarea */}
              <div className="relative">
                <textarea
                  rows={12}
                  spellCheck={false}
                  value={scriptText}
                  onChange={e => {
                    setScriptText(e.target.value);
                    setParseResult(null);
                  }}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">Mode:</label>
                  <select
                    value={importMode}
                    onChange={e => setImportMode(e.target.value as any)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="replace">Replace Canvas Objects</option>
                    <option value="add">Add &amp; Merge to Canvas</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-800 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                    <span>Preview Script</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Drawing</span>
                  </button>
                </div>
              </div>

              {/* Syntax Quick Reference */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] space-y-1.5">
                <div className="font-bold text-slate-900 font-sans flex items-center justify-between">
                  <span>ELS 1 Syntax Quick Reference:</span>
                  <span className="text-[10px] text-blue-600 font-semibold font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                    house-v1
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                  <div>
                    <code className="text-blue-700 font-bold">divider h at 54% dashed</code>
                    <span className="text-slate-500 font-sans ml-1 text-[10px]">(horizontal)</span>
                  </div>
                  <div>
                    <code className="text-blue-700 font-bold">divider v at 40% dashed</code>
                    <span className="text-slate-500 font-sans ml-1 text-[10px]">(vertical)</span>
                  </div>
                  <div>
                    <code className="text-emerald-700">led x=15%,34% y=9%,19%</code>
                  </div>
                  <div>
                    <code className="text-purple-700">fan at 28%,40%</code>
                  </div>
                  <div>
                    <code className="text-amber-700">socket15 wall=right y=9%,18%</code>
                  </div>
                  <div>
                    <code className="text-amber-700">socket5 wall=top x=48%</code>
                  </div>
                  <div className="col-span-2">
                    <code className="text-slate-800">box "LED TV" at 17%,57% size 210x22 label=below</code>
                  </div>
                </div>
              </div>

              {/* Diagnostics & Report */}
              {parseResult && (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                  {parseResult.errors.length > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Cannot Apply - Syntax Errors:</span>
                      </div>
                      <ul className="list-disc pl-5 font-mono text-[11px] space-y-0.5">
                        {parseResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Script Parsed Successfully</span>
                      </div>
                      <p className="text-[11px] mt-1 font-mono">
                        Ready to apply: {parseResult.objects.length} elements (
                        {Object.entries(parseResult.counts)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(', ')}
                        )
                      </p>
                    </div>
                  )}

                  {parseResult.warnings.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Warnings:</span>
                      </div>
                      <ul className="list-disc pl-5 font-mono text-[11px] space-y-0.5">
                        {parseResult.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Export Tab */
            <div className="space-y-4">
              <p className="text-slate-600">
                This is the human-readable, lossless <code>ELS 1</code> script generated from your current drawing.
                Copy and share it or paste it into AI chat assistants for automated edits.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={14}
                  value={exportText}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(exportText)}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold flex items-center gap-2 shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
