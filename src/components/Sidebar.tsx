/**
 * AutoCAD-Style Tools Palette and Objects/Layers Tree Inspector
 */

import React, { useState } from 'react';
import { DocumentState, LayoutObject, SymbolType, ToolType } from '../types/layout';
import { LABELS, SYMBOL_SIZE } from '../constants/symbols';
import { SymbolGraphic } from './SvgObject';
import {
  MousePointer,
  Square,
  Minus,
  Maximize2,
  Type,
  ListTree,
  Columns,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  FolderTree,
  Layers,
  Sparkles,
  Compass,
  FileCode2,
} from 'lucide-react';

interface SidebarProps {
  tool: ToolType;
  onSetTool: (tool: ToolType) => void;
  doc: DocumentState;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onOpenScriptModal: () => void;
  onOpenAiHelper: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tool,
  onSetTool,
  doc,
  selectedIds,
  onSelect,
  onToggleLock,
  onToggleHide,
  onDeleteObject,
  onOpenScriptModal,
  onOpenAiHelper,
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'layers'>('tools');

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col select-none">
      {/* Sidebar Tabs: Tools vs Layers */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'tools'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'layers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Objects ({doc.objects.length})</span>
        </button>
      </div>

      {activeTab === 'tools' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
          {/* Default Selector */}
          <div>
            <button
              type="button"
              onClick={() => onSetTool('select')}
              className={`w-full py-2 px-3 rounded-md flex items-center gap-2.5 font-bold transition-all ${
                tool === 'select'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <MousePointer className="w-4 h-4 text-blue-300" />
              <span>AutoCAD Select &amp; Move (V)</span>
            </button>
          </div>

          {/* Section 1: house-v1 Reference Symbols */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Reference Symbols</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">
                house-v1
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['led', 'fan', 'socket15', 'socket5'] as SymbolType[]).map(sym => {
                const isActive = tool === `symbol:${sym}`;
                const [w, h] = SYMBOL_SIZE[sym];
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => onSetTool(`symbol:${sym}`)}
                    className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-2 border text-center transition-all ${
                      isActive
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-inner ring-1 ring-blue-400'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
                        <SymbolGraphic symbol={sym} w={w} h={h} />
                      </svg>
                    </div>
                    <span className="font-semibold text-[11px]">{LABELS[sym]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Room Complex & Architectural Drawing Elements */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Room Complex &amp; Plan</span>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onSetTool('room')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'room'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Square className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="font-semibold">Room Rectangle</div>
                  <div className="text-[10px] text-slate-400">Hall, Bedroom, Kitchen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('divider')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'divider'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Minus className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold">Partition Divider</div>
                  <div className="text-[10px] text-slate-400">Dashed / Solid boundary line</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('box')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'box'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Maximize2 className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <div className="font-semibold">Appliance Box (8-Way Resize)</div>
                  <div className="text-[10px] text-slate-400">LED TV, Air Curtain, DB Panel</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('door')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'door'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <div className="text-left">
                  <div className="font-semibold">Door &amp; 90° Swing Arc</div>
                  <div className="text-[10px] text-slate-400">Architectural room entry</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('dimension')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'dimension'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Columns className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="font-semibold">Dimension Marker</div>
                  <div className="text-[10px] text-slate-400">Linear measurement line</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('text')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'text'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Type className="w-4 h-4 text-indigo-400" />
                <div className="text-left">
                  <div className="font-semibold">Text Annotation</div>
                  <div className="text-[10px] text-slate-400">Custom plan labels</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTool('legend')}
                className={`w-full p-2 rounded-md flex items-center gap-2.5 border transition-all ${
                  tool === 'legend'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <ListTree className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <div className="font-semibold">Reference Legend Table</div>
                  <div className="text-[10px] text-slate-400">Auto symbols key table</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Script & AI Assistant Bridge */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Script Bridge
            </div>
            <button
              type="button"
              onClick={onOpenScriptModal}
              className="w-full py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCode2 className="w-4 h-4" />
              <span>ELS 1 Script Editor</span>
            </button>
            <button
              type="button"
              onClick={onOpenAiHelper}
              className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-md flex items-center justify-center gap-2 border border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Prompt Templates</span>
            </button>
          </div>
        </div>
      ) : (
        /* Objects & Layers Hierarchy Inspector */
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          <div className="px-2 py-1 text-[11px] text-slate-400 font-semibold flex justify-between items-center">
            <span>Drawing Hierarchy</span>
            <span className="font-mono text-[10px]">{doc.objects.length} total</span>
          </div>

          {doc.objects.length === 0 ? (
            <div className="p-4 text-center text-slate-500">No objects on canvas yet.</div>
          ) : (
            doc.objects
              .slice()
              .reverse()
              .map((obj, revIdx) => {
                const isSelected = selectedIds.includes(obj.id);
                const label =
                  obj.label ||
                  obj.name ||
                  (obj.type === 'symbol' && obj.symbol ? LABELS[obj.symbol] : obj.type);

                return (
                  <div
                    key={obj.id}
                    onClick={e => {
                      if (e.shiftKey) {
                        onSelect(
                          isSelected
                            ? selectedIds.filter(id => id !== obj.id)
                            : [...selectedIds, obj.id]
                        );
                      } else {
                        onSelect([obj.id]);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded flex items-center justify-between gap-2 cursor-pointer border transition-colors ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-slate-800/40 border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                        {obj.type === 'symbol' ? obj.symbol : obj.type}
                      </span>
                      <span className="truncate font-medium text-[11px]" title={label}>
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleHide(obj.id);
                        }}
                        className="p-1 hover:text-slate-100"
                        title={obj.hidden ? 'Show' : 'Hide'}
                      >
                        {obj.hidden ? (
                          <EyeOff className="w-3 h-3 text-red-400" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleLock(obj.id);
                        }}
                        className="p-1 hover:text-slate-100"
                        title={obj.locked ? 'Unlock' : 'Lock'}
                      >
                        {obj.locked ? (
                          <Lock className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteObject(obj.id);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </aside>
  );
};
