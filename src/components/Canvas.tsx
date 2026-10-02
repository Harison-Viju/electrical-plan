/**
 * AutoCAD-Grade Interactive SVG Canvas Component
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  DocumentState,
  DragState,
  LayoutObject,
  MarqueeBox,
  ResizeHandle,
  SymbolType,
  ToolType,
} from '../types/layout';
import { SvgObject } from './SvgObject';
import { SelectionOverlay } from './SelectionOverlay';
import {
  calculateResize,
  findHitObject,
  getObjectsInMarquee,
  rotateVector,
} from '../utils/hitTesting';
import { DEFAULTS, SYMBOL_SIZE } from '../constants/symbols';

interface CanvasProps {
  doc: DocumentState;
  selectedIds: string[];
  tool: ToolType;
  gridEnabled: boolean;
  snapEnabled: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  onSelect: (ids: string[]) => void;
  onUpdateObjects: (updater: (prev: LayoutObject[]) => LayoutObject[], recordHistory?: boolean) => void;
  onSetTool: (tool: ToolType) => void;
  onSetZoom: (zoom: number) => void;
  onSetPanOffset: (offset: { x: number; y: number }) => void;
  onToggleAspectLock?: (targetId: string) => void;
  previewObjects?: LayoutObject[] | null;
}

export const Canvas: React.FC<CanvasProps> = ({
  doc,
  selectedIds,
  tool,
  gridEnabled,
  snapEnabled,
  zoom,
  panOffset,
  onSelect,
  onUpdateObjects,
  onSetTool,
  onSetZoom,
  onSetPanOffset,
  onToggleAspectLock,
  previewObjects,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Convert client viewport coordinates to SVG internal canvas coordinates
  const clientToSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  }, []);

  const snap = useCallback(
    (val: number) => {
      if (!snapEnabled) return val;
      const gs = doc.page.gridSize || 20;
      return Math.round(val / gs) * gs;
    },
    [snapEnabled, doc.page.gridSize]
  );

  // Listen to spacebar and shift keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey || isSpacePressed) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.4, Math.min(3.0, zoom + delta));
        onSetZoom(Number(newZoom.toFixed(2)));
      }
    },
    [zoom, onSetZoom, isSpacePressed]
  );

  // Pointer Down on Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    const pt = clientToSvgPoint(e.clientX, e.clientY);

    // Pan mode (Spacebar or pan tool)
    if (isSpacePressed || tool === 'pan') {
      setDragState({
        type: 'pan',
        startX: e.clientX - panOffset.x,
        startY: e.clientY - panOffset.y,
      });
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    // Placing new element with active creation tool
    if (tool !== 'select') {
      const gs = doc.page.gridSize || 20;
      const posX = snap(pt.x);
      const posY = snap(pt.y);
      const newId = `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      let newObj: LayoutObject;

      if (tool.startsWith('symbol:')) {
        const symType = tool.split(':')[1] as SymbolType;
        const [dw, dh] = SYMBOL_SIZE[symType] || [48, 34];
        newObj = {
          id: newId,
          type: 'symbol',
          symbol: symType,
          x: posX - dw / 2,
          y: posY - dh / 2,
          w: dw,
          h: dh,
          rotation: 0,
        };
      } else if (tool === 'room') {
        newObj = {
          id: newId,
          type: 'room',
          ...DEFAULTS.room,
          x: posX,
          y: posY,
          w: 300,
          h: 240,
          rotation: 0,
        };
      } else if (tool === 'divider') {
        newObj = {
          id: newId,
          type: 'divider',
          ...DEFAULTS.divider,
          x: posX,
          y: posY,
          w: 400,
          h: 2,
          rotation: 0,
        };
      } else if (tool === 'box') {
        newObj = {
          id: newId,
          type: 'box',
          ...DEFAULTS.box,
          x: posX - 110,
          y: posY - 40,
          rotation: 0,
        };
      } else if (tool === 'door') {
        newObj = {
          id: newId,
          type: 'door',
          ...DEFAULTS.door,
          x: posX,
          y: posY,
          rotation: 0,
        };
      } else if (tool === 'text') {
        newObj = {
          id: newId,
          type: 'text',
          ...DEFAULTS.text,
          x: posX,
          y: posY,
          rotation: 0,
        };
      } else if (tool === 'dimension') {
        newObj = {
          id: newId,
          type: 'dimension',
          ...DEFAULTS.dimension,
          x: posX,
          y: posY,
          rotation: 0,
        };
      } else if (tool === 'legend') {
        newObj = {
          id: newId,
          type: 'legend',
          ...DEFAULTS.legend,
          x: posX,
          y: posY,
          rotation: 0,
        };
      } else {
        return;
      }

      onUpdateObjects(prev => [...prev, newObj], true);
      onSelect([newId]);
      onSetTool('select');
      return;
    }

    // Select mode: Hit test with intelligent AutoCAD priority
    // Passes currently selected item for cycle selection (supports small box inside large box)
    const currentPrimary = selectedIds[0] || null;
    const hit = findHitObject(pt.x, pt.y, doc.objects, currentPrimary);

    if (hit) {
      const isShift = e.shiftKey || e.ctrlKey || e.metaKey;
      let newSelectedIds: string[];

      if (isShift) {
        if (selectedIds.includes(hit.id)) {
          newSelectedIds = selectedIds.filter(id => id !== hit.id);
        } else {
          newSelectedIds = [...selectedIds, hit.id];
        }
      } else {
        if (selectedIds.includes(hit.id)) {
          newSelectedIds = selectedIds;
        } else {
          newSelectedIds = [hit.id];
        }
      }

      onSelect(newSelectedIds);

      // Prepare multi-drag state
      const initialMap = new Map<string, { x: number; y: number; w: number; h: number; rotation: number }>();
      doc.objects.forEach(o => {
        if (newSelectedIds.includes(o.id)) {
          initialMap.set(o.id, { x: o.x, y: o.y, w: o.w, h: o.h, rotation: o.rotation || 0 });
        }
      });

      setDragState({
        type: 'move',
        startX: pt.x,
        startY: pt.y,
        initialObjects: initialMap,
      });

      (e.target as Element).setPointerCapture?.(e.pointerId);
    } else {
      // Clicked on empty canvas background
      if (!e.shiftKey) {
        onSelect([]);
      }
      // Start marquee selection
      setMarquee({
        startX: pt.x,
        startY: pt.y,
        currentX: pt.x,
        currentY: pt.y,
      });
      setDragState({
        type: 'marquee',
        startX: pt.x,
        startY: pt.y,
      });
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    // Pan dragging
    if (dragState.type === 'pan') {
      onSetPanOffset({
        x: e.clientX - dragState.startX,
        y: e.clientY - dragState.startY,
      });
      return;
    }

    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const deltaX = pt.x - dragState.startX;
    const deltaY = pt.y - dragState.startY;

    // Marquee Selection dragging
    if (dragState.type === 'marquee') {
      setMarquee(prev => (prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null));
      return;
    }

    // Move dragging (single or multi-object)
    if (dragState.type === 'move' && dragState.initialObjects) {
      const snappedDeltaX = snapEnabled ? snap(deltaX) : deltaX;
      const snappedDeltaY = snapEnabled ? snap(deltaY) : deltaY;

      onUpdateObjects(prev =>
        prev.map(o => {
          const init = dragState.initialObjects?.get(o.id);
          if (init) {
            return {
              ...o,
              x: Math.max(0, init.x + snappedDeltaX),
              y: Math.max(0, init.y + snappedDeltaY),
            };
          }
          return o;
        }),
        false
      );
      return;
    }

    // Resize dragging (8 handles: corners and midpoints)
    if (dragState.type === 'resize' && dragState.activeHandle && dragState.initialObjects) {
      const handle = dragState.activeHandle;
      const gs = snapEnabled ? (doc.page.gridSize || 20) : 1;
      const isTargetSingle = dragState.initialObjects.size === 1;
      const targetObj = isTargetSingle ? doc.objects.find(o => selectedIds.includes(o.id)) : null;
      // Proportional when Shift is held, or if the single object has aspectRatioLocked enabled
      const isProportional = e.shiftKey || isShiftPressed || (isTargetSingle && !!targetObj?.aspectRatioLocked);
      const fromCenter = e.altKey;

      if (dragState.groupBounds && dragState.initialObjects.size > 1) {
        // Group Scaling: Transform group bounding box, then proportionally/non-proportionally map children
        const initGroup = {
          x: dragState.groupBounds.minX,
          y: dragState.groupBounds.minY,
          w: dragState.groupBounds.w,
          h: dragState.groupBounds.h,
          rotation: 0,
        };
        const resizedGroup = calculateResize(handle, deltaX, deltaY, initGroup, gs, 16, isProportional, fromCenter);
        const scaleX = resizedGroup.w / Math.max(1, dragState.groupBounds.w);
        const scaleY = resizedGroup.h / Math.max(1, dragState.groupBounds.h);

        onUpdateObjects(prev =>
          prev.map(o => {
            const init = dragState.initialObjects?.get(o.id);
            if (init && dragState.groupBounds) {
              const relX = init.x - dragState.groupBounds.minX;
              const relY = init.y - dragState.groupBounds.minY;
              return {
                ...o,
                x: Math.round(resizedGroup.x + relX * scaleX),
                y: Math.round(resizedGroup.y + relY * scaleY),
                w: Math.max(8, Math.round(init.w * scaleX)),
                h: Math.max(8, Math.round(init.h * scaleY)),
              };
            }
            return o;
          }),
          false
        );
      } else {
        // Single Object 8-way Scaling (corners & midpoints, proportional & non-proportional)
        onUpdateObjects(prev =>
          prev.map(o => {
            const init = dragState.initialObjects?.get(o.id);
            if (init) {
              const resized = calculateResize(handle, deltaX, deltaY, init, gs, 10, isProportional, fromCenter);
              return {
                ...o,
                x: resized.x,
                y: resized.y,
                w: resized.w,
                h: resized.h,
              };
            }
            return o;
          }),
          false
        );
      }
      return;
    }

    // Rotation dragging
    if (dragState.type === 'rotate' && dragState.initialObjects) {
      onUpdateObjects(prev =>
        prev.map(o => {
          const init = dragState.initialObjects?.get(o.id);
          if (init) {
            const cx = init.x + init.w / 2;
            const cy = init.y + init.h / 2;
            const angleRad = Math.atan2(pt.y - cy, pt.x - cx);
            let deg = Math.round((angleRad * 180) / Math.PI + 90);
            deg = (deg % 360 + 360) % 360;
            // Snap to 5 deg increments if snap is enabled
            if (snapEnabled) {
              deg = Math.round(deg / 5) * 5;
            }
            return {
              ...o,
              rotation: deg,
            };
          }
          return o;
        }),
        false
      );
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (dragState.type === 'marquee' && marquee) {
      const selected = getObjectsInMarquee(marquee, doc.objects);
      if (e.shiftKey) {
        const merged = Array.from(new Set([...selectedIds, ...selected]));
        onSelect(merged);
      } else {
        onSelect(selected);
      }
      setMarquee(null);
    } else if (dragState.type === 'move' || dragState.type === 'resize' || dragState.type === 'rotate') {
      // Record history on completion of drag transform
      onUpdateObjects(prev => [...prev], true);
    }

    setDragState(null);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Start resize from 8-way selection handle
  const handleStartResize = (e: React.PointerEvent, handle: ResizeHandle, targetId?: string) => {
    e.stopPropagation();
    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const initialMap = new Map<string, { x: number; y: number; w: number; h: number; rotation: number }>();

    const targetIds = targetId ? [targetId] : selectedIds;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    doc.objects.forEach(o => {
      if (targetIds.includes(o.id)) {
        initialMap.set(o.id, { x: o.x, y: o.y, w: o.w, h: o.h, rotation: o.rotation || 0 });
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
        maxX = Math.max(maxX, o.x + o.w);
        maxY = Math.max(maxY, o.y + o.h);
      }
    });

    const groupBounds =
      targetIds.length > 1 && isFinite(minX)
        ? { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
        : undefined;

    const isTargetSingle = targetIds.length === 1;
    const targetObj = isTargetSingle ? doc.objects.find(o => o.id === targetIds[0]) : null;
    const isProportional = e.shiftKey || (isTargetSingle && !!targetObj?.aspectRatioLocked);

    setDragState({
      type: 'resize',
      activeHandle: handle,
      startX: pt.x,
      startY: pt.y,
      initialObjects: initialMap,
      groupBounds,
      isProportional,
      fromCenter: e.altKey,
    });

    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  // Start rotation
  const handleStartRotate = (e: React.PointerEvent, targetId?: string) => {
    e.stopPropagation();
    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const initialMap = new Map<string, { x: number; y: number; w: number; h: number; rotation: number }>();

    const targetIds = targetId ? [targetId] : selectedIds;
    doc.objects.forEach(o => {
      if (targetIds.includes(o.id)) {
        initialMap.set(o.id, { x: o.x, y: o.y, w: o.w, h: o.h, rotation: o.rotation || 0 });
      }
    });

    setDragState({
      type: 'rotate',
      startX: pt.x,
      startY: pt.y,
      initialObjects: initialMap,
    });

    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  const selectedObjects = doc.objects.filter(o => selectedIds.includes(o.id) && !o.hidden);
  const pw = doc.page.w;
  const ph = doc.page.h;

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full overflow-hidden bg-slate-200 select-none flex items-center justify-center ${
        isSpacePressed || tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onWheel={handleWheel}
    >
      <div
        className="transition-transform duration-75 origin-center shadow-2xl"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${pw} ${ph}`}
          width={pw}
          height={ph}
          role="application"
          aria-label="Electrical CAD Canvas"
          className="bg-white block overflow-visible shadow-2xl rounded-sm"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            {/* Architectural CAD Grid Pattern */}
            <pattern
              id="cadGridPattern"
              width={doc.page.gridSize || 20}
              height={doc.page.gridSize || 20}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${doc.page.gridSize || 20} 0 H 0 V ${doc.page.gridSize || 20}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={0.8}
              />
            </pattern>
            {/* Major grid lines (100px) */}
            <pattern id="cadMajorGrid" width={100} height={100} patternUnits="userSpaceOnUse">
              <rect width={100} height={100} fill="url(#cadGridPattern)" />
              <path d="M 100 0 H 0 V 100" fill="none" stroke="#cbd5e1" strokeWidth={1.2} />
            </pattern>
          </defs>

          {/* Paper Border and Background */}
          <rect
            className="paper"
            x={0}
            y={0}
            width={pw}
            height={ph}
            fill="#ffffff"
            stroke="#94a3b8"
            strokeWidth={doc.page.border ? 1.5 : 0}
          />

          {/* Grid Layer */}
          {gridEnabled && (
            <rect
              id="grid"
              x={0}
              y={0}
              width={pw}
              height={ph}
              fill="url(#cadMajorGrid)"
              className="pointer-events-none"
            />
          )}

          {/* Main Objects Layer */}
          <g id="objects">
            {doc.objects.map(obj => (
              <SvgObject
                key={obj.id}
                obj={obj}
                isSelected={selectedIds.includes(obj.id)}
              />
            ))}
          </g>

          {/* Preview Layer (for ELS script import preview) */}
          {previewObjects && (
            <g id="previewLayer" className="pointer-events-none opacity-60">
              {previewObjects.map(obj => (
                <SvgObject key={`prev_${obj.id}`} obj={obj} isSelected={false} isPreview />
              ))}
            </g>
          )}

          {/* AutoCAD Interactive Selection Gizmo & Handles */}
          <g id="selectionLayer">
            <SelectionOverlay
              selectedObjects={selectedObjects}
              onStartResize={handleStartResize}
              onStartRotate={handleStartRotate}
              onStartDrag={handlePointerDown}
              onToggleAspectLock={onToggleAspectLock}
              zoom={zoom}
              isShiftPressed={isShiftPressed}
              activeHandle={dragState?.type === 'resize' ? dragState.activeHandle : undefined}
            />
          </g>

          {/* Marquee Selection Drag Box */}
          {marquee && (
            <g id="marqueeLayer" className="pointer-events-none">
              <rect
                x={Math.min(marquee.startX, marquee.currentX)}
                y={Math.min(marquee.startY, marquee.currentY)}
                width={Math.abs(marquee.currentX - marquee.startX)}
                height={Math.abs(marquee.currentY - marquee.startY)}
                fill="rgba(37, 99, 235, 0.12)"
                stroke="#2563eb"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
