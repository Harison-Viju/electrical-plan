/**
 * AutoCAD-Grade Hit Testing, Selection Priority, and Marquee Geometry
 */

import { LayoutObject, ResizeHandle } from '../types/layout';

/**
 * Checks if point (px, py) is inside a rotated rectangle
 */
export function isPointInRotatedRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
  padding = 6
): boolean {
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Transform point by -rotation around object center
  const rad = (-rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = px - cx;
  const dy = py - cy;

  const localX = cos * dx - sin * dy + cx;
  const localY = sin * dx + cos * dy + cy;

  return (
    localX >= x - padding &&
    localX <= x + w + padding &&
    localY >= y - padding &&
    localY <= y + h + padding
  );
}

/**
 * Special hit test for dividers (lines)
 */
export function isPointNearDivider(
  px: number,
  py: number,
  obj: LayoutObject,
  tolerance = 12
): boolean {
  if (obj.orientation === 'v') {
    return (
      Math.abs(px - obj.x) <= tolerance &&
      py >= obj.y - tolerance &&
      py <= obj.y + obj.h + tolerance
    );
  }
  // Horizontal divider
  return (
    Math.abs(py - obj.y) <= tolerance &&
    px >= obj.x - tolerance &&
    px <= obj.x + obj.w + tolerance
  );
}

/**
 * Intelligent AutoCAD-style hit testing:
 * Solves the nested/overlapping element issue (e.g. small box inside large box, fan inside room).
 * 1. Finds all objects containing the click point.
 * 2. Sorts candidates by area (smallest first), with non-containers prioritized.
 * 3. Supports Selection Cycling: if top candidate is already selected, cycle to next candidate!
 */
export function findHitObject(
  px: number,
  py: number,
  objects: LayoutObject[],
  currentSelectedId: string | null = null
): LayoutObject | null {
  const candidates: Array<{ obj: LayoutObject; area: number; zIndex: number }> = [];

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (obj.hidden || obj.locked) continue;

    let hit = false;
    if (obj.type === 'divider') {
      hit = isPointNearDivider(px, py, obj);
    } else {
      // For symbols and small elements, provide generous hit area
      const pad = obj.type === 'symbol' ? 10 : 6;
      hit = isPointInRotatedRect(px, py, obj.x, obj.y, obj.w, obj.h, obj.rotation || 0, pad);
    }

    if (hit) {
      // Area weighting: Rooms get large area penalty so inner items are chosen first.
      let area = Math.max(1, obj.w * obj.h);
      if (obj.type === 'room') area += 10000000;
      if (obj.type === 'divider') area = 50; // lines are very high priority
      if (obj.type === 'symbol') area = Math.min(area, 2000); // symbols always high priority

      candidates.push({ obj, area, zIndex: i });
    }
  }

  if (candidates.length === 0) return null;

  // Sort smallest area first. If areas are similar, higher z-index (rendered on top) wins
  candidates.sort((a, b) => {
    if (Math.abs(a.area - b.area) > 10) {
      return a.area - b.area;
    }
    return b.zIndex - a.zIndex;
  });

  // Selection Cycling: If current selected item is in candidates, pick next one!
  if (currentSelectedId && candidates.length > 1) {
    const currentIndex = candidates.findIndex(c => c.obj.id === currentSelectedId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % candidates.length;
      return candidates[nextIndex].obj;
    }
  }

  return candidates[0].obj;
}

/**
 * Marquee selection: checks which objects intersect with or are inside the marquee box
 */
export function getObjectsInMarquee(
  box: { startX: number; startY: number; currentX: number; currentY: number },
  objects: LayoutObject[]
): string[] {
  const minX = Math.min(box.startX, box.currentX);
  const maxX = Math.max(box.startX, box.currentX);
  const minY = Math.min(box.startY, box.currentY);
  const maxY = Math.max(box.startY, box.currentY);

  const selectedIds: string[] = [];

  for (const obj of objects) {
    if (obj.hidden || obj.locked) continue;
    // Object bounding box (ignoring complex rotation for marquee simplicity)
    const objMinX = obj.x;
    const objMaxX = obj.x + obj.w;
    const objMinY = obj.y;
    const objMaxY = obj.y + obj.h;

    // Check intersection with marquee
    const intersects =
      objMinX <= maxX &&
      objMaxX >= minX &&
      objMinY <= maxY &&
      objMaxY >= minY;

    if (intersects) {
      selectedIds.push(obj.id);
    }
  }

  return selectedIds;
}

/**
 * Rotate a 2D delta vector by an angle in degrees
 */
export function rotateVector(dx: number, dy: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: cos * dx - sin * dy,
    y: sin * dx + cos * dy,
  };
}

/**
 * Dynamically compute screen-space cursor direction based on object rotation
 */
export function getRotatedHandleCursor(handle: ResizeHandle, rotation = 0): string {
  const baseAngles: Record<ResizeHandle, number> = {
    e: 0,
    se: 45,
    s: 90,
    sw: 135,
    w: 180,
    nw: 225,
    n: 270,
    ne: 315,
  };
  const effectiveAngle = (baseAngles[handle] + rotation + 360) % 180;
  if (effectiveAngle >= 22.5 && effectiveAngle < 67.5) {
    return 'nwse-resize';
  }
  if (effectiveAngle >= 67.5 && effectiveAngle < 112.5) {
    return 'ns-resize';
  }
  if (effectiveAngle >= 112.5 && effectiveAngle < 157.5) {
    return 'nesw-resize';
  }
  return 'ew-resize';
}

