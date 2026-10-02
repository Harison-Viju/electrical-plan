/**
 * Professional CAD Studio Top Navigation Bar
 */

import React from 'react';
import {
  Undo2,
  Redo2,
  Grid,
  Magnet,
  Sparkles,
  Download,
  Share2,
  FileCode2,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutTemplate,
} from 'lucide-react';

interface NavbarProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  gridEnabled: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  onResetZoom: () => void;
  onTidyLayout: () => void;
  onOpenScriptModal: () => void;
  onOpenExportModal: () => void;
  onLoadPreset: (preset: 'reference' | 'complex' | 'blank') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  gridEnabled,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  zoom,
  onSetZoom,
  onResetZoom,
  onTidyLayout,
  onOpenScriptModal,
  onOpenExportModal,
  onLoadPreset,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-white px-4 flex items-center justify-between select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
          CAD
        </div>
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={e => onUpdateTitle(e.target.value)}
              className="bg-transparent hover:bg-slate-800 focus:bg-slate-800 px-2 py-0.5 rounded text-sm font-bold text-white border border-transparent focus:border-blue-500 focus:outline-none w-56 truncate"
              placeholder="Electrical Drawing Title"
            />
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
              house-v1
            </span>
          </div>
        </div>
      </div>

      {/* Middle CAD Actions */}
      <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        {/* Grid & Snap */}
        <button
          type="button"
          onClick={onToggleGrid}
          className={`px-2 py-1 rounded flex items-center gap-1 font-semibold ${
            gridEnabled ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Grid (G)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <button
          type="button"
          onClick={onToggleSnap}
          className={`px-2 py-1 rounded flex items-center gap-1 font-semibold ${
            snapEnabled ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Snap (S)"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Snap</span>
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        {/* Zoom Controls */}
        <button
          type="button"
          onClick={() => onSetZoom(Math.max(0.4, zoom - 0.1))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-semibold"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => onSetZoom(Math.min(3.0, zoom + 0.1))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        {/* Tidy Layout */}
        <button
          type="button"
          onClick={onTidyLayout}
          className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 font-medium"
          title="Snap aligned symbols to common coordinate axes"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tidy Layout</span>
        </button>
      </div>

      {/* Right Actions: Script Bridge & Export */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onOpenScriptModal}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <FileCode2 className="w-4 h-4 text-blue-400" />
          <span>Script Bridge</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export / Share</span>
        </button>
      </div>
    </header>
  );
};
