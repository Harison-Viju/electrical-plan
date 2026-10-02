/**
 * Architectural Preset Templates for Electrical Layout CAD
 */

import { DocumentState } from '../types/layout';
import { parseELS } from '../utils/elsParser';
import { DEFAULTS } from './symbols';

export const REFERENCE_ELS = `ELS 1
page A4 portrait border
room "Hall" at 40,80 size 700x1050
divider h at 55% dashed
divider h at 67% dashed
divider h at 85% dashed
led x=15%,34%,65%,80% y=9%,19%,29%,46%
led x=15%,42%,64%,91% y=77%
led x=15%,34%,64%,83% y=93%
fan at 28%,40%
fan at 74%,40%
fan at 29%,77%
fan at 78%,77%
socket15 wall=right y=5%,13%,21%,29%,36%,44%,52%
socket15 wall=left y=19%,29%,77%
socket5 wall=top x=48%
box "LED TV" at 17%,57% size 210x22 label=below
box "LED TV" at 52%,57% size 210x22 label=below
box "AIR CURTAIN" at 31%,67% size 330x50 label=inside
legend auto at right`;

export const COMPLEX_HALL_ELS = `ELS 1
page A4 landscape border
room "Main Exhibition Hall" at 40,70 size 600x680
room "Executive Office" at 660,70 size 430x320
room "Conference Room" at 660,410 size 430x340
divider h at 50% dashed
led x=12%,30%,50%,70%,88% y=15%,35%,65%,85%
fan at 30%,35%
fan at 70%,35%
fan at 50%,75%
socket15 wall=right y=15%,35%,55%,75%
socket15 wall=left y=20%,40%,60%,80%
socket5 wall=top x=30%,70%
box "DB PANEL 63A" at 680,100 size 140x50 label=inside
box "CONFERENCE AV DISPLAY" at 710,440 size 260x30 label=below
box "AIR CURTAIN" at 180,680 size 320x45 label=inside
legend auto at 900,100`;

export function getInitialDocument(): DocumentState {
  const parsed = parseELS(REFERENCE_ELS, DEFAULTS.page);
  return {
    version: 1,
    symbolSet: 'house-v1',
    title: 'Reference Electrical Layout (Hall)',
    page: parsed.page,
    objects: parsed.objects,
  };
}

export function getComplexHallDocument(): DocumentState {
  const parsed = parseELS(COMPLEX_HALL_ELS, {
    ...DEFAULTS.page,
    orientation: 'landscape',
    w: 1130,
    h: 800,
  });
  return {
    version: 1,
    symbolSet: 'house-v1',
    title: 'Commercial Complex (Hall & Offices)',
    page: parsed.page,
    objects: parsed.objects,
  };
}
