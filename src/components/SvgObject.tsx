/**
 * High-Precision SVG Object Renderer for house-v1 Symbols and CAD Floorplan Elements
 */

import React from 'react';
import { LayoutObject, SymbolType } from '../types/layout';
import { LABELS, SYMBOL_SIZE } from '../constants/symbols';

interface SvgObjectProps {
  obj: LayoutObject;
  isSelected: boolean;
  isPreview?: boolean;
}

export const SvgObject: React.FC<SvgObjectProps> = ({ obj, isSelected, isPreview }) => {
  if (obj.hidden) return null;

  const rot = obj.rotation || 0;
  const cx = obj.w / 2;
  const cy = obj.h / 2;

  // Render house-v1 reference symbols
  if (obj.type === 'symbol' && obj.symbol) {
    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        className={isPreview ? 'preview-object opacity-50' : 'cursor-move'}
        data-id={obj.id}
      >
        {/* Invisible hit plate with padding for easy selection of small symbols */}
        <rect
          x={-8}
          y={-8}
          width={obj.w + 16}
          height={obj.h + 16}
          fill="transparent"
          className="pointer-events-auto"
        />

        <SymbolGraphic symbol={obj.symbol} w={obj.w} h={obj.h} />

        {obj.label && (
          <text
            x={cx}
            y={obj.h + 16}
            textAnchor="middle"
            className="fill-slate-900 font-sans text-xs font-semibold select-none pointer-events-none"
            transform={`rotate(${-rot} ${cx} ${obj.h + 16})`}
          >
            {obj.label}
          </text>
        )}
      </g>
    );
  }

  // Render Room
  if (obj.type === 'room') {
    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className={isPreview ? 'preview-object opacity-50' : ''}
      >
        <rect
          x={0}
          y={0}
          width={obj.w}
          height={obj.h}
          fill={obj.roomColor && obj.roomColor !== 'transparent' ? obj.roomColor : 'none'}
          stroke="#111827"
          strokeWidth={obj.strokeWidth || 4}
          className="room-stroke pointer-events-auto"
        />

        {obj.name && (
          <g className="pointer-events-none select-none">
            <rect
              x={12}
              y={12}
              width={Math.min(obj.w - 24, obj.name.length * 10 + 24)}
              height={26}
              fill="#ffffff"
              fillOpacity={0.85}
              rx={4}
            />
            <text
              x={20}
              y={30}
              fill="#111827"
              fontFamily="Arial, sans-serif"
              fontSize={14}
              fontWeight="bold"
              letterSpacing="0.5px"
            >
              {obj.name.toUpperCase()}
            </text>
          </g>
        )}
      </g>
    );
  }

  // Render Divider
  if (obj.type === 'divider') {
    const isV = obj.orientation === 'v';
    return (
      <g data-id={obj.id} className={isPreview ? 'preview-object opacity-50' : ''}>
        {/* Generous hit area for line */}
        <line
          x1={obj.x}
          y1={obj.y}
          x2={isV ? obj.x : obj.x + obj.w}
          y2={isV ? obj.y + obj.h : obj.y}
          stroke="transparent"
          strokeWidth={18}
          className="pointer-events-auto cursor-move"
        />
        <line
          x1={obj.x}
          y1={obj.y}
          x2={isV ? obj.x : obj.x + obj.w}
          y2={isV ? obj.y + obj.h : obj.y}
          stroke="#111827"
          strokeWidth={2}
          strokeDasharray={obj.dashed !== false ? '8 6' : undefined}
          strokeLinecap="round"
          className="pointer-events-none"
        />
      </g>
    );
  }

  // Render Box (Generic appliance, panel, furniture, air curtain, TV container)
  if (obj.type === 'box') {
    const lines = (obj.label || '').split('\n');
    const fontSize = obj.size || 14;
    const lineHeight = fontSize * 1.3;
    const labelPos = obj.labelPos || 'inside';

    let labelY = obj.y + obj.h / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
    if (labelPos === 'below') {
      labelY = obj.y + obj.h + fontSize + 4;
    } else if (labelPos === 'above') {
      labelY = obj.y - (lines.length * lineHeight) + fontSize;
    }

    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className={isPreview ? 'preview-object opacity-50' : 'cursor-move'}
      >
        {/* Invisible hit plate */}
        <rect
          x={-4}
          y={-4}
          width={obj.w + 8}
          height={obj.h + 8}
          fill="transparent"
          className="pointer-events-auto"
        />

        {/* Box Rectangle */}
        <rect
          x={0}
          y={0}
          width={obj.w}
          height={obj.h}
          fill={obj.fillColor || '#ffffff'}
          stroke="#111827"
          strokeWidth={2}
          strokeDasharray={obj.borderStyle === 'dashed' ? '6 4' : undefined}
          className="pointer-events-auto"
        />

        {/* Inner border if double style */}
        {obj.borderStyle === 'double' && (
          <rect
            x={4}
            y={4}
            width={Math.max(1, obj.w - 8)}
            height={Math.max(1, obj.h - 8)}
            fill="none"
            stroke="#111827"
            strokeWidth={1}
            className="pointer-events-none"
          />
        )}

        {/* Text inside/below/above */}
        {lines.map((line, idx) => (
          <text
            key={idx}
            x={cx}
            y={
              labelPos === 'inside'
                ? cy - ((lines.length - 1) * lineHeight) / 2 + idx * lineHeight + fontSize * 0.35
                : labelPos === 'below'
                ? obj.h + fontSize + 4 + idx * lineHeight
                : -lines.length * lineHeight + idx * lineHeight + fontSize
            }
            textAnchor="middle"
            fill="#111827"
            fontFamily="Arial, sans-serif"
            fontSize={fontSize}
            fontWeight="bold"
            letterSpacing="0.4px"
            className="select-none pointer-events-none"
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  // Render Architectural Door with 90° Swing Arc
  if (obj.type === 'door') {
    const r = Math.min(obj.w, obj.h);
    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className={isPreview ? 'preview-object opacity-50' : 'cursor-move'}
      >
        <rect
          x={-6}
          y={-6}
          width={obj.w + 12}
          height={obj.h + 12}
          fill="transparent"
          className="pointer-events-auto"
        />
        {/* Frame / Opening Opening Line */}
        <line x1={0} y1={obj.h} x2={obj.w} y2={obj.h} stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" />
        {/* Door Leaf (open at 90 deg) */}
        <line x1={0} y1={obj.h} x2={0} y2={0} stroke="#111827" strokeWidth={3} />
        {/* Swing Arc */}
        <path
          d={`M 0 0 A ${r} ${r} 0 0 1 ${obj.w} ${obj.h}`}
          fill="none"
          stroke="#111827"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        {/* Hinge Pin */}
        <circle cx={0} cy={obj.h} r={3} fill="#111827" />
      </g>
    );
  }

  // Render Text
  if (obj.type === 'text') {
    const lines = (obj.label || '').split('\n');
    const fontSize = obj.size || 18;
    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className={isPreview ? 'preview-object opacity-50' : 'cursor-move'}
      >
        <rect
          x={-6}
          y={-6}
          width={obj.w + 12}
          height={obj.h + 12}
          fill="transparent"
          className="pointer-events-auto"
        />
        {lines.map((line, idx) => (
          <text
            key={idx}
            x={0}
            y={fontSize + idx * fontSize * 1.3}
            fill="#111827"
            fontFamily="Arial, sans-serif"
            fontSize={fontSize}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  // Render Dimension Line
  if (obj.type === 'dimension') {
    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className="cursor-move"
      >
        <rect x={-4} y={-4} width={obj.w + 8} height={obj.h + 8} fill="transparent" className="pointer-events-auto" />
        {/* Witness extension lines */}
        <line x1={0} y1={4} x2={0} y2={28} stroke="#2563eb" strokeWidth={1.5} />
        <line x1={obj.w} y1={4} x2={obj.w} y2={28} stroke="#2563eb" strokeWidth={1.5} />
        {/* Main dimension line */}
        <line x1={0} y1={16} x2={obj.w} y2={16} stroke="#2563eb" strokeWidth={1.5} />
        {/* AutoCAD 45-deg ticks */}
        <line x1={-4} y1={20} x2={4} y2={12} stroke="#2563eb" strokeWidth={2} />
        <line x1={obj.w - 4} y1={20} x2={obj.w + 4} y2={12} stroke="#2563eb" strokeWidth={2} />
        {/* Dimension text */}
        <rect x={obj.w / 2 - 28} y={4} width={56} height={16} fill="#ffffff" />
        <text
          x={obj.w / 2}
          y={16}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#2563eb"
          fontSize={11}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {obj.dimValue || `${Math.round(obj.w)} mm`}
        </text>
      </g>
    );
  }

  // Render Legend
  if (obj.type === 'legend') {
    const symbolTypes: SymbolType[] = ['socket15', 'socket5', 'led', 'fan'];
    const rowH = 42;
    const computedH = Math.max(obj.h, 44 + symbolTypes.length * rowH);

    return (
      <g
        transform={`translate(${obj.x} ${obj.y}) rotate(${rot} ${cx} ${cy})`}
        data-id={obj.id}
        className="cursor-move"
      >
        <rect
          x={0}
          y={0}
          width={obj.w}
          height={computedH}
          fill="#ffffff"
          stroke="#111827"
          strokeWidth={2}
          rx={3}
          className="pointer-events-auto"
        />
        <text
          x={obj.w / 2}
          y={22}
          textAnchor="middle"
          fill="#111827"
          fontFamily="Arial, sans-serif"
          fontSize={12}
          fontWeight="900"
          letterSpacing="0.8px"
        >
          REFERENCE SYMBOLS
        </text>
        <line x1={8} y1={32} x2={obj.w - 8} y2={32} stroke="#111827" strokeWidth={1.5} />

        {symbolTypes.map((sym, idx) => {
          const rowY = 40 + idx * rowH;
          const [defW, defH] = SYMBOL_SIZE[sym];
          const scale = Math.min(28 / defW, 28 / defH);
          return (
            <g key={sym} transform={`translate(16 ${rowY})`}>
              <g transform={`translate(${16 - (defW * scale) / 2} ${16 - (defH * scale) / 2}) scale(${scale})`}>
                <SymbolGraphic symbol={sym} w={defW} h={defH} />
              </g>
              <text
                x={48}
                y={20}
                fill="#111827"
                fontFamily="Arial, sans-serif"
                fontSize={12}
                fontWeight="600"
              >
                {LABELS[sym]}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return null;
};

/**
 * Pure Graphic for house-v1 Reference Symbols (Strict reference to drawing example.jpeg)
 */
export const SymbolGraphic: React.FC<{ symbol: SymbolType; w: number; h: number }> = ({
  symbol,
  w,
  h,
}) => {
  const strokeProps = {
    fill: 'none',
    stroke: '#111827',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  // LED: Clean circle
  if (symbol === 'led') {
    const r = Math.min(w, h) * 0.42;
    return <circle cx={w / 2} cy={h / 2} r={r} {...strokeProps} />;
  }

  // Fan: Outer circle with centered figure-8 inside
  if (symbol === 'fan') {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 2;
    const lobeH = r * 0.46;
    const lobeW = r * 0.36;

    // Figure-8 path consisting of two smooth connected loops meeting at (cx, cy)
    const dFigure8 = `
      M ${cx} ${cy}
      C ${cx + lobeW} ${cy - lobeH * 0.6} ${cx + lobeW} ${cy - lobeH * 1.8} ${cx} ${cy - lobeH * 1.8}
      C ${cx - lobeW} ${cy - lobeH * 1.8} ${cx - lobeW} ${cy - lobeH * 0.6} ${cx} ${cy}
      C ${cx + lobeW} ${cy + lobeH * 0.6} ${cx + lobeW} ${cy + lobeH * 1.8} ${cx} ${cy + lobeH * 1.8}
      C ${cx - lobeW} ${cy + lobeH * 1.8} ${cx - lobeW} ${cy + lobeH * 0.6} ${cx} ${cy}
      Z
    `;

    return (
      <g>
        <circle cx={cx} cy={cy} r={r} {...strokeProps} />
        <path d={dFigure8} {...strokeProps} />
      </g>
    );
  }

  // 15 A Socket: Two nested closed half-circles + 3 radiating rays
  if (symbol === 'socket15') {
    const s = Math.min(w / 70, h / 44);
    const tx = (w - 70 * s) / 2;
    const ty = (h - 44 * s) / 2;

    return (
      <g transform={`translate(${tx} ${ty}) scale(${s})`}>
        {/* Outer and Inner closed half-circles */}
        <path
          d="M 11 40 A 24 24 0 0 1 59 40 Z M 21 40 A 14 14 0 0 1 49 40 Z"
          {...strokeProps}
          strokeWidth={2 / s}
        />
        {/* 3 Radiating Rays on outer arc */}
        <line x1={35} y1={13} x2={35} y2={3} {...strokeProps} strokeWidth={2 / s} />
        <line x1={50.5} y1={17.9} x2={56.2} y2={9.7} {...strokeProps} strokeWidth={2 / s} />
        <line x1={19.5} y1={17.9} x2={13.8} y2={9.7} {...strokeProps} strokeWidth={2 / s} />
      </g>
    );
  }

  // 5 A Socket: Single closed half-circle + 3 radiating rays
  if (symbol === 'socket5') {
    const s = Math.min(w / 54, h / 38);
    const tx = (w - 54 * s) / 2;
    const ty = (h - 38 * s) / 2;

    return (
      <g transform={`translate(${tx} ${ty}) scale(${s})`}>
        {/* Single closed half-circle */}
        <path
          d="M 12 34 A 20 20 0 0 1 52 34 Z"
          {...strokeProps}
          strokeWidth={2 / s}
        />
        {/* 3 Radiating Rays */}
        <line x1={32} y1={12} x2={32} y2={3} {...strokeProps} strokeWidth={2 / s} />
        <line x1={46.5} y1={17.2} x2={52.2} y2={9.5} {...strokeProps} strokeWidth={2 / s} />
        <line x1={17.5} y1={17.2} x2={11.8} y2={9.5} {...strokeProps} strokeWidth={2 / s} />
      </g>
    );
  }

  return null;
};
