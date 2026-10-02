/**
 * Export and Backup Dialog (SVG, PNG, JSON Backup & Restore, Print/PDF)
 */

import React, { useRef, useState } from 'react';
import { DocumentState } from '../types/layout';
import { exportSVG, exportPNG, exportJSON } from '../utils/export';
import {
  FileCode,
  Image,
  FileJson,
  Printer,
  Upload,
  Share2,
  Check,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentState;
  onImportDocument: (importedDoc: DocumentState) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  doc,
  onImportDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getSvgEl = () => {
    return document.querySelector('svg[aria-label="Electrical CAD Canvas"]') as SVGSVGElement | null;
  };

  const handleExportSVG = () => {
    const el = getSvgEl();
    if (!el) return;
    exportSVG(el, doc.title || 'electrical-layout', doc.page.w, doc.page.h);
    showToast('SVG file downloaded');
  };

  const handleExportPNG = () => {
    const el = getSvgEl();
    if (!el) return;
    exportPNG(el, doc.title || 'electrical-layout', doc.page.w, doc.page.h, 2.5);
    showToast('High-resolution PNG downloaded');
  };

  const handleExportJSON = () => {
    exportJSON(doc, doc.title || 'electrical-layout-backup');
    showToast('JSON backup downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.objects)) {
          onImportDocument(parsed);
          showToast('Drawing restored from JSON');
          onClose();
        } else {
          alert('Invalid drawing JSON file.');
        }
      } catch {
        alert('Could not parse the selected JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">Export &amp; Backup Layout</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Export your professional architectural layout in standard formats, or save a complete JSON backup to restore later.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* SVG */}
            <button
              type="button"
              onClick={handleExportSVG}
              className="p-3.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 flex items-start gap-3 text-left transition-all group"
            >
              <FileCode className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <div>
                <strong className="block text-slate-900 font-bold">Vector SVG</strong>
                <span className="text-[11px] text-slate-500">Lossless CAD vector file</span>
              </div>
            </button>

            {/* PNG */}
            <button
              type="button"
              onClick={handleExportPNG}
              className="p-3.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 flex items-start gap-3 text-left transition-all group"
            >
              <Image className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div>
                <strong className="block text-slate-900 font-bold">High-Res PNG</strong>
                <span className="text-[11px] text-slate-500">2.5× crisp client image</span>
              </div>
            </button>

            {/* JSON Backup */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-3.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 flex items-start gap-3 text-left transition-all group"
            >
              <FileJson className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
              <div>
                <strong className="block text-slate-900 font-bold">JSON Backup</strong>
                <span className="text-[11px] text-slate-500">Full workspace archive</span>
              </div>
            </button>

            {/* Print / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-3.5 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 flex items-start gap-3 text-left transition-all group"
            >
              <Printer className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
              <div>
                <strong className="block text-slate-900 font-bold">Print / PDF</strong>
                <span className="text-[11px] text-slate-500">Print dialog or Save PDF</span>
              </div>
            </button>
          </div>

          {/* Import JSON */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Have a saved JSON layout?</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-3 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import JSON Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-2.5 bg-emerald-600 text-white text-xs text-center font-semibold flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