/**
 * Calculate 8-way resize transform for an object given active handle and mouse delta.
 * Supports both proportional (aspect ratio locked) and non-proportional (independent) scaling,
 * as well as center-anchored scaling.
 */
export function calculateResize(
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  initial: { x: number; y: number; w: number; h: number; rotation: number },
  snapGrid = 1,
  minSize = 10,
  proportional = false,
  fromCenter = false
): { x: number; y: number; w: number; h: number } {
  const rot = initial.rotation || 0;
  // Convert mouse delta to object's local rotated space
  const localDelta = rotateVector(deltaX, deltaY, -rot);
  const lx = localDelta.x;
  const ly = localDelta.y;

  const aspectRatio = Math.max(0.01, initial.w / Math.max(1, initial.h));

  let nw = initial.w;
  let nh = initial.h;
  let offsetX = 0;
  let offsetY = 0;

  const isCorner = handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw';

  if (isCorner && proportional) {
    // Proportional scaling for corners
    let scale = 1;
    if (handle === 'se') {
      const scaleX = (initial.w + lx) / initial.w;
      const scaleY = (initial.h + ly) / initial.h;
      scale = Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY;
      nw = Math.max(minSize, initial.w * scale);
      nh = Math.max(minSize, nw / aspectRatio);
    } else if (handle === 'sw') {
      const scaleX = (initial.w - lx) / initial.w;
      const scaleY = (initial.h + ly) / initial.h;
      scale = Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY;
      nw = Math.max(minSize, initial.w * scale);
      nh = Math.max(minSize, nw / aspectRatio);
      offsetX = initial.w - nw;
    } else if (handle === 'ne') {
      const scaleX = (initial.w + lx) / initial.w;
      const scaleY = (initial.h - ly) / initial.h;
      scale = Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY;
      nw = Math.max(minSize, initial.w * scale);
      nh = Math.max(minSize, nw / aspectRatio);
      offsetY = initial.h - nh;
    } else if (handle === 'nw') {
      const scaleX = (initial.w - lx) / initial.w;
      const scaleY = (initial.h - ly) / initial.h;
      scale = Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY;
      nw = Math.max(minSize, initial.w * scale);
      nh = Math.max(minSize, nw / aspectRatio);
      offsetX = initial.w - nw;
      offsetY = initial.h - nh;
    }
  } else if (!isCorner && proportional) {
    // Proportional scaling from midpoint edges
    if (handle === 'e') {
      nw = Math.max(minSize, initial.w + lx);
      nh = Math.max(minSize, nw / aspectRatio);
      offsetY = (initial.h - nh) / 2;
    } else if (handle === 'w') {
      nw = Math.max(minSize, initial.w - lx);
      nh = Math.max(minSize, nw / aspectRatio);
      offsetX = initial.w - nw;
      offsetY = (initial.h - nh) / 2;
    } else if (handle === 's') {
      nh = Math.max(minSize, initial.h + ly);
      nw = Math.max(minSize, nh * aspectRatio);
      offsetX = (initial.w - nw) / 2;
    } else if (handle === 'n') {
      nh = Math.max(minSize, initial.h - ly);
      nw = Math.max(minSize, nh * aspectRatio);
      offsetX = (initial.w - nw) / 2;
      offsetY = initial.h - nh;
    }
  } else {
    // Non-proportional 8-way scaling (corners and midpoints independently)
    // Width changes
    if (handle === 'e' || handle === 'ne' || handle === 'se') {
      nw = Math.max(minSize, initial.w + lx);
    } else if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      nw = Math.max(minSize, initial.w - lx);
      offsetX = initial.w - nw;
    }

    // Height changes
    if (handle === 's' || handle === 'se' || handle === 'sw') {
      nh = Math.max(minSize, initial.h + ly);
    } else if (handle === 'n' || handle === 'nw' || handle === 'ne') {
      nh = Math.max(minSize, initial.h - ly);
      offsetY = initial.h - nh;
    }
  }

  // Snap dimensions if snapGrid is enabled
  if (snapGrid > 1) {
    const snappedW = Math.max(minSize, Math.round(nw / snapGrid) * snapGrid);
    const snappedH = Math.max(minSize, Math.round(nh / snapGrid) * snapGrid);

    if (offsetX !== 0) {
      offsetX = initial.w - snappedW;
    }
    if (offsetY !== 0) {
      offsetY = initial.h - snappedH;
    }
    nw = snappedW;
    nh = snappedH;
  }

  // Center-anchored scaling if Alt key held
  if (fromCenter) {
    offsetX = (initial.w - nw) / 2;
    offsetY = (initial.h - nh) / 2;
  }

  // Calculate new world position based on local offset
  const worldOffset = rotateVector(offsetX, offsetY, rot);
  const nx = initial.x + worldOffset.x;
  const ny = initial.y + worldOffset.y;

  return { x: nx, y: ny, w: nw, h: nh };
}
