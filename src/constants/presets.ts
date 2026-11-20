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

/**
 * Editable reconstruction of Floor_Plan_Diagram_corrected_v2.png.
 * Coordinates are normalized from the image to an A4 landscape page.
 */
export const FATHERS_DRAWING_ELS = `ELS 1
page A4 landscape border
room "" at 40,50 size 1025x638 id=outer_boundary
room "" at 111,289 size 292x309 id=main_room
divider v at 933 solid x=933 y=50 w=2 h=239 id=annex_partition
divider h at 289 solid x=111 y=289 w=954 h=2 id=upper_bottom_wall
divider h at 204 solid x=126 y=204 w=686 h=2 id=corridor_wall
divider v at 126 solid x=126 y=204 w=2 h=85 id=corridor_left_wall
divider v at 403 solid x=403 y=289 w=2 h=399 id=lower_right_wall
divider h at 126 solid x=933 y=126 w=50 h=2 id=annex_shelf
divider h at 490 solid x=40 y=490 w=71 h=2 id=stair_1
divider h at 506 solid x=40 y=506 w=71 h=2 id=stair_2
divider h at 522 solid x=40 y=522 w=71 h=2 id=stair_3
divider h at 538 solid x=40 y=538 w=71 h=2 id=stair_4
divider h at 554 solid x=40 y=554 w=71 h=2 id=stair_5
divider h at 568 solid x=40 y=568 w=71 h=2 id=stair_6
box "" at 936,207 size 22x60 id=kwh_meter_box
text "KWh meter" at 967,221 size 14 w=88 h=20 id=kwh_meter_label
exhaust at 252,50 w=48 h=28 id=exhaust_top_1
exhaust at 463,50 w=48 h=28 id=exhaust_top_2
exhaust at 686,50 w=48 h=28 id=exhaust_top_3
wallfan at 361,64 w=42 h=28 id=wallfan_top_1
wallfan at 575,64 w=42 h=28 id=wallfan_top_2
led at 995,73 w=16 h=16 id=annex_led
tubelight at 120,128 rot=90 w=52 h=16 id=tube_upper_left
wallfan at 299,190 rot=180 w=42 h=28 id=wallfan_corridor_1
wallfan at 531,190 rot=180 w=42 h=28 id=wallfan_corridor_2
wallfan at 786,190 rot=180 w=42 h=28 id=wallfan_corridor_3
socket5 at 145,220 w=32 h=24 id=socket5_corridor_1
socket5 at 180,220 w=32 h=24 id=socket5_corridor_2
socket5 at 214,220 w=32 h=24 id=socket5_corridor_3
socket5 at 247,220 w=32 h=24 id=socket5_corridor_4
socket5 at 282,220 w=32 h=24 id=socket5_corridor_5
socket5 at 316,220 w=32 h=24 id=socket5_corridor_6
socket5 at 146,257 w=32 h=24 id=socket5_corridor_lower
tubelight at 439,222 w=58 h=16 id=tube_corridor
wallfan at 581,218 w=42 h=28 id=wallfan_corridor_lower
led at 580,188 w=16 h=16 id=led_corridor_1
led at 606,188 w=16 h=16 id=led_corridor_2
led at 632,188 w=16 h=16 id=led_corridor_3
led at 657,188 w=16 h=16 id=led_corridor_4
led at 683,188 w=16 h=16 id=led_corridor_5
led at 710,188 w=16 h=16 id=led_corridor_6
led at 736,188 w=16 h=16 id=led_corridor_7
socket5 at 911,220 rot=270 w=32 h=24 id=socket5_annex_1
socket5 at 911,257 rot=270 w=32 h=24 id=socket5_annex_2
exhaust at 244,289 w=48 h=28 id=exhaust_main_entry
socket15 at 132,315 rot=90 w=42 h=30 id=socket15_left_1
socket15 at 132,413 rot=90 w=42 h=30 id=socket15_left_2
socket15 at 132,455 rot=90 w=42 h=30 id=socket15_left_3
socket5 at 132,506 rot=90 w=34 h=24 id=socket5_left_1
socket5 at 132,539 rot=90 w=34 h=24 id=socket5_left_2
socket5 at 132,575 rot=90 w=34 h=24 id=socket5_left_3
socket5 at 403,464 rot=270 w=34 h=24 id=socket5_right_1
socket5 at 403,506 rot=270 w=34 h=24 id=socket5_right_2
socket5 at 403,542 rot=270 w=34 h=24 id=socket5_right_3
led at 93,349 w=16 h=16 id=led_outer_left_1
led at 79,439 w=16 h=16 id=led_outer_left_2
tubelight at 268,344 rot=0 w=58 h=16 id=tube_main_1
tubelight at 366,302 rot=90 w=58 h=16 id=tube_main_2
tubelight at 163,381 rot=90 w=58 h=16 id=tube_main_3
tubelight at 252,421 rot=90 w=58 h=16 id=tube_main_4
tubelight at 334,429 rot=90 w=58 h=16 id=tube_main_5
tubelight at 169,490 rot=90 w=58 h=16 id=tube_main_6
tubelight at 191,608 w=58 h=16 id=tube_main_7
tubelight at 301,608 w=58 h=16 id=tube_main_8
led at 90,662 w=16 h=16 id=led_bottom_1
led at 188,662 w=16 h=16 id=led_bottom_2
led at 270,662 w=16 h=16 id=led_bottom_3
led at 352,662 w=16 h=16 id=led_bottom_4
legend auto at 555,344 size 307x274 title="LEGEND" symbols=tubelight,socket5,socket15,exhaust,wallfan,led id=plan_legend`;

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

export function getFathersDrawing(): DocumentState {
  const page = { ...DEFAULTS.page, orientation: 'landscape' as const, w: 1130, h: 800 };
  const parsed = parseELS(FATHERS_DRAWING_ELS, page);
  return {
    version: 1,
    symbolSet: 'house-v1',
    title: "Father's Site Drawing",
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

