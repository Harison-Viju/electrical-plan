/**
 * AutoCAD-Grade Properties Inspector & Group Alignment Tool
 * Solves the "Nothing selected" bug with reactive, reliable state bindings.
 */

import React from 'react';
import {
  DocumentState,
  LayoutObject,
  PageConfig,
  SymbolType,
} from '../types/layout';
import { LABELS, SYMBOL_SIZE } from '../constants/symbols';
import {
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignCenterVertical,
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  ArrowUp,
  ArrowDown,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  Eye,
  Sliders,
  FileText,
  Boxes,
  Grid,
} from 'lucide-react';

interface PropertiesPanelProps {
  doc: DocumentState;
  selectedIds: string[];
  onUpdateObject: (id: string, updates: Partial<LayoutObject>) => void;
  onUpdateGroup: (updater: (objects: LayoutObject[]) => LayoutObject[]) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onDeselect: () => void;
  onUpdatePage: (updates: Partial<PageConfig>) => void;
  onLoadPreset: (preset: 'reference' | 'complex' | 'blank') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  doc,
  selectedIds,
  onUpdateObject,
  onUpdateGroup,
  onDeleteSelected,
  onDuplicateSelected,
  onDeselect,
  onUpdatePage,
  onLoadPreset,
}) => {
  const selectedObjects = doc.objects.filter(o => selectedIds.includes(o.id));
  const isSingle = selectedObjects.length === 1;
  const isGroup = selectedObjects.length > 1;
  const primary = isSingle ? selectedObjects[0] : null;

  // Alignment Helpers for Group Selection
  const handleAlign = (
    type: 'left' | 'center-h' | 'right' | 'top' | 'middle-v' | 'bottom' | 'distribute-h' | 'distribute-v'
  ) => {
    if (selectedObjects.length < 2) return;

    onUpdateGroup(objects => {
      const selected = objects.filter(o => selectedIds.includes(o.id));
      let minX = Math.min(...selected.map(o => o.x));
      let maxX = Math.max(...selected.map(o => o.x + o.w));
      let minY = Math.min(...selected.map(o => o.y));
      let maxY = Math.max(...selected.map(o => o.y + o.h));
      let centerX = minX + (maxX - minX) / 2;
      let centerY = minY + (maxY - minY) / 2;

      return objects.map(o => {
        if (!selectedIds.includes(o.id)) return o;

        if (type === 'left') return { ...o, x: minX };
        if (type === 'center-h') return { ...o, x: centerX - o.w / 2 };
        if (type === 'right') return { ...o, x: maxX - o.w };
        if (type === 'top') return { ...o, y: minY };
        if (type === 'middle-v') return { ...o, y: centerY - o.h / 2 };
        if (type === 'bottom') return { ...o, y: maxY - o.h };
        return o;
      });
    });
  };

  // Reorder z-index for single or multiple selected objects
  const handleZOrder = (direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedIds.length === 0) return;

    onUpdateGroup(objects => {
      const copy = [...objects];

      if (direction === 'front') {
        const unselected = copy.filter(o => !selectedIds.includes(o.id));
        const selected = copy.filter(o => selectedIds.includes(o.id));
        return [...unselected, ...selected];
      }

      if (direction === 'back') {
        const unselected = copy.filter(o => !selectedIds.includes(o.id));
        const selected = copy.filter(o => selectedIds.includes(o.id));
        return [...selected, ...unselected];
      }

      if (direction === 'forward') {
        for (let i = copy.length - 2; i >= 0; i--) {
          if (selectedIds.includes(copy[i].id) && !selectedIds.includes(copy[i + 1].id)) {
            const temp = copy[i];
            copy[i] = copy[i + 1];
            copy[i + 1] = temp;
          }
        }
        return copy;
      }

      if (direction === 'backward') {
        for (let i = 1; i < copy.length; i++) {
          if (selectedIds.includes(copy[i].id) && !selectedIds.includes(copy[i - 1].id)) {
            const temp = copy[i];
            copy[i] = copy[i - 1];
            copy[i - 1] = temp;
          }
        }
        return copy;
      }

      return copy;
    });
  };

  // Quick Rotate
  const handleQuickRotate = (degDelta: number) => {
    if (isSingle && primary) {
      const newRot = ((primary.rotation || 0) + degDelta + 360) % 360;
      onUpdateObject(primary.id, { rotation: newRot });
    } else if (isGroup) {
      onUpdateGroup(objects =>
        objects.map(o =>
          selectedIds.includes(o.id)
            ? { ...o, rotation: ((o.rotation || 0) + degDelta + 360) % 360 }
            : o
        )
      );
    }
  };

  // 1. Single Object Selected
  if (isSingle && primary) {
    const objTypeLabel =
      primary.type === 'symbol' && primary.symbol
        ? LABELS[primary.symbol]
        : primary.type.toUpperCase();

    return (
      <aside className="w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col shadow-sm text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
              {primary.type}
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">{objTypeLabel}</h2>
          </div>
          <button
            onClick={onDeselect}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50"
            title="Deselect (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5 text-xs">
          {/* Label / Text Editor */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>{primary.type === 'room' ? 'Room Name' : 'Text / Label'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Enter for newline</span>
            </label>
            <textarea
              rows={primary.type === 'box' || primary.type === 'room' ? 3 : 2}
              value={primary.label ?? primary.name ?? ''}
              onChange={e => {
                const val = e.target.value;
                if (primary.type === 'room') {
                  onUpdateObject(primary.id, { name: val, label: val });
                } else {
                  onUpdateObject(primary.id, { label: val });
                }
              }}
              placeholder="e.g. LED TV, AIR CURTAIN, Hall"
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          {/* Box specific: label position */}
          {primary.type === 'box' && (
            <div className="space-y-2">
              <label className="block font-semibold text-slate-600">Label Position</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['inside', 'below', 'above'] as const).map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => onUpdateObject(primary.id, { labelPos: pos })}
                    className={`py-1.5 text-center font-medium rounded border ${
                      (primary.labelPos || 'inside') === pos
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Position (X, Y) */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-600 block">Position (px / mm)</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">X</label>
                <input
                  type="number"
                  value={Math.round(primary.x)}
                  onChange={e => onUpdateObject(primary.id, { x: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Y</label>
                <input
                  type="number"
                  value={Math.round(primary.y)}
                  onChange={e => onUpdateObject(primary.id, { y: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dimensions (Width, Height) & Proportional Scaling */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-600 block">Dimensions</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateObject(primary.id, {
                    aspectRatioLocked: !primary.aspectRatioLocked,
                  })
                }
                className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 transition-colors ${
                  primary.aspectRatioLocked
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle Proportional Scaling (Lock Aspect Ratio)"
              >
                {primary.aspectRatioLocked ? (
                  <>
                    <Lock className="w-3 h-3 text-blue-600" />
                    <span>Proportional</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-slate-400" />
                    <span>Free Scale</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Width</label>
                <input
                  type="number"
                  min={10}
                  value={Math.round(primary.w)}
                  onChange={e => {
                    const newW = Math.max(10, Number(e.target.value));
                    if (primary.aspectRatioLocked && primary.w > 0) {
                      const ratio = primary.h / primary.w;
                      onUpdateObject(primary.id, { w: newW, h: Math.max(8, Math.round(newW * ratio)) });
                    } else {
                      onUpdateObject(primary.id, { w: newW });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Height</label>
                <input
                  type="number"
                  min={2}
                  value={Math.round(primary.h)}
                  onChange={e => {
                    const newH = Math.max(2, Number(e.target.value));
                    if (primary.aspectRatioLocked && primary.h > 0) {
                      const ratio = primary.w / primary.h;
                      onUpdateObject(primary.id, { h: newH, w: Math.max(8, Math.round(newH * ratio)) });
                    } else {
                      onUpdateObject(primary.id, { h: newH });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-600">Rotation</span>
              <span className="font-mono text-blue-600 font-bold">{primary.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              value={primary.rotation || 0}
              onChange={e => onUpdateObject(primary.id, { rotation: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickRotate(-90)}
                className="flex-1 py-1 px-2 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" /> -90°
              </button>
              <button
                type="button"
                onClick={() => handleQuickRotate(90)}
                className="flex-1 py-1 px-2 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 font-medium"
              >
                <RotateCw className="w-3 h-3" /> +90°
              </button>
              <button
                type="button"
                onClick={() => handleQuickRotate(180)}
                className="flex-1 py-1 px-2 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
              >
                180°
              </button>
            </div>
          </div>

          {/* Symbol Specific: Quick Symbol Switcher */}
          {primary.type === 'symbol' && (
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-600 block">Switch Symbol</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['led', 'fan', 'socket15', 'socket5'] as SymbolType[]).map(s => {
                  const isActive = primary.symbol === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const [defW, defH] = SYMBOL_SIZE[s];
                        onUpdateObject(primary.id, { symbol: s, w: defW, h: defH });
                      }}
                      className={`p-1.5 border rounded text-left ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Box Specific: Border Style */}
          {primary.type === 'box' && (
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-600 block">Border Style</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['solid', 'dashed', 'double'] as const).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onUpdateObject(primary.id, { borderStyle: b })}
                    className={`py-1 text-center font-medium rounded border ${
                      (primary.borderStyle || 'solid') === b
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider Specific: Orientation & Dashed */}
          {primary.type === 'divider' && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-600 block">Divider Line Style</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateObject(primary.id, {
                      orientation: primary.orientation === 'v' ? 'h' : 'v',
                      w: primary.orientation === 'v' ? 400 : 2,
                      h: primary.orientation === 'v' ? 2 : 400,
                    })
                  }
                  className="flex-1 py-1.5 border border-slate-200 rounded font-medium hover:bg-slate-50"
                >
                  Orientation: {primary.orientation === 'v' ? 'Vertical' : 'Horizontal'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateObject(primary.id, { dashed: !primary.dashed })}
                  className="py-1.5 px-3 border border-slate-200 rounded font-medium hover:bg-slate-50"
                >
                  {primary.dashed !== false ? 'Dashed' : 'Solid'}
                </button>
              </div>
            </div>
          )}

          {/* Z-Index (Layer Ordering) - Bring to Front & Send to Back */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Z-Index (Layer Order)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                Layer {doc.objects.findIndex(o => o.id === primary.id) + 1} of {doc.objects.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleZOrder('front')}
                className="py-2 px-2.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-slate-800 hover:text-blue-700 flex items-center justify-center gap-1.5 font-bold shadow-xs transition-colors"
                title="Bring to Front (Move to top layer so nested items are easily clicked)"
              >
                <BringToFront className="w-4 h-4 text-blue-600" />
                <span>Bring to Front</span>
              </button>
              <button
                type="button"
                onClick={() => handleZOrder('back')}
                className="py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded text-slate-800 flex items-center justify-center gap-1.5 font-bold shadow-xs transition-colors"
                title="Send to Back (Place large rooms/boxes in the background)"
              >
                <SendToBack className="w-4 h-4 text-slate-600" />
                <span>Send to Back</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleZOrder('forward')}
                className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 flex items-center justify-center gap-1 text-[11px] font-medium"
                title="Bring Forward (+1 layer)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Forward (+1)</span>
              </button>
              <button
                type="button"
                onClick={() => handleZOrder('backward')}
                className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 flex items-center justify-center gap-1 text-[11px] font-medium"
                title="Send Backward (-1 layer)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Backward (-1)</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Tip: Use <strong>Bring to Front</strong> to easily select small boxes or symbols nested inside larger boxes.
            </p>
          </div>

          {/* Actions: Duplicate & Delete */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="w-full py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" /> Duplicate Object
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="w-full py-2 bg-red-50 border border-red-200 rounded text-red-600 font-semibold hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Object
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Multiple Objects Selected (Group Alignment & Transform)
  if (isGroup) {
    return (
      <aside className="w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col shadow-sm text-slate-800">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
              Multi-Select
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {selectedObjects.length} Objects Selected
            </h2>
          </div>
          <button
            onClick={onDeselect}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50"
            title="Deselect"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5 text-xs">
          {/* Alignment Tools (AutoCAD Style) */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block">AutoCAD Alignment Tools</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleAlign('left')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4 text-slate-700" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlign('center-h')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Horizontal Center"
              >
                <AlignCenterHorizontal className="w-4 h-4 text-slate-700" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlign('right')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Right"
              >
                <AlignRight className="w-4 h-4 text-slate-700" />
                <span>Right</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlign('top')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Top"
              >
                <ArrowUp className="w-4 h-4 text-slate-700" />
                <span>Top</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlign('middle-v')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Vertical Middle"
              >
                <AlignCenterVertical className="w-4 h-4 text-slate-700" />
                <span>Middle</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlign('bottom')}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 flex flex-col items-center gap-1 text-[11px]"
                title="Align Bottom"
              >
                <ArrowDown className="w-4 h-4 text-slate-700" />
                <span>Bottom</span>
              </button>
            </div>
          </div>

          {/* Group Rotation */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block">Group Rotation</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickRotate(-90)}
                className="flex-1 py-1.5 border border-slate-200 rounded font-medium hover:bg-slate-50 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> -90°
              </button>
              <button
                type="button"
                onClick={() => handleQuickRotate(90)}
                className="flex-1 py-1.5 border border-slate-200 rounded font-medium hover:bg-slate-50 flex items-center justify-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" /> +90°
              </button>
            </div>
          </div>

          {/* Group Z-Index (Layer Ordering) - Bring to Front & Send to Back */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Z-Index (Layer Order)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {selectedObjects.length} items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleZOrder('front')}
                className="py-2 px-2.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-slate-800 hover:text-blue-700 flex items-center justify-center gap-1.5 font-bold shadow-xs transition-colors"
                title="Bring All Selected Objects to Front"
              >
                <BringToFront className="w-4 h-4 text-blue-600" />
                <span>Bring to Front</span>
              </button>
              <button
                type="button"
                onClick={() => handleZOrder('back')}
                className="py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded text-slate-800 flex items-center justify-center gap-1.5 font-bold shadow-xs transition-colors"
                title="Send All Selected Objects to Back"
              >
                <SendToBack className="w-4 h-4 text-slate-600" />
                <span>Send to Back</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleZOrder('forward')}
                className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 flex items-center justify-center gap-1 text-[11px] font-medium"
                title="Bring Group Forward (+1 layer)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Forward (+1)</span>
              </button>
              <button
                type="button"
                onClick={() => handleZOrder('backward')}
                className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 flex items-center justify-center gap-1 text-[11px] font-medium"
                title="Send Group Backward (-1 layer)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Backward (-1)</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="w-full py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" /> Duplicate Group
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="w-full py-2 bg-red-50 border border-red-200 rounded text-red-600 font-semibold hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Group
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 3. Nothing Selected: Drawing Properties & Canvas Presets
  const counts = {
    led: doc.objects.filter(o => o.type === 'symbol' && o.symbol === 'led').length,
    fan: doc.objects.filter(o => o.type === 'symbol' && o.symbol === 'fan').length,
    socket15: doc.objects.filter(o => o.type === 'symbol' && o.symbol === 'socket15').length,
    socket5: doc.objects.filter(o => o.type === 'symbol' && o.symbol === 'socket5').length,
    box: doc.objects.filter(o => o.type === 'box').length,
    room: doc.objects.filter(o => o.type === 'room').length,
    divider: doc.objects.filter(o => o.type === 'divider').length,
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col shadow-sm text-slate-800">
      <div className="p-4 border-b border-slate-100 bg-slate-50/80">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Drawing Inspector
        </span>
        <h2 className="text-base font-bold text-slate-900 mt-1">Plan &amp; Quantities</h2>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Helper Note */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
          <p className="font-semibold mb-1">Canvas Ready</p>
          <p className="text-[11px] leading-relaxed text-blue-700">
            Click any symbol, box, or room on the canvas to inspect and resize it, or drag across the drawing to group-select multiple objects.
          </p>
        </div>

        {/* Bill of Quantities / Statistics */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-700 block">Electrical Symbols Count</span>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">LED Lights</span>
              <span className="font-bold text-blue-600 text-sm">{counts.led}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">Ceiling Fans</span>
              <span className="font-bold text-blue-600 text-sm">{counts.fan}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">15 A Sockets</span>
              <span className="font-bold text-blue-600 text-sm">{counts.socket15}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">5 A Sockets</span>
              <span className="font-bold text-blue-600 text-sm">{counts.socket5}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">Boxes (TV/AC)</span>
              <span className="font-bold text-slate-800 text-sm">{counts.box}</span>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50 flex justify-between items-center">
              <span className="text-slate-600 font-sans text-[11px]">Rooms / Div</span>
              <span className="font-bold text-slate-800 text-sm">{counts.room + counts.divider}</span>
            </div>
          </div>
        </div>

        {/* Paper & Layout Dimensions */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-700 block">Page Configuration</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Sheet Size</label>
              <select
                value={doc.page.size}
                onChange={e => onUpdatePage({ size: e.target.value as any })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A3">A3 (Architectural)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Orientation</label>
              <select
                value={doc.page.orientation}
                onChange={e => {
                  const isPortrait = e.target.value === 'portrait';
                  onUpdatePage({
                    orientation: isPortrait ? 'portrait' : 'landscape',
                    w: isPortrait ? 800 : 1130,
                    h: isPortrait ? 1130 : 800,
                  });
                }}
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preset Templates */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="font-semibold text-slate-700 block">Layout Presets</span>
          <button
            type="button"
            onClick={() => onLoadPreset('reference')}
            className="w-full py-2 px-3 border border-slate-200 rounded hover:bg-slate-50 text-left font-medium flex items-center justify-between"
          >
            <span>Reference Electrical Hall</span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Standard</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('complex')}
            className="w-full py-2 px-3 border border-slate-200 rounded hover:bg-slate-50 text-left font-medium flex items-center justify-between"
          >
            <span>Multi-Room Complex Plan</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Complex</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('blank')}
            className="w-full py-2 px-3 border border-slate-200 rounded hover:bg-slate-50 text-left font-medium text-slate-600"
          >
            Start New Blank Layout
          </button>
        </div>
      </div>
    </aside>
  );
};
