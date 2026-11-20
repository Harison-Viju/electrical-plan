/**
 * AI Helper Prompts Modal (External Assistant Prompt Templates)
 */

import React, { useState } from 'react';
import { DocumentState } from '../types/layout';
import { exportToELS } from '../utils/elsParser';
import { Sparkles, Copy, Check } from 'lucide-react';

interface AiHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentState;
}

export const AiHelperModal: React.FC<AiHelperModalProps> = ({ isOpen, onClose, doc }) => {
  const [promptKey, setPromptKey] = useState<'sketch' | 'edit' | 'fix'>('sketch');
  const [copied, setCopied] = useState(false);

  const getPromptText = () => {
    if (promptKey === 'sketch') {
      return `You are an expert CAD engineer converting an electrical layout sketch into ELS 1 (Electrical Layout Script).
Reply with ONE code block containing ONLY the script. No explanations or text outside the code fence.

CRITICAL SYNTAX RULES:
1. Set the page orientation to match the sketch. This reference is wide, so use the directive "page A4 landscape border".
2. The drawing canvas is 1130 units wide by 800 units high for A4 landscape. Normalize the drawing to that canvas with a 40-unit margin. Never copy raw photo pixel coordinates such as 1600,1200 into the script. Keep all geometry within the page; the app will proportionally fit the result as a safeguard.
3. Room coordinates are top-left x,y; room dimensions are width x height. Symbols use their CENTER for at X,Y; boxes use their TOP-LEFT for at X,Y.
4. Use numeric page coordinates for objects in multi-room plans. Percentage positions on symbols are relative to the most recently declared room and can place them in the wrong room.
5. NEVER output documentation grammar notation such as "h|v", "x|y", or "inside|below". The "|" symbol represents alternatives in specifications, NOT literal script text.
6. Dividers MUST always explicitly declare orientation. In multi-room plans use numeric page coordinates and explicit line geometry:
   - "divider h at Y% dashed" (horizontal partition across room)
   - "divider v at X% dashed" (vertical partition)
   - "divider h at Y solid x=X y=Y w=W h=2" (page-positioned horizontal wall)
   - "divider v at X solid x=X y=Y w=2 h=H" (page-positioned vertical wall)
   NEVER omit the "h" or "v" orientation.
7. ALLOWED OBJECTS ONLY:
   - led x=15%,34%,65% y=9%,19% (or individual: led at X%,Y%)
   - fan at X%,Y%
   - wallfan at X%,Y% (wall-mounted fan with a short wall stem and figure-eight head)
   - exhaust at X%,Y% (figure-eight lobes with a center dot)
   - tubelight at X,Y (horizontal tube with short end caps)
   - Optional custom symbol size: socket5 at X,Y rot=180 w=32 h=24
   - socket15 wall=right y=9%,18% (or: socket15 at X%,Y%)
   - socket5 wall=top x=48% (or: socket5 at X%,Y%)
   - room "Room Name" at X,Y size WxH
   - divider h at Y% dashed
   - divider v at X% dashed
   - box "Text label\\nLine 2" at X,Y size WxH label=inside
   - text "Label" at X,Y size 20 align=center
   - legend auto at right
8. Verify every object's complete width and height fit within the page. Do not let labels or symbols overlap room labels, walls, or each other.
9. Carefully observe from the sketch whether partition lines are horizontal (h) or vertical (v).
10. Preserve the exact relative layout, alignments, and counts of all visible symbols.
11. For the corrected reference photo, reproduce the long upper hall and right annex, the open lower-right area, the lower-left outer frame with an inset room, and the passage/stair lines. Do not add room-name labels or ceiling fans that are not visible.
12. Do not confuse the symbols: LED is a small circle; 5A is one closed semicircle with three rays; 15A is two nested closed semicircles with three rays; exhaust fan is two horizontal oval lobes with a center dot; wall fan is a wall-touching stem ending in a figure-eight; tube light is a short bar with end caps.
13. When a legend is visible, preserve its title, exact symbol list, and order using this syntax: legend auto at X,Y size WxH title="LEGEND" symbols=tubelight,socket5,socket15,exhaust,wallfan,led.
14. For this specific floor plan, the normalized outer boundary is approximately x=40,y=50,w=1025,h=638; the main inset room begins near x=111,y=289 and is about 292x309; the annex divider is near x=933; the upper passage divider is near y=204; the lower wall is near y=289. Preserve these relative locations and keep the large lower-right area open for the legend.

Example:
ELS 1
page A4 landscape border
room "Hall" at 50,70 size 1030x650
divider h at 395 solid x=50 y=395 w=1030 h=2
led at 210,180
fan at 560,300
socket15 at 1030,240 rot=90
box "DB PANEL" at 880,600 size 150x52 label=inside
legend auto at 870,390 size 240x220 title="LEGEND" symbols=tubelight,socket5,socket15,exhaust,wallfan,led

Now convert the attached electrical layout sketch photo into ELS 1.`;
    }

    if (promptKey === 'edit') {
      return `Below is my current electrical drawing in ELS 1 format. Return ONE code block only.
Use "ELS 1 patch" for incremental changes (move @id to X,Y; rotate @id to Deg; delete @id), or full "ELS 1" for large changes.

CURRENT DRAWING ELS 1:
\`\`\`text
${exportToELS(doc)}
\`\`\`

CHANGE REQUESTED:
[Describe your modifications here, e.g. "Add 2 more fans in the hall, replace the 5A socket with 15A socket, and shift the TV box 50px to the right"]`;
    }

    return `Fix this ELS 1 electrical layout script. Return ONE code block only, with no markdown outside the code fence.

SCRIPT:
[Paste your script here]`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPromptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">AI Prompt Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <p className="text-slate-600">
            Copy these prompt templates into ChatGPT, Claude, or Gemini to convert drawing sketches into ELS 1 or generate floorplan modifications.
          </p>

          {/* Prompt Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPromptKey('sketch')}
              className={`py-1.5 px-3 rounded-md font-semibold border ${
                promptKey === 'sketch'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              1. Sketch Photo → Script
            </button>
            <button
              type="button"
              onClick={() => setPromptKey('edit')}
              className={`py-1.5 px-3 rounded-md font-semibold border ${
                promptKey === 'edit'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              2. Edit Current Drawing
            </button>
            <button
              type="button"
              onClick={() => setPromptKey('fix')}
              className={`py-1.5 px-3 rounded-md font-semibold border ${
                promptKey === 'fix'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              3. Fix Script Errors
            </button>
          </div>

          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={getPromptText()}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md flex items-center gap-2 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Prompt Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
