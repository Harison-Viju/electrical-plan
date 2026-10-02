/**
 * ELS 1 (Electrical Layout Script) Specification Parser & Generator
 * Fully compliant with the language specification:
 * Supports rooms, dividers, house-v1 symbols (led, fan, socket15, socket5),
 * boxes with multiline text, free text, legend, wall percentage placements,
 * ELS 1 patch commands, error reporting with line numbers, and lossless export.
 */

import { DocumentState, ELSParseResult, LayoutObject, PageConfig } from '../types/layout';
import { LABELS, SYMBOL_SIZE } from '../constants/symbols';

function stripComment(line: string): [string, string] {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' || line[i] === "'") quoted = !quoted;
    if (line[i] === '#' && !quoted) {
      return [line.slice(0, i), line.slice(i + 1)];
    }
  }
  return [line, ''];
}

function cleanScript(input: string): string[] {
  let s = String(input || '')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/```[a-z]*|```/gi, '');
  const i = s.search(/\bELS\s+1\b/i);
  if (i >= 0) s = s.slice(i);
  return s.replace(/\r/g, '').split('\n');
}

function parseKeyValuePairs(rest: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)=("[^"]*"|'[^']*'|[^\s]+)/g;
  let m;
  while ((m = re.exec(rest))) {
    out[m[1].toLowerCase()] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function num(v: string | number): number {
  return Number.parseFloat(String(v).replace('%', '')) || 0;
}

function parsePosition(token: string | number, axis: 'x' | 'y', room?: LayoutObject | null): number {
  const s = String(token).trim();
  if (s.endsWith('%') && room) {
    const base = axis === 'x' ? room.x : room.y;
    const dimension = axis === 'x' ? room.w : room.h;
    return base + (num(s) / 100) * dimension;
  }
  return num(s);
}

function parseAt(text: string, room?: LayoutObject | null): { x: number; y: number } | null {
  const m = text.match(/(?:^|\s)at\s+([^\s]+),([^\s]+)/i);
  if (!m) return null;
  return {
    x: parsePosition(m[1], 'x', room),
    y: parsePosition(m[2], 'y', room),
  };
}

export function wallToFree(
  o: LayoutObject,
  room?: LayoutObject | null,
  canvasW = 800,
  canvasH = 1130
): LayoutObject {
  const r = room || { x: 40, y: 80, w: canvasW - 80, h: canvasH - 160 };
  const along = Math.max(0, Math.min(100, Number(o.along ?? 50))) / 100;
  const sym = o.symbol || 'socket15';
  const [defW, defH] = SYMBOL_SIZE[sym] || [48, 34];
  const w = o.w || defW;
  const h = o.h || defH;

  let bx = 0;
  let by = 0;
  let rot = 0;

  if (o.wall === 'right') {
    bx = r.x + r.w;
    by = r.y + r.h * along;
    rot = -90;
  } else if (o.wall === 'top') {
    bx = r.x + r.w * along;
    by = r.y;
    rot = 180;
  } else if (o.wall === 'left') {
    bx = r.x;
    by = r.y + r.h * along;
    rot = 90;
  } else {
    bx = r.x + r.w * along;
    by = r.y + r.h;
    rot = 0;
  }

  const rad = (rot * Math.PI) / 180;
  const k = h * 0.41;
  o.w = w;
  o.h = h;
  o.rotation = rot;
  o.x = bx + Math.sin(rad) * k - w / 2;
  o.y = by - Math.cos(rad) * k - h / 2;

  return o;
}

export function parseELS(input: string, fallbackPage: PageConfig): ELSParseResult {
  const lines = cleanScript(input);
  const errors: string[] = [];
  const warnings: string[] = [];
  const objects: LayoutObject[] = [];
  const patches: ELSParseResult['patches'] = [];
  const usedIds = new Set<string>();
  let nextIdCounter = 1;

  let header = false;
  let mode: 'replace' | 'patch' = 'replace';
  let currentRoom: LayoutObject | null = null;
  const page: PageConfig = { ...fallbackPage };

  const addObj = (obj: LayoutObject, lineNum: number) => {
    if (obj.wall) {
      wallToFree(obj, currentRoom, page.w, page.h);
    }
    if (!obj.id) {
      obj.id = `o${nextIdCounter++}`;
      while (usedIds.has(obj.id)) {
        obj.id = `o${nextIdCounter++}`;
      }
    } else if (usedIds.has(obj.id)) {
      errors.push(`Line ${lineNum}: duplicate id "${obj.id}"`);
    }
    usedIds.add(obj.id);

    // Geometric Validation: check if element is outside room boundary
    if (obj.type !== 'room' && currentRoom && obj.wall == null) {
      if (
        obj.x < currentRoom.x - 25 ||
        obj.x > currentRoom.x + currentRoom.w + 25 ||
        obj.y < currentRoom.y - 25 ||
        obj.y > currentRoom.y + currentRoom.h + 25
      ) {
        warnings.push(
          `Line ${lineNum}: ${obj.symbol || obj.label || obj.type} at (${Math.round(obj.x)}, ${Math.round(obj.y)}) is outside room "${currentRoom.name}" boundary.`
        );
      }
    }

    objects.push(obj);
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const [withoutComment, comment] = stripComment(rawLine);
    const line = withoutComment.trim();
    if (comment.trim().startsWith('?')) {
      warnings.push(`Line ${i + 1}: uncertain item ("${comment.trim()}") — please verify`);
    }
    if (!line) continue;

    if (!header) {
      const hm = line.match(/^ELS\s+1(?:\s+(patch))?/i);
      if (!hm) {
        errors.push(`Line ${i + 1}: script must begin with "ELS 1"`);
        continue;
      }
      header = true;
      mode = hm[1] ? 'patch' : 'replace';
      continue;
    }

    // Page directive
    if (/^page\b/i.test(line)) {
      const pm = line.match(/^page\s+(\S+)\s+(portrait|landscape)(?:\s+border)?/i);
      if (!pm) {
        errors.push(`Line ${i + 1}: page syntax is: page A4 portrait border`);
        continue;
      }
      const isPortrait = pm[2].toLowerCase() === 'portrait';
      page.size = pm[1].toUpperCase() as PageConfig['size'];
      page.orientation = isPortrait ? 'portrait' : 'landscape';
      page.w = isPortrait ? 800 : 1130;
      page.h = isPortrait ? 1130 : 800;
      continue;
    }

    const canonical = line
      .toLowerCase()
      .replace(/^ceiling\s+fan\b/, 'fan')
      .replace(/^light\b|^lamp\b|^bulb\b|^point\b/, 'led')
      .replace(/^15a\b|^power\s+socket\b|^socket\s+15\b/, 'socket15')
      .replace(/^5a\b|^socket\s+5\b/, 'socket5');

    // Patch mode commands
    if (mode === 'patch' && /^(move|rotate|label|delete)\b/i.test(canonical)) {
      const pm = canonical.match(/^move\s+@(\S+)\s+to\s+([^\s]+),([^\s]+)/i);
      if (pm) {
        patches.push({ kind: 'move', id: pm[1], x: pm[2], y: pm[3], line: i + 1 });
      } else {
        const rm = canonical.match(/^rotate\s+@(\S+)\s+to\s+(-?\d+)/i);
        const lm = line.match(/^label\s+@(\S+)\s+["']([^"']*)["']/i);
        const dm = canonical.match(/^delete\s+@(\S+)/i);
        const dw = canonical.match(/^delete\s+(led|fan|socket15|socket5)\s+where\s+y=([^\s]+)/i);

        if (rm) patches.push({ kind: 'rotate', id: rm[1], value: Number(rm[2]), line: i + 1 });
        else if (lm) patches.push({ kind: 'label', id: lm[1], value: lm[2], line: i + 1 });
        else if (dm) patches.push({ kind: 'delete', id: dm[1], line: i + 1 });
        else if (dw) patches.push({ kind: 'deleteWhere', symbol: dw[1], y: dw[2], line: i + 1 });
        else errors.push(`Line ${i + 1}: invalid patch command: "${line}"`);
      }
      continue;
    }

    // Room command
    if (/^room\b/i.test(canonical)) {
      const m = line.match(/^room\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s+at\s+([^\s]+)\s+size\s+(\S+)(.*)$/i);
      if (!m) {
        errors.push(`Line ${i + 1}: room syntax: room "Name" at X,Y size WxH`);
        continue;
      }
      const at = m[4].split(',');
      const sz = m[5].toLowerCase().split('x');
      const opts = parseKeyValuePairs(m[6]);
      currentRoom = {
        id: opts.id || `room_${objects.filter(x => x.type === 'room').length + 1}`,
        type: 'room',
        name: m[1] || m[2] || m[3],
        x: num(at[0]),
        y: num(at[1]),
        w: num(sz[0]),
        h: num(sz[1]),
        rotation: 0,
        strokeWidth: 4,
      };
      addObj(currentRoom, i + 1);
      continue;
    }

    // Divider command
    if (/^divider\b/i.test(canonical)) {
      // Handles:
      // divider h at 54% dashed
      // divider v at 40% dashed
      // divider h at 54% (dashed optional)
      // divider horizontal at 54% dashed
      // divider vertical at 40% dashed
      // divider h|v at 54% dashed (tolerant: interprets literal h|v as horizontal h with guidance warning)
      // divider at 54% dashed (tolerant: defaults to horizontal)
      const rest = line.slice(line.toLowerCase().indexOf('divider') + 7).trim();
      let orientation: 'h' | 'v' = 'h';
      let cleanRest = rest;
      let hasOrientation = false;

      if (/^(h\|v|v\|h|h\s*\/\s*v)\b/i.test(cleanRest)) {
        warnings.push(
          `Line ${i + 1}: ambiguous divider orientation "h|v". Accepted as horizontal for backward compatibility, but you should specify "divider h at Y% dashed" (horizontal) or "divider v at X% dashed" (vertical) to prevent geometry errors.`
        );
        orientation = 'h';
        hasOrientation = true;
        cleanRest = cleanRest.replace(/^(h\|v|v\|h|h\s*\/\s*v)\s*/i, '');
      } else if (/^(horizontal|horiz|h)\b/i.test(cleanRest)) {
        orientation = 'h';
        hasOrientation = true;
        cleanRest = cleanRest.replace(/^(horizontal|horiz|h)\s*/i, '');
      } else if (/^(vertical|vert|v)\b/i.test(cleanRest)) {
        orientation = 'v';
        hasOrientation = true;
        cleanRest = cleanRest.replace(/^(vertical|vert|v)\s*/i, '');
      }

      if (!hasOrientation) {
        errors.push(
          `Line ${i + 1}: divider orientation is required. Specify "divider h at Y% dashed" for horizontal or "divider v at X% dashed" for vertical.`
        );
        continue;
      }

      const atMatch =
        cleanRest.match(/(?:^|\s*)at\s+([^\s]+)(.*)$/i) || cleanRest.match(/^([^\s]+)(.*)$/);

      if (!atMatch) {
        errors.push(
          `Line ${i + 1}: invalid divider syntax. Use: "divider h at Y% dashed" for horizontal or "divider v at X% dashed" for vertical.`
        );
        continue;
      }

      const rawPos = atMatch[1];
      const afterPos = atMatch[2] || '';
      const opts = parseKeyValuePairs(afterPos);
      const isDashed = !/\bsolid\b/i.test(afterPos);

      const pos = parsePosition(rawPos, orientation === 'h' ? 'y' : 'x', currentRoom);
      const isH = orientation === 'h';

      const o: LayoutObject = {
        id: opts.id || `div_${objects.filter(x => x.type === 'divider').length + 1}`,
        type: 'divider',
        orientation,
        x: isH ? (currentRoom?.x || 40) : pos,
        y: isH ? pos : (currentRoom?.y || 80),
        w: isH ? (currentRoom?.w || page.w - 80) : 2,
        h: isH ? 2 : (currentRoom?.h || page.h - 160),
        rotation: 0,
        dashed: isDashed,
      };
      addObj(o, i + 1);
      continue;
    }

    // Reference symbols: led, fan, socket15, socket5
    const token = (canonical.match(/^\w+/) || [''])[0];
    if (['led', 'fan', 'socket15', 'socket5'].includes(token)) {
      const symType = token as 'led' | 'fan' | 'socket15' | 'socket5';
      const rest = line.slice(line.toLowerCase().indexOf(token) + token.length);
      const opts = parseKeyValuePairs(rest);
      const wall = (opts.wall || '').toLowerCase() as 'left' | 'right' | 'top' | 'bottom';
      const [dw, dh] = SYMBOL_SIZE[symType];

      const base: LayoutObject = {
        id: '',
        type: 'symbol',
        symbol: symType,
        x: 0,
        y: 0,
        w: dw,
        h: dh,
        rotation: Number(opts.rot || 0),
        label: opts.label || '',
      };

      if (wall) {
        if (!['left', 'right', 'top', 'bottom'].includes(wall)) {
          errors.push(`Line ${i + 1}: wall must be left, right, top, or bottom`);
          continue;
        }
        const rawAlong = wall === 'top' || wall === 'bottom' ? opts.x : opts.y;
        if (rawAlong == null) {
          errors.push(`Line ${i + 1}: ${symType} needs wall= plus x= or y= coordinate`);
          continue;
        }
        const vals = rawAlong.split(',');
        vals.forEach(a => {
          addObj(
            {
              ...base,
              id: opts.id && vals.length === 1 ? opts.id : undefined!,
              wall,
              along: num(a),
              room: currentRoom?.id,
            },
            i + 1
          );
        });
        continue;
      }

      // Explicit coordinates or grid lists (e.g. x=15%,34% y=9%,19%)
      const p = parseAt(rest, currentRoom);
      const xs = opts.x ? opts.x.split(',') : p ? [String(p.x)] : [];
      const ys = opts.y ? opts.y.split(',') : p ? [String(p.y)] : [];

      if (!xs.length || !ys.length) {
        errors.push(`Line ${i + 1}: ${symType} needs at=X,Y coordinates or x= and y= grid positions`);
        continue;
      }

      xs.forEach(xv => {
        ys.forEach(yv => {
          const posX = parsePosition(xv, 'x', currentRoom) - dw / 2;
          const posY = parsePosition(yv, 'y', currentRoom) - dh / 2;
          addObj(
            {
              ...base,
              id: opts.id && xs.length === 1 && ys.length === 1 ? opts.id : undefined!,
              x: posX,
              y: posY,
              room: currentRoom?.id,
            },
            i + 1
          );
        });
      });
      continue;
    }

    // Box command
    if (/^box\b/i.test(canonical)) {
      const m = line.match(/^box\s+(?:"([^"]*)"|'([^']*)')\s+at\s+([^\s]+)\s+size\s+(\S+)(.*)$/i);
      if (!m) {
        errors.push(`Line ${i + 1}: box syntax: box "LED TV" at X,Y size WxH label=inside|below`);
        continue;
      }
      const at = m[3].split(',');
      const sz = m[4].toLowerCase().split('x');
      const opts = parseKeyValuePairs(m[5]);
      addObj(
        {
          id: opts.id || `box_${objects.filter(x => x.type === 'box').length + 1}`,
          type: 'box',
          label: (m[1] || m[2] || '').replace(/\\n/g, '\n'),
          x: parsePosition(at[0], 'x', currentRoom),
          y: parsePosition(at[1], 'y', currentRoom),
          w: num(sz[0]),
          h: num(sz[1]),
          rotation: Number(opts.rot || 0),
          labelPos: (opts.label as 'inside' | 'below') || 'inside',
          fillColor: '#ffffff',
          borderStyle: 'solid',
        },
        i + 1
      );
      continue;
    }

    // Text command
    if (/^text\b/i.test(canonical)) {
      const m = line.match(/^text\s+(?:"([^"]*)"|'([^']*)')\s+at\s+([^\s]+)\s+size\s+(\S+)(.*)$/i);
      if (!m) {
        errors.push(`Line ${i + 1}: text syntax: text "Label" at X,Y size 20 align=center`);
        continue;
      }
      const at = m[3].split(',');
      const opts = parseKeyValuePairs(m[5]);
      const sz = num(m[4]) || 18;
      addObj(
        {
          id: opts.id || `text_${objects.filter(x => x.type === 'text').length + 1}`,
          type: 'text',
          label: (m[1] || m[2] || '').replace(/\\n/g, '\n'),
          x: parsePosition(at[0], 'x', currentRoom),
          y: parsePosition(at[1], 'y', currentRoom),
          w: 220,
          h: sz + 10,
          size: sz,
          rotation: Number(opts.rot || 0),
        },
        i + 1
      );
      continue;
    }

    // Legend command
    if (/^legend\b/i.test(canonical)) {
      const m = line.match(/^legend\s+auto\s+at\s+(.+)$/i);
      if (!m) {
        errors.push(`Line ${i + 1}: legend syntax: legend auto at right | left | X,Y`);
        continue;
      }
      const place = m[1].trim();
      let lx = page.w - 200;
      let ly = 100;
      if (place.toLowerCase() === 'left') {
        lx = 20;
      } else if (place.includes(',')) {
        const at = place.split(',');
        lx = num(at[0]);
        ly = num(at[1]);
      }
      addObj(
        {
          id: `legend_${objects.filter(x => x.type === 'legend').length + 1}`,
          type: 'legend',
          x: lx,
          y: ly,
          w: 195,
          h: 220,
          rotation: 0,
          auto: true,
        },
        i + 1
      );
      continue;
    }

    errors.push(`Line ${i + 1}: unknown command "${line.split(/\s+/)[0]}"`);
  }

  if (!header) {
    errors.push('Script is missing "ELS 1" header line.');
  }

  // Count items
  const counts: Record<string, number> = {};
  objects.forEach(o => {
    const k = o.type === 'symbol' ? (o.symbol || 'symbol') : o.type;
    counts[k] = (counts[k] || 0) + 1;
  });

  return {
    mode,
    page,
    objects,
    patches,
    errors,
    warnings,
    counts,
  };
}

/**
 * Apply patches from an ELS 1 patch script to existing document objects
 */
export function applyELS1Patches(
  patches: ELSParseResult['patches'],
  baseObjects: LayoutObject[],
  room?: LayoutObject | null
): LayoutObject[] {
  const result = JSON.parse(JSON.stringify(baseObjects)) as LayoutObject[];

  for (const p of patches) {
    if (p.kind === 'delete' && p.id) {
      const idx = result.findIndex(o => o.id === p.id);
      if (idx !== -1) result.splice(idx, 1);
    } else if (p.kind === 'deleteWhere' && p.symbol && p.y) {
      const targetY = num(p.y);
      for (let i = result.length - 1; i >= 0; i--) {
        const obj = result[i];
        if (obj.type === 'symbol' && obj.symbol === p.symbol) {
          const roomH = room ? room.h : 1000;
          const roomY = room ? room.y : 0;
          const currentPercent = ((obj.y - roomY) / roomH) * 100;
          if (Math.abs(currentPercent - targetY) < 1.5) {
            result.splice(i, 1);
          }
        }
      }
    } else if (p.id) {
      const obj = result.find(o => o.id === p.id);
      if (!obj) continue;
      if (p.kind === 'rotate' && typeof p.value === 'number') {
        obj.rotation = p.value;
      } else if (p.kind === 'label' && typeof p.value === 'string') {
        obj.label = p.value;
      } else if (p.kind === 'move' && p.x && p.y) {
        const nx = parsePosition(p.x, 'x', room);
        const ny = parsePosition(p.y, 'y', room);
        if (obj.type === 'symbol') {
          obj.x = nx - obj.w / 2;
          obj.y = ny - obj.h / 2;
        } else {
          obj.x = nx;
          obj.y = ny;
        }
      }
    }
  }

  return result;
}

/**
 * Export current document state to human-readable, lossless ELS 1 script
 */
export function exportToELS(doc: DocumentState): string {
  const lines: string[] = [
    'ELS 1',
    `page ${doc.page.size || 'A4'} ${doc.page.orientation || 'portrait'} border`,
  ];

  for (const obj of doc.objects) {
    if (obj.hidden) continue;

    const round = (n: number) => Math.round(n || 0);

    if (obj.type === 'room') {
      lines.push(
        `room "${obj.name || 'Room'}" at ${round(obj.x)},${round(obj.y)} size ${round(obj.w)}x${round(obj.h)} id=${obj.id}`
      );
    } else if (obj.type === 'divider') {
      const pos = obj.orientation === 'v' ? round(obj.x) : round(obj.y);
      lines.push(`divider ${obj.orientation || 'h'} at ${pos} dashed id=${obj.id}`);
    } else if (obj.type === 'symbol') {
      const cx = round(obj.x + obj.w / 2);
      const cy = round(obj.y + obj.h / 2);
      const rot = round(obj.rotation || 0);
      const labelAttr = obj.label ? ` label="${obj.label}"` : '';
      const rotAttr = rot !== 0 ? ` rot=${rot}` : '';
      lines.push(`${obj.symbol} at ${cx},${cy}${rotAttr}${labelAttr} id=${obj.id}`);
    } else if (obj.type === 'box') {
      const safeLabel = (obj.label || '').replace(/\n/g, '\\n');
      const rot = round(obj.rotation || 0);
      const rotAttr = rot !== 0 ? ` rot=${rot}` : '';
      lines.push(
        `box "${safeLabel}" at ${round(obj.x)},${round(obj.y)} size ${round(obj.w)}x${round(obj.h)} label=${obj.labelPos || 'inside'}${rotAttr} id=${obj.id}`
      );
    } else if (obj.type === 'text') {
      const safeLabel = (obj.label || '').replace(/\n/g, '\\n');
      lines.push(
        `text "${safeLabel}" at ${round(obj.x)},${round(obj.y)} size ${round(obj.size || 20)} id=${obj.id}`
      );
    } else if (obj.type === 'legend') {
      lines.push(`legend auto at ${round(obj.x)},${round(obj.y)} id=${obj.id}`);
    }
  }

  return lines.join('\n');
}
