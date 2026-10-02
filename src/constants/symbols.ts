/**
 * house-v1 Reference Symbols & CAD Object Defaults
 * Strict compliance with drawing example.jpeg:
 *  - LED: clean circle
 *  - Fan: circle with figure-8 inside
 *  - 15 A Socket: two nested closed half-circles + 3 rays
 *  - 5 A Socket: one closed half-circle + 3 rays
 */

import { SymbolType } from '../types/layout';

export const LABELS: Record<SymbolType, string> = {
  led: 'LED',
  fan: 'Fan',
  socket15: '15 A Socket',
  socket5: '5 A Socket',
};

export const SYMBOL_SIZE: Record<SymbolType, [number, number]> = {
  led: [24, 24],
  fan: [56, 56],
  socket15: [64, 42],
  socket5: [48, 34],
};

export const DEFAULTS = {
  page: {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    border: true,
    w: 800,
    h: 1130,
    gridSize: 20,
  },
  room: {
    w: 700,
    h: 1050,
    strokeWidth: 4,
    name: 'Hall',
    floorType: 'Tile',
    roomColor: 'transparent',
  },
  divider: {
    w: 700,
    h: 2,
    orientation: 'h' as const,
    dashed: true,
  },
  box: {
    w: 220,
    h: 80,
    label: 'Box\nType text here',
    labelPos: 'inside' as const,
    size: 14,
    borderStyle: 'solid' as const,
    fillColor: '#ffffff',
  },
  door: {
    w: 70,
    h: 70,
    swing: '90' as const,
    hinge: 'left' as const,
    direction: 'in' as const,
  },
  text: {
    w: 240,
    h: 30,
    label: 'Ground Floor Plan',
    size: 20,
  },
  dimension: {
    w: 200,
    h: 32,
    dimValue: '4.00 m',
    dimOrientation: 'h' as const,
  },
  legend: {
    w: 195,
    h: 220,
    auto: true,
  },
};
