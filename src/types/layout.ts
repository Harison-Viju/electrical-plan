/**
 * Types for AutoCAD-Grade Electrical Layout CAD & ELS Studio
 */

export type SymbolType = 'led' | 'fan' | 'socket15' | 'socket5';

export type ObjectType = 
  | 'symbol' 
  | 'room' 
  | 'divider' 
  | 'box' 
  | 'door' 
  | 'text' 
  | 'dimension' 
  | 'wire' 
  | 'legend';

export type ToolType = 
  | 'select' 
  | 'pan' 
  | `symbol:${SymbolType}` 
  | 'room' 
  | 'divider' 
  | 'box' 
  | 'door' 
  | 'text' 
  | 'dimension' 
  | 'wire' 
  | 'legend';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface LayoutObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // in degrees (0 - 359)
  label?: string;
  size?: number; // font size or primary dimension
  locked?: boolean;
  hidden?: boolean;

  // Symbol specific
  symbol?: SymbolType;
  wall?: 'left' | 'right' | 'top' | 'bottom';
  along?: number; // percentage along room wall if placed via script
  room?: string; // parent room id

  // Box specific
  labelPos?: 'inside' | 'below' | 'above';
  borderStyle?: 'solid' | 'dashed' | 'double';
  fillColor?: string; // e.g. 'transparent', '#ffffff', '#f8fafc'

  // Room specific
  name?: string;
  strokeWidth?: number;
  floorType?: string;
  roomColor?: string;

  // Divider specific
  orientation?: 'h' | 'v';
  dashed?: boolean;

  // Door specific
  swing?: '90' | '180' | 'double' | 'sliding';
  hinge?: 'left' | 'right';
  direction?: 'in' | 'out';

  // Dimension specific
  dimValue?: string; // e.g. "3.50 m"
  dimOrientation?: 'h' | 'v';

  // Wire specific
  points?: Array<{ x: number; y: number }>;
  wireColor?: string;
  wireStyle?: 'curved' | 'orthogonal';

  // Legend specific
  auto?: boolean;

  // Scaling specific
  aspectRatioLocked?: boolean;
}

export interface PageConfig {
  size: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  border: boolean;
  w: number;
  h: number;
  gridSize: number;
}

export interface DocumentState {
  version: number;
  symbolSet: 'house-v1';
  title: string;
  page: PageConfig;
  objects: LayoutObject[];
}

export interface MarqueeBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'pan' | 'marquee' | 'create';
  startX: number;
  startY: number;
  activeHandle?: ResizeHandle;
  initialObjects?: Map<string, { x: number; y: number; w: number; h: number; rotation: number }>;
  groupBounds?: { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number };
  isProportional?: boolean;
  fromCenter?: boolean;
  createdObject?: LayoutObject;
}

export interface ELSParseResult {
  mode: 'replace' | 'patch';
  page: PageConfig;
  objects: LayoutObject[];
  patches: Array<{
    kind: 'move' | 'rotate' | 'label' | 'delete' | 'deleteWhere';
    id?: string;
    x?: string;
    y?: string;
    value?: string | number;
    symbol?: string;
    line: number;
  }>;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  previewDoc?: DocumentState;
}
