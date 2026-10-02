/**
 * AutoCAD-Grade Electrical Layout CAD & ELS Studio
 * Production Application Root
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DocumentState,
  LayoutObject,
  PageConfig,
  ToolType,
} from './types/layout';
import {
  getInitialDocument,
  getComplexHallDocument,
} from './constants/presets';
import { DEFAULTS, LABELS, SYMBOL_SIZE } from './constants/symbols';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ScriptModal } from './components/ScriptModal';
import { ExportModal } from './components/ExportModal';
import { AiHelperModal } from './components/AiHelperModal';

const STORAGE_KEY = 'electrical-layout-cad-doc-v3';

export default function App() {
  // Document State
  const [doc, setDoc] = useState<DocumentState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.objects)) {
          return parsed;
        }
      }
    } catch {}
    return getInitialDocument();
  });

  // Selection & Tool State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<ToolType>('select');

  // Canvas Viewport State
  const [zoom, setZoom] = useState<number>(0.9);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);

  // Modals
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const [previewObjects, setPreviewObjects] = useState<LayoutObject[] | null>(null);

  // Undo / Redo History
  const historyRef = useRef<DocumentState[]>([]);
  const futureRef = useRef<DocumentState[]>([]);
  const [, setHistoryVersion] = useState(0);

  // Autosave to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [doc]);

  // Record History Snapshot
  const recordHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(doc)));
    if (historyRef.current.length > 60) {
      historyRef.current.shift();
    }
    futureRef.current = [];
    setHistoryVersion(v => v + 1);
  }, [doc]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    futureRef.current.push(JSON.parse(JSON.stringify(doc)));
    setDoc(prev);
    setSelectedIds([]);
    setHistoryVersion(v => v + 1);
  }, [doc]);

  // Redo
  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(JSON.parse(JSON.stringify(doc)));
    setDoc(next);
    setSelectedIds([]);
    setHistoryVersion(v => v + 1);
  }, [doc]);

  // Update multiple objects with optional history recording
  const handleUpdateObjects = useCallback(
    (updater: (prev: LayoutObject[]) => LayoutObject[], shouldRecordHistory = false) => {
      if (shouldRecordHistory) {
        recordHistory();
      }
      setDoc(prev => ({
        ...prev,
        objects: updater(prev.objects),
      }));
    },
    [recordHistory]
  );

  // Update a single object
  const handleUpdateObject = useCallback(
    (id: string, updates: Partial<LayoutObject>) => {
      recordHistory();
      setDoc(prev => ({
        ...prev,
        objects: prev.objects.map(o => (o.id === id ? { ...o, ...updates } : o)),
      }));
    },
    [recordHistory]
  );

  // Update group of objects
  const handleUpdateGroup = useCallback(
    (groupUpdater: (objects: LayoutObject[]) => LayoutObject[]) => {
      recordHistory();
      setDoc(prev => ({
        ...prev,
        objects: groupUpdater(prev.objects),
      }));
    },
    [recordHistory]
  );

  // Delete selected objects
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    recordHistory();
    setDoc(prev => ({
      ...prev,
      objects: prev.objects.filter(o => !selectedIds.includes(o.id)),
    }));
    setSelectedIds([]);
  }, [selectedIds, recordHistory]);

  // Duplicate selected objects
  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    recordHistory();
    const newItems: LayoutObject[] = [];
    const newIds: string[] = [];

    doc.objects.forEach(o => {
      if (selectedIds.includes(o.id)) {
        const copy: LayoutObject = {
          ...JSON.parse(JSON.stringify(o)),
          id: `obj_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          x: o.x + 30,
          y: o.y + 30,
        };
        newItems.push(copy);
        newIds.push(copy.id);
      }
    });

    setDoc(prev => ({
      ...prev,
      objects: [...prev.objects, ...newItems],
    }));
    setSelectedIds(newIds);
  }, [selectedIds, doc.objects, recordHistory]);

  // Toggle Lock
  const handleToggleLock = useCallback(
    (id: string) => {
      recordHistory();
      setDoc(prev => ({
        ...prev,
        objects: prev.objects.map(o => (o.id === id ? { ...o, locked: !o.locked } : o)),
      }));
    },
    [recordHistory]
  );

  // Toggle Hide
  const handleToggleHide = useCallback(
    (id: string) => {
      recordHistory();
      setDoc(prev => ({
        ...prev,
        objects: prev.objects.map(o => (o.id === id ? { ...o, hidden: !o.hidden } : o)),
      }));
    },
    [recordHistory]
  );

  // Toggle Aspect Ratio Lock (Proportional Scaling)
  const handleToggleAspectLock = useCallback(
    (id: string) => {
      recordHistory();
      setDoc(prev => ({
        ...prev,
        objects: prev.objects.map(o =>
          o.id === id ? { ...o, aspectRatioLocked: !o.aspectRatioLocked } : o
        ),
      }));
    },
    [recordHistory]
  );

  // Reorder z-index for selected objects
  const handleZOrder = useCallback(
    (direction: 'front' | 'back' | 'forward' | 'backward') => {
      if (selectedIds.length === 0) return;
      recordHistory();
      setDoc(prev => {
        const copy = [...prev.objects];
        if (direction === 'front') {
          const unselected = copy.filter(o => !selectedIds.includes(o.id));
          const selected = copy.filter(o => selectedIds.includes(o.id));
          return { ...prev, objects: [...unselected, ...selected] };
        }
        if (direction === 'back') {
          const unselected = copy.filter(o => !selectedIds.includes(o.id));
          const selected = copy.filter(o => selectedIds.includes(o.id));
          return { ...prev, objects: [...selected, ...unselected] };
        }
        if (direction === 'forward') {
          for (let i = copy.length - 2; i >= 0; i--) {
            if (selectedIds.includes(copy[i].id) && !selectedIds.includes(copy[i + 1].id)) {
              const temp = copy[i];
              copy[i] = copy[i + 1];
              copy[i + 1] = temp;
            }
          }
          return { ...prev, objects: copy };
        }
        if (direction === 'backward') {
          for (let i = 1; i < copy.length; i++) {
            if (selectedIds.includes(copy[i].id) && !selectedIds.includes(copy[i - 1].id)) {
              const temp = copy[i];
              copy[i] = copy[i - 1];
              copy[i - 1] = temp;
            }
          }
          return { ...prev, objects: copy };
        }
        return prev;
      });
    },
    [selectedIds, recordHistory]
  );

  // Tidy Layout: Auto align nearby symbols
  const handleTidyLayout = useCallback(() => {
    const room = doc.objects.find(o => o.type === 'room');
    const tol = (room?.w || 700) * 0.02; // 2% tolerance
    recordHistory();

    setDoc(prev => {
      const syms = prev.objects.filter(o => o.type === 'symbol');
      for (const a of syms) {
        for (const b of syms) {
          if (a.id === b.id) continue;
          if (Math.abs(a.x - b.x) < tol) a.x = b.x;
          if (Math.abs(a.y - b.y) < tol) a.y = b.y;
        }
      }
      return { ...prev };
    });
  }, [doc.objects, recordHistory]);

  // Load Preset
  const handleLoadPreset = (preset: 'reference' | 'complex' | 'blank') => {
    recordHistory();
    if (preset === 'reference') {
      const refDoc = getInitialDocument();
      setDoc(refDoc);
    } else if (preset === 'complex') {
      const compDoc = getComplexHallDocument();
      setDoc(compDoc);
    } else if (preset === 'blank') {
      setDoc({
        version: 1,
        symbolSet: 'house-v1',
        title: 'New Blank Electrical Layout',
        page: { ...DEFAULTS.page },
        objects: [
          {
            id: 'room_1',
            type: 'room',
            ...DEFAULTS.room,
            x: 50,
            y: 80,
            w: 700,
            h: 960,
            rotation: 0,
          },
        ],
      });
    }
    setSelectedIds([]);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);
      if (isInput) return;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(doc.objects.map(o => o.id));
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Z-Order: Bring to Front (Ctrl+Shift+]) / Bring Forward (Ctrl+])
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '}')) {
        e.preventDefault();
        handleZOrder(e.shiftKey ? 'front' : 'forward');
        return;
      }

      // Z-Order: Send to Back (Ctrl+Shift+[) / Send Backward (Ctrl+[)
      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === '{')) {
        e.preventDefault();
        handleZOrder(e.shiftKey ? 'back' : 'backward');
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIds([]);
        setTool('select');
        return;
      }

      // Quick tools
      if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'g') {
        setGridEnabled(prev => !prev);
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        setSnapEnabled(prev => !prev);
      }

      // Nudge with Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        handleUpdateObjects(prev =>
          prev.map(o => (selectedIds.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o)),
          true
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    handleDeleteSelected,
    handleZOrder,
    handleUpdateObjects,
    selectedIds,
    doc.objects,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        title={doc.title}
        onUpdateTitle={title => setDoc(prev => ({ ...prev, title }))}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        gridEnabled={gridEnabled}
        onToggleGrid={() => setGridEnabled(prev => !prev)}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(prev => !prev)}
        zoom={zoom}
        onSetZoom={setZoom}
        onResetZoom={() => {
          setZoom(0.9);
          setPanOffset({ x: 0, y: 0 });
        }}
        onTidyLayout={handleTidyLayout}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onLoadPreset={handleLoadPreset}
      />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Tools & Layers */}
        <Sidebar
          tool={tool}
          onSetTool={setTool}
          doc={doc}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onToggleLock={handleToggleLock}
          onToggleHide={handleToggleHide}
          onDeleteObject={id => {
            recordHistory();
            setDoc(prev => ({ ...prev, objects: prev.objects.filter(o => o.id !== id) }));
            setSelectedIds(prev => prev.filter(x => x !== id));
          }}
          onOpenScriptModal={() => setIsScriptModalOpen(true)}
          onOpenAiHelper={() => setIsAiHelperOpen(true)}
        />

        {/* Central CAD Canvas */}
        <Canvas
          doc={doc}
          selectedIds={selectedIds}
          tool={tool}
          gridEnabled={gridEnabled}
          snapEnabled={snapEnabled}
          zoom={zoom}
          panOffset={panOffset}
          onSelect={setSelectedIds}
          onUpdateObjects={handleUpdateObjects}
          onSetTool={setTool}
          onSetZoom={setZoom}
          onSetPanOffset={setPanOffset}
          onToggleAspectLock={handleToggleAspectLock}
          previewObjects={previewObjects}
        />

        {/* Right Properties Panel (Single & Group Inspector) */}
        <PropertiesPanel
          doc={doc}
          selectedIds={selectedIds}
          onUpdateObject={handleUpdateObject}
          onUpdateGroup={handleUpdateGroup}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeselect={() => setSelectedIds([])}
          onUpdatePage={updates =>
            setDoc(prev => ({ ...prev, page: { ...prev.page, ...updates } }))
          }
          onLoadPreset={handleLoadPreset}
        />
      </div>

      {/* Bottom Statusbar */}
      <footer className="h-7 bg-slate-950 border-t border-slate-800 text-slate-400 px-3 flex items-center justify-between text-[11px] select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">
            {tool === 'select'
              ? 'AutoCAD Selection & Resize Mode'
              : `Active Tool: ${tool.replace('symbol:', '').toUpperCase()}`}
          </span>
          <span className="text-slate-600">|</span>
          <span>
            {selectedIds.length === 0
              ? 'Click to select · Drag to box-select'
              : `${selectedIds.length} object(s) selected`}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <span>Sheet: {doc.page.w} × {doc.page.h} mm</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Grid: {doc.page.gridSize}px ({snapEnabled ? 'Snap ON' : 'Free'})</span>
          <span className="text-slate-500">AutoCAD Shortcuts: V, G, S, Del, Ctrl+Z, Ctrl+D</span>
        </div>
      </footer>

      {/* Modals */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        doc={doc}
        onApplyScript={(newObjs, mode) => {
          recordHistory();
          setDoc(prev => ({
            ...prev,
            objects: mode === 'add' ? [...prev.objects, ...newObjs] : newObjs,
          }));
          setSelectedIds([]);
        }}
        onSetPreviewObjects={setPreviewObjects}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        doc={doc}
        onImportDocument={imported => {
          recordHistory();
          setDoc(imported);
          setSelectedIds([]);
        }}
      />

      <AiHelperModal
        isOpen={isAiHelperOpen}
        onClose={() => setIsAiHelperOpen(false)}
        doc={doc}
      />
    </div>
  );
}
