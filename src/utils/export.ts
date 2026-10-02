/**
 * Export and File IO Utilities (SVG, PNG 300DPI, JSON Backup)
 */

import { DocumentState } from '../types/layout';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function generateCleanSvgString(svgEl: SVGSVGElement, pageW: number, pageH: number): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  // Remove interactive and UI layers
  clone.querySelector('#selectionLayer')?.remove();
  clone.querySelector('#previewLayer')?.remove();
  clone.querySelector('#grid')?.remove();
  clone.querySelector('#marqueeLayer')?.remove();

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(pageW));
  clone.setAttribute('height', String(pageH));
  clone.setAttribute('viewBox', `0 0 ${pageW} ${pageH}`);

  const defs = clone.querySelector('defs') || clone.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), clone.firstChild);
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    .room-stroke { fill: none; stroke: #111827; stroke-width: 4px; }
    .divider-stroke { fill: none; stroke: #111827; stroke-width: 2px; stroke-dasharray: 8 6; }
    .symbol-stroke { fill: none; stroke: #111827; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round; }
    .object-label { fill: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 600; text-anchor: middle; }
    .paper { fill: #ffffff; stroke: #cbd5e1; stroke-width: 1px; }
  `;
  defs.appendChild(style);

  return new XMLSerializer().serializeToString(clone);
}

export function exportSVG(svgEl: SVGSVGElement, filename: string, pageW: number, pageH: number) {
  const svgStr = generateCleanSvgString(svgEl, pageW, pageH);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

export function exportPNG(
  svgEl: SVGSVGElement,
  filename: string,
  pageW: number,
  pageH: number,
  scale = 2
) {
  const svgStr = generateCleanSvgString(svgEl, pageW, pageH);
  const img = new Image();
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = pageW * scale;
    canvas.height = pageH * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(pngBlob => {
        if (pngBlob) {
          downloadBlob(pngBlob, filename.endsWith('.png') ? filename : `${filename}.png`);
        }
        URL.revokeObjectURL(url);
      }, 'image/png');
    }
  };

  img.src = url;
}

export function exportJSON(doc: DocumentState, filename: string) {
  const jsonStr = JSON.stringify(doc, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}
