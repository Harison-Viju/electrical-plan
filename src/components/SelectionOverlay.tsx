/**
 * AutoCAD-Style 8-Way Interactive Selection Gizmo & Group Transform Overlay
 * Renders 8 interactive resize handles (4 corners + 4 edge midpoints) for any selected object,
 * supporting both proportional (Shift key / lock toggle) and non-proportional scaling.
 */

import React from 'react';
import { LayoutObject, ResizeHandle } from '../types/layout';
import { getRotatedHandleCursor } from '../utils/hitTesting';

interface SelectionOverlayProps {
  selectedObjects: LayoutObject[];
  onStartResize: (e: React.PointerEvent, handle: ResizeHandle, targetId?: string) => void;
  onStartRotate: (e: React.PointerEvent, targetId?: string) => void;
  onStartDrag: (e: React.PointerEvent) => void;
  onToggleAspectLock?: (targetId: string) => void;
  zoom: number;
  isShiftPressed?: boolean;
  activeHandle?: ResizeHandle;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectedObjects,
  onStartResize,
  onStartRotate,
  onStartDrag,
  onToggleAspectLock,
  zoom,
  isShiftPressed,
  activeHandle,
}) => {
  if (selectedObjects.length === 0) return null;

  // Single Object Selection
  if (selectedObjects.length === 1) {
    const obj = selectedObjects[0];
    const rot = obj.rotation || 0;
    const cx = obj.w / 2;
    const cy = obj.h / 2;
    const pad = 6;

    // 8 interactive handles in local coordinates (4 corners and 4 edge midpoints)
    const handles: Array<{
      handle: ResizeHandle;
      x: number;
      y: number;
      isCorner: boolean;
      label: string;
    }> = [
      // 4 Corners
      { handle: 'nw', x: -pad, y: -pad, isCorner: true, label: 'Top-Left Corner' },
      { handle: 'ne', x: obj.w + pad, y: -pad, isCorner: true, label: 'Top-Right Corner' },
      { handle: 'se', x: obj.w + pad, y: obj.h + pad, isCorner: true, label: 'Bottom-Right Corner' },
      { handle: 'sw', x: -pad, y: obj.h + pad, isCorner: true, label: 'Bottom-Left Corner' },

      // 4 Edge Midpoints
      { handle: 'n', x: cx, y: -pad, isCorner: false, label: 'Top Midpoint (Height)' },
      { handle: 'e', x: obj.w + pad, y: cy, isCorner: false, label: 'Right Midpoint (Width)' },
      { handle: 's', x: cx, y: obj.h + pad, isCorner: false, label: 'Bottom Midpoint (Height)' },
      { handle: 'w', x: -pad, y: cy, isCorner: false, label: 'Left Midpoint (Width)' },
    ];

    const rotateHandleY = -pad - 30;
    const isProportional = isShiftPressed || !!obj.aspectRatioLocked;

    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        className="selection-gizmo"
      >
        {/* Selection Bounding Rectangle */}
        <rect
          x={-pad}
          y={-pad}
          width={obj.w + pad * 2}
          height={obj.h + pad * 2}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          className="pointer-events-none"
        />

        {/* Live Dimension & Scaling Mode Badge */}
        <g
          transform={`translate(${cx} ${obj.h + pad + 18})`}
          className="select-none"
        >
          <rect
            x={-60}
            y={-10}
            width={120}
            height={20}
            rx={4}
            fill="#0f172a"
            fillOpacity={0.92}
            className="pointer-events-none"
          />
          <text
            x={-10}
            y={4}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            fontFamily="monospace"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {Math.round(obj.w)} × {Math.round(obj.h)}
          </text>

          {/* Proportional Lock Toggle Badge */}
          <g
            transform="translate(34, -7)"
            className="cursor-pointer pointer-events-auto"
            onClick={e => {
              e.stopPropagation();
              onToggleAspectLock?.(obj.id);
            }}
          >
            <title>
              {obj.aspectRatioLocked
                ? 'Aspect Ratio Locked (Proportional). Click to unlock.'
                : 'Free Aspect Ratio (Non-proportional). Hold Shift or click to lock.'}
            </title>
            <rect
              x={0}
              y={0}
              width={20}
              height={14}
              rx={2}
              fill={obj.aspectRatioLocked ? '#2563eb' : '#334155'}
            />
            <text
              x={10}
              y={10}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={8}
              fontWeight="bold"
            >
              {obj.aspectRatioLocked ? '1:1' : 'FREE'}
            </text>
          </g>
        </g>

        {/* Rotation Stem & Handle */}
        <line
          x1={cx}
          y1={-pad}
          x2={cx}
          y2={rotateHandleY}
          stroke="#2563eb"
          strokeWidth={1.5}
          className="pointer-events-none"
        />
        <circle
          cx={cx}
          cy={rotateHandleY}
          r={7}
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth={2}
          className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform pointer-events-auto"
          onPointerDown={e => onStartRotate(e, obj.id)}
        />
        <circle
          cx={cx}
          cy={rotateHandleY}
          r={2.5}
          fill="#2563eb"
          className="pointer-events-none"
        />

        {/* 8 Resize Handles (4 Corners + 4 Midpoints) */}
        {handles.map(h => {
          const cursor = getRotatedHandleCursor(h.handle, rot);
          const size = h.isCorner ? 10 : 8;
          const half = size / 2;
          const isActive = activeHandle === h.handle;

          return (
            <g key={h.handle}>
              {/* Invisible touch expander for mobile/trackpad accuracy */}
              <rect
                x={h.x - 12}
                y={h.y - 12}
                width={24}
                height={24}
                fill="transparent"
                style={{ cursor }}
                className="pointer-events-auto"
                onPointerDown={e => onStartResize(e, h.handle, obj.id)}
              />

              {/* Visual Handle */}
              <rect
                x={h.x - half}
                y={h.y - half}
                width={size}
                height={size}
                rx={h.isCorner ? 2 : 1.5}
                fill={isActive ? '#3b82f6' : h.isCorner ? '#ffffff' : '#f8fafc'}
                stroke="#2563eb"
                strokeWidth={1.75}
                style={{ cursor }}
                className="hover:scale-125 transition-transform pointer-events-none shadow-xs"
              />
            </g>
          );
        })}
      </g>
    );
  }

  // Multiple Selected Objects (Group Bounding Box)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedObjects.forEach(obj => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.w);
    maxY = Math.max(maxY, obj.y + obj.h);
  });

  const groupW = maxX - minX;
  const groupH = maxY - minY;
  const pad = 10;
  const cx = minX + groupW / 2;
  const cy = minY + groupH / 2;

  // 8 handles for the group (4 corners + 4 midpoints)
  const handles: Array<{ handle: ResizeHandle; x: number; y: number; isCorner: boolean }> = [
    // 4 Corners
    { handle: 'nw', x: minX - pad, y: minY - pad, isCorner: true },
    { handle: 'ne', x: maxX + pad, y: minY - pad, isCorner: true },
    { handle: 'se', x: maxX + pad, y: maxY + pad, isCorner: true },
    { handle: 'sw', x: minX - pad, y: maxY + pad, isCorner: true },

    // 4 Edge Midpoints
    { handle: 'n', x: cx, y: minY - pad, isCorner: false },
    { handle: 'e', x: maxX + pad, y: cy, isCorner: false },
    { handle: 's', x: cx, y: maxY + pad, isCorner: false },
    { handle: 'w', x: minX - pad, y: cy, isCorner: false },
  ];

  return (
    <g className="group-selection-gizmo">
      {/* Outer Group Boundary */}
      <rect
        x={minX - pad}
        y={minY - pad}
        width={groupW + pad * 2}
        height={groupH + pad * 2}
        fill="rgba(37, 99, 235, 0.04)"
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        className="pointer-events-none"
      />

      {/* Floating Group Badge */}
      <g
        transform={`translate(${cx} ${minY - pad - 20})`}
        className="pointer-events-none select-none"
      >
        <rect
          x={-75}
          y={-11}
          width={150}
          height={22}
          rx={11}
          fill="#0f172a"
          fillOpacity={0.95}
        />
        <text
          x={0}
          y={3}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={10}
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {selectedObjects.length} items · {isShiftPressed ? 'Proportional (Shift)' : '8-Way Scale'}
        </text>
      </g>

      {/* 8 Resize Handles for Group (4 Corners + 4 Midpoints) */}
      {handles.map(h => {
        const cursor = getRotatedHandleCursor(h.handle, 0);
        const size = h.isCorner ? 10 : 8;
        const half = size / 2;
        const isActive = activeHandle === h.handle;

        return (
          <g key={h.handle}>
            {/* Invisible touch expander */}
            <rect
              x={h.x - 12}
              y={h.y - 12}
              width={24}
              height={24}
              fill="transparent"
              style={{ cursor }}
              className="pointer-events-auto"
              onPointerDown={e => onStartResize(e, h.handle)}
            />

            {/* Visual Handle */}
            <rect
              x={h.x - half}
              y={h.y - half}
              width={size}
              height={size}
              rx={h.isCorner ? 2 : 1.5}
              fill={isActive ? '#3b82f6' : h.isCorner ? '#ffffff' : '#f8fafc'}
              stroke="#2563eb"
              strokeWidth={1.75}
              style={{ cursor }}
              className="hover:scale-125 transition-transform pointer-events-none shadow-xs"
            />
          </g>
        );
      })}
    </g>
  );
};
