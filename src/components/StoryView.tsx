// StoryView.tsx — PGR-inspired Story Menu & Reading (light UI revamp)
// - FIX: Page splitting now ALWAYS breaks at sentence boundaries (., ?, !)
// - Fixed dialogue display and combat flow
// - BACK button only in ReviewModal
// - ADDED: Exit button in reading mode to properly exit without loop
// - SAFETY: added fallbacks for store functions to prevent "s is not a function" error

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { storyChapters } from '../data/story';
import type { StoryNode, StoryCollectible } from '../data/story';
import { identities } from '../data/identities';
import NormalReception from './NormalReception';

const IS_WIP = true;

// ─── Page splitting ─────────────────────────────────────────────────────
const CHARS_PER_PAGE = 300;

function splitIntoPages(text: string): string[] {
  if (!text) return [''];
  const pages: string[] = [];
  let remaining = text.trim();

  while (remaining.length > CHARS_PER_PAGE) {
    let breakPoint = -1;

    // Try to find a sentence boundary: . ? ! followed by space
    // Look within a slightly larger range to avoid cutting mid-sentence
    const searchLimit = Math.min(CHARS_PER_PAGE + 50, remaining.length);
    
    // Priority: period + space (most common)
    const periodIdx = remaining.lastIndexOf('. ', searchLimit);
    if (periodIdx !== -1) {
      breakPoint = periodIdx + 1; // include the period
    }
    
    // If not found, try question mark + space
    if (breakPoint === -1) {
      const qIdx = remaining.lastIndexOf('? ', searchLimit);
      if (qIdx !== -1) breakPoint = qIdx + 1;
    }
    
    // If not found, try exclamation + space
    if (breakPoint === -1) {
      const exIdx = remaining.lastIndexOf('! ', searchLimit);
      if (exIdx !== -1) breakPoint = exIdx + 1;
    }

    // If still no sentence boundary, try a line break
    if (breakPoint === -1) {
      const nlIdx = remaining.lastIndexOf('\n\n', searchLimit);
      if (nlIdx !== -1) breakPoint = nlIdx;
    }

    // If still no break, try any space (but this means we'll cut mid-sentence)
    if (breakPoint === -1) {
      const spaceIdx = remaining.lastIndexOf(' ', searchLimit);
      if (spaceIdx !== -1) breakPoint = spaceIdx;
    }

    // Absolute fallback (should never happen)
    if (breakPoint === -1) {
      breakPoint = CHARS_PER_PAGE;
    }

    // Extract the chunk
    let chunk = remaining.slice(0, breakPoint).trim();
    remaining = remaining.slice(breakPoint).trim();

    // If chunk ends with a period, question, or exclamation that's not followed by space,
    // it might be an abbreviation – but we keep it anyway.
    if (chunk) pages.push(chunk);
    if (remaining.length === 0) break;

    // Safety: if remaining is now shorter but starts with a space, trim it
    remaining = remaining.trimStart();
  }

  if (remaining) pages.push(remaining);
  return pages;
}

// ─── Identity lookup helper ──────────────────────────────────────────────
function getIdentityDisplay(idOrName: string): { name: string; title?: string; portrait?: string; found: boolean } {
  const byId = identities.find(i => i.id === idOrName);
  if (byId) return { name: byId.name, title: byId.title, portrait: byId.portrait, found: true };
  const byName = identities.find(i => i.name.toLowerCase() === idOrName.toLowerCase());
  if (byName) return { name: byName.name, title: byName.title, portrait: byName.portrait, found: true };
  return { name: idOrName, found: false };
}

// ─── PGR-inspired Light Palette ─────────────────────────────────────────
const PGR = {
  bg: '#f4f5f7',
  bgDark: '#15161a',
  bgPanel: '#ffffff',
  bgElevated: '#fafbfc',
  bgSubtle: '#eef0f3',
  border: '#e3e5ea',
  borderActive: '#cfd3db',
  cyan: '#1ec8e0',
  cyanDim: 'rgba(30, 200, 224, 0.10)',
  cyanGlow: 'rgba(30, 200, 224, 0.35)',
  red: '#e5484d',
  redDim: 'rgba(229, 72, 77, 0.08)',
  amber: '#d98e2c',
  amberDim: 'rgba(217, 142, 44, 0.10)',
  green: '#2bb673',
  greenDim: 'rgba(43, 182, 115, 0.10)',
  text: '#23252b',
  textDim: '#7a7e88',
  textDark: '#aeb1b9',
  white: '#ffffff',
};

const PANEL_CLIP = 'polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)';
const BTN_CLIP = 'polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)';
const BADGE_CLIP = 'polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)';

function ScanlineOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
      }}
    />
  );
}

// ─── PGR Components ─────────────────────────────────────────────────────
function PGRButton({ children, onClick, variant = 'primary', className = '', disabled = false }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';
  className?: string;
  disabled?: boolean;
}) {
  const variants = {
    primary: { bg: 'rgba(30, 200, 224, 0.10)', border: 'rgba(30, 200, 224, 0.35)', text: '#0d8fa3', hoverBg: 'rgba(30, 200, 224, 0.18)' },
    secondary: { bg: 'rgba(0,0,0,0.03)', border: PGR.border, text: PGR.textDim, hoverBg: 'rgba(0,0,0,0.06)' },
    danger: { bg: PGR.redDim, border: 'rgba(229,72,77,0.3)', text: PGR.red, hoverBg: 'rgba(229,72,77,0.16)' },
    ghost: { bg: 'transparent', border: 'transparent', text: PGR.textDim, hoverBg: 'rgba(0,0,0,0.04)' },
    dark: { bg: '#1a1b1f', border: '#1a1b1f', text: '#ffffff', hoverBg: '#2a2c32' },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200 ${className}`}
      style={{
        background: disabled ? 'rgba(0,0,0,0.03)' : v.bg,
        border: `1px solid ${disabled ? PGR.border : v.border}`,
        color: disabled ? PGR.textDark : v.text,
        clipPath: BTN_CLIP,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = v.hoverBg; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = disabled ? 'rgba(0,0,0,0.03)' : v.bg; }}
    >
      {children}
    </button>
  );
}

function PGRPanel({ children, className = '', variant = 'default' }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'combat' | 'success';
}) {
  const variants = {
    default: { border: PGR.border, bg: PGR.bgPanel },
    combat: { border: 'rgba(229,72,77,0.2)', bg: PGR.redDim },
    success: { border: 'rgba(43,182,115,0.2)', bg: PGR.greenDim },
  };
  const v = variants[variant];
  return (
    <div className={`relative ${className}`} style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      clipPath: PANEL_CLIP,
      boxShadow: '0 1px 3px rgba(20,20,30,0.06)',
    }}>
      <div className="relative z-10 p-5">{children}</div>
    </div>
  );
}

function PGRBadge({ children, variant = 'cyan', className = '', onClick }: {
  children: React.ReactNode;
  variant?: 'cyan' | 'red' | 'amber' | 'green' | 'dim';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const variants = {
    cyan: { border: 'rgba(30,200,224,0.35)', text: '#0d8fa3', bg: PGR.cyanDim },
    red: { border: 'rgba(229,72,77,0.3)', text: PGR.red, bg: PGR.redDim },
    amber: { border: 'rgba(217,142,44,0.3)', text: PGR.amber, bg: PGR.amberDim },
    green: { border: 'rgba(43,182,115,0.3)', text: PGR.green, bg: PGR.greenDim },
    dim: { border: PGR.border, text: PGR.textDim, bg: PGR.bgSubtle },
  };
  const v = variants[variant];
  return (
    <span onClick={onClick} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase ${className}`} style={{
      border: `1px solid ${v.border}`,
      color: v.text,
      background: v.bg,
      clipPath: BADGE_CLIP,
    }}>
      {children}
    </span>
  );
}

function PGRProgressBar({ progress, variant = 'cyan', className = '' }: { progress: number; variant?: 'cyan' | 'red' | 'green'; className?: string }) {
  const colors = {
    cyan: { bg: PGR.cyanDim, fill: PGR.cyan },
    red: { bg: PGR.redDim, fill: PGR.red },
    green: { bg: PGR.greenDim, fill: PGR.green },
  };
  const c = colors[variant];
  return (
    <div className={`relative h-1.5 w-full rounded-full overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ background: c.bg }} />
      <div className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full" style={{
        width: `${Math.max(0, Math.min(100, progress))}%`,
        background: c.fill,
      }} />
    </div>
  );
}

function ClearRibbon() {
  return (
    <div className="absolute top-0 right-0 w-12 h-12 flex items-start justify-end pointer-events-none">
      <div className="relative w-12 h-12 flex items-center justify-center" style={{
        background: PGR.cyanDim,
        border: `1px solid rgba(30,200,224,0.4)`,
        borderRadius: '50%',
        margin: '4px',
      }}>
        <span className="text-[8px] font-mono font-bold tracking-widest -rotate-12" style={{ color: '#0d8fa3' }}>CLEAR</span>
      </div>
    </div>
  );
}

// ─── Review Modal ──────────────────────────────────────────────────────
function ReviewModal({ isOpen, onClose, dialogues, description, chapterTitle }: {
  isOpen: boolean;
  onClose: () => void;
  dialogues: Array<{ speaker: string; text: string; portrait?: string }>;
  description?: string;
  chapterTitle?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] animate-fadeIn" style={{ background: 'rgba(10,10,14,0.96)' }}>
      <ScanlineOverlay />
      <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-mono transition-all hover:scale-105"
            style={{ color: PGR.cyan, border: `1px solid rgba(30,200,224,0.3)`, background: 'rgba(30,200,224,0.08)', borderRadius: '2px' }}
          >
            ← BACK
          </button>
          <button onClick={onClose} className="text-xl transition-colors flex-shrink-0" style={{ color: '#8a8d96' }}>✕</button>
        </div>

        {chapterTitle && (
          <div className="mb-4">
            <p className="text-xs font-mono tracking-widest" style={{ color: '#8a8d96' }}>
              <span style={{ color: PGR.cyan }}>▸</span> {chapterTitle.toUpperCase()}
            </p>
          </div>
        )}

        {description && (
          <div className="mb-6 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: `2px solid ${PGR.cyan}` }}>
            <p className="text-sm leading-relaxed italic" style={{ color: '#c4c6cc' }}>
              {description}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {dialogues.map((d, i) => (
            <div key={i} className="pb-4 last:pb-0" style={{ borderBottom: i < dialogues.length - 1 ? `1px solid rgba(255,255,255,0.08)` : 'none' }}>
              <div className="flex items-start gap-3 mb-2">
                {d.portrait && <span className="text-3xl">{d.portrait}</span>}
                <div>
                  <span className={`text-xs font-mono font-semibold tracking-wider ${d.speaker === 'Narrator' ? 'italic' : ''}`} style={{ color: d.speaker === 'Narrator' ? '#8a8d96' : PGR.cyan }}>
                    {d.speaker}
                  </span>
                  {d.speaker === 'Narrator' && (
                    <span className="block text-[10px] font-mono" style={{ color: '#5c5e66' }}>— Narration</span>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: d.speaker === 'Narrator' ? '#c4c6cc' : '#e4e5e9' }}>
                {d.text}
              </p>
            </div>
          ))}
          {dialogues.length === 0 && (
            <p className="text-center text-sm" style={{ color: '#8a8d96' }}>No dialogue available.</p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30,200,224,0.3); }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// ─── Collectible Modal ────────────────────────────────────────────────
function CollectibleModal({ isOpen, onClose, collectible, chapterTitle }: {
  isOpen: boolean;
  onClose: () => void;
  collectible: StoryCollectible;
  chapterTitle: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] animate-fadeIn" style={{ background: 'rgba(244,245,247,0.98)' }}>
      <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: `1px solid ${PGR.border}` }}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-mono transition-all hover:scale-105"
            style={{ color: '#0d8fa3', border: `1px solid rgba(30,200,224,0.3)`, background: PGR.cyanDim, borderRadius: '2px' }}
          >
            ← BACK
          </button>
          <button onClick={onClose} className="text-xl transition-colors flex-shrink-0" style={{ color: PGR.textDim }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl" style={{
              background: PGR.amberDim, border: `1px solid rgba(217,142,44,0.3)`,
            }}>
              <span className="text-4xl">{collectible.icon}</span>
            </div>
            <h2 className="text-2xl font-mono font-bold tracking-wider" style={{ color: PGR.amber }}>{collectible.name.toUpperCase()}</h2>
            <p className="text-xs font-mono tracking-widest mt-1" style={{ color: PGR.textDim }}>— {chapterTitle.toUpperCase()} —</p>
          </div>
          <PGRPanel variant="default">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: PGR.text }}>{collectible.description}</p>
          </PGRPanel>
          <div className="mt-6 text-center">
            <p className="text-[10px] font-mono tracking-widest" style={{ color: PGR.textDark }}>
              OBTAINED FROM FLOATING RECORD [{collectible.name.toUpperCase()}] — UNLOCKED
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(30,200,224,0.3); }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// ─── Combat Loading Screen ─────────────────────────────────────────────
function CombatLoadingScreen() {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center" style={{ background: PGR.bgDark }}>
      <div className="absolute inset-0 overflow-hidden"><ScanlineOverlay /></div>
      <div className="relative z-10 text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 animate-spin rounded-full" style={{ border: `2px solid ${PGR.red}`, borderTopColor: 'transparent', animationDuration: '1.5s' }} />
          <div className="absolute inset-2 rounded-full" style={{ border: `1px solid ${PGR.redDim}` }} />
        </div>
        <div>
          <p className="text-sm font-mono tracking-[0.3em]" style={{ color: PGR.red }}>ENTERING COMBAT</p>
          <p className="text-xs font-mono tracking-wider mt-2" style={{ color: '#8a8d96' }}>PREPARING THE BATTLEFIELD</p>
        </div>
        <PGRProgressBar progress={60} variant="red" className="w-48 mx-auto" />
      </div>
    </div>
  );
}

// ─── Achievement Item ──────────────────────────────────────────────────
type Achievement = string | { name: string; description?: string; condition?: string };

function AchievementRow({ ach, done }: { ach: Achievement; done: boolean }) {
  const name = typeof ach === 'string' ? ach : ach.name;
  const desc = typeof ach === 'string' ? undefined : ach.description;
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <div className="flex items-start gap-2 min-w-0">
        <span style={{ color: PGR.amber }} className="mt-0.5">◈</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: PGR.text }}>{name}</p>
          {desc && <p className="text-xs" style={{ color: PGR.textDim }}>{desc}</p>}
        </div>
      </div>
      <span className="flex-shrink-0 text-base" style={{ color: done ? PGR.cyan : PGR.textDark }}>{done ? '✔' : '○'}</span>
    </li>
  );
}

function MemberChip({ idOrName, forced }: { idOrName: string; forced?: boolean }) {
  const display = getIdentityDisplay(idOrName);
  return (
    <div className="flex flex-col items-center gap-1 w-16">
      <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl" style={{
        background: PGR.bgSubtle,
        border: `1px solid ${forced ? 'rgba(30,200,224,0.4)' : PGR.border}`,
      }}>
        {display.portrait ?? '❔'}
      </div>
      <span className="text-[10px] font-mono text-center leading-tight truncate w-full" style={{ color: display.found ? PGR.text : PGR.textDim }} title={display.title}>
        {display.name}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function StoryView() {
  const {
    storyAllies,
    completeNode: rawCompleteNode,
    isNodeComplete: rawIsNodeComplete,
    getAvailableNodes: rawGetAvailableNodes,
    completedChapters,
  } = useGameStore();

// ─── WIP overlay ──────────────────────────────────────────────────────
if (IS_WIP) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center" style={{ background: PGR.bg }}>
      <div className="relative z-10 max-w-md w-full p-8 rounded-xl text-center" style={{ background: PGR.bgPanel, border: `1px solid ${PGR.border}` }}>
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-mono font-bold mb-2" style={{ color: PGR.text }}>Work in Progress</h2>
        <p className="text-sm" style={{ color: PGR.textDim }}>The Story feature is currently under construction. Please check back later.</p>
        <div className="mt-6 w-full h-1.5 rounded-full overflow-hidden" style={{ background: PGR.bgSubtle }}>
          <div className="h-full bg-amber-500 animate-pulse" style={{ width: '30%' }} />
        </div>
      </div>
    </div>
  );
}

  // ── Safety: ensure these are functions ──────────────────────────────
  const completeNode = typeof rawCompleteNode === 'function' ? rawCompleteNode : () => {};
  const isNodeComplete = typeof rawIsNodeComplete === 'function' ? rawIsNodeComplete : () => false;
  const getAvailableNodes = typeof rawGetAvailableNodes === 'function' ? rawGetAvailableNodes : () => [];

  // ── UI state ──────────────────────────────────────────────────────────
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [postBattleMode, setPostBattleMode] = useState(false);
  const [postBattleIndex, setPostBattleIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [showCombatLoading, setShowCombatLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [collectibleModalOpen, setCollectibleModalOpen] = useState(false);
  const [activeCollectible, setActiveCollectible] = useState<StoryCollectible | null>(null);
  const [collectibleChapterTitle, setCollectibleChapterTitle] = useState('');
  const [nodeObjectiveStatus, setNodeObjectiveStatus] = useState<Record<string, Record<string, boolean>>>({});

  // ── Multi-page reading state ────────────────────────────────────────
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [textProgress, setTextProgress] = useState(0);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueContainerRef = useRef<HTMLDivElement>(null);

  // ── Derived data ──────────────────────────────────────────────────────
  const chapter = selectedChapterId ? storyChapters.find(c => c.id === selectedChapterId) ?? null : null;
  const allNodes = chapter?.nodes ?? [];
  const available = chapter ? getAvailableNodes(chapter.id) : [];
  const completedNodes = chapter ? allNodes.filter(n => isNodeComplete(chapter.id, n.id)) : [];

  const isChapterCompleted = chapter ? completedChapters.includes(chapter.id) : false;

  const visibleNodes = chapter ? allNodes.filter(n => {
    if (isChapterCompleted) return true;
    const isDone = isNodeComplete(chapter.id, n.id);
    const isAvail = available.some(a => a.id === n.id);
    return isDone || isAvail;
  }) : [];

  // ── FIX: Use useMemo for stable activeDialogues ──────────────────────
  const activeDialogues = useMemo(() => {
    const main = currentNode?.dialogues ?? [];
    const post = currentNode?.postBattleDialogues ?? [];
    if (postBattleMode) {
      return post.length > 0 ? post : main;
    }
    return main.length > 0 ? main : post;
  }, [currentNode, postBattleMode]);

  const activeIndex = postBattleMode ? postBattleIndex : dialogueIndex;
  // Clamp index to valid range
  const clampedIndex = Math.min(activeIndex, Math.max(0, activeDialogues.length - 1));
  const currentDialogue = activeDialogues.length > 0 ? activeDialogues[clampedIndex] : null;
  const isLastDialogue = activeDialogues.length > 0 && clampedIndex === activeDialogues.length - 1;
  const isCombatNode = currentNode?.type === 'combat';

  // ── Page splitting ────────────────────────────────────────────────────
  useEffect(() => {
    if (currentDialogue) {
      const pageArray = splitIntoPages(currentDialogue.text || '');
      setPages(pageArray);
      setPageIndex(0);
      setDisplayText('');
      setIsTextComplete(false);
      setTextProgress(0);
    } else {
      setPages([]);
      setPageIndex(0);
      setDisplayText('');
      setIsTextComplete(false);
      setTextProgress(0);
    }
  }, [currentDialogue]);

  // ── Typewriter ────────────────────────────────────────────────────────
  const startTypewriter = useCallback((text: string) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setDisplayText('');
    setIsTextComplete(false);
    setTextProgress(0);
    let idx = 0;
    const totalLength = text.length;
    const interval = setInterval(() => {
      if (idx < totalLength) {
        const nextIdx = Math.min(idx + 1, totalLength);
        setDisplayText(text.slice(0, nextIdx));
        setTextProgress((nextIdx / totalLength) * 100);
        idx = nextIdx;
        if (dialogueContainerRef.current) {
          dialogueContainerRef.current.scrollTop = dialogueContainerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        typewriterRef.current = null;
        setIsTextComplete(true);
        setTextProgress(100);
        if (autoPlay) {
          autoAdvanceRef.current = setTimeout(handlePageComplete, 1200);
        }
      }
    }, 35);
    typewriterRef.current = interval;
  }, [autoPlay]);

  useEffect(() => {
    if (pages.length > 0 && pageIndex < pages.length) {
      startTypewriter(pages[pageIndex]);
    }
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [pages, pageIndex, startTypewriter]);

  // ── Page completion ──────────────────────────────────────────────────
  const handlePageComplete = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

    if (pageIndex >= pages.length) {
      setPageIndex(0);
      return;
    }

    if (pageIndex < pages.length - 1) {
      setPageIndex(prev => prev + 1);
      return;
    }

    // Last page – advance to next dialogue or finish
    if (postBattleMode) {
      if (isLastDialogue) resetToNodeList();
      else setPostBattleIndex(i => i + 1);
      return;
    }
    if (isLastDialogue) {
      if (isCombatNode) enterCombat();
      else finishDialogueNode();
      return;
    }
    setDialogueIndex(i => i + 1);
  }, [pageIndex, pages.length, postBattleMode, isLastDialogue, isCombatNode]);

  // ── Cleanup ──────────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  }, []);

  const resetToNodeList = useCallback(() => {
    clearTimers();
    setReadingMode(false);
    setPostBattleMode(false);
    setCurrentNode(null);
    setDialogueIndex(0);
    setPostBattleIndex(0);
    setAutoPlay(false);
    setShowCombat(false);
    setShowCombatLoading(false);
    setShowNodeDetail(false);
    setSelectedNode(null);
    setShowOverview(false);
    setDisplayText('');
    setIsTextComplete(false);
    setTextProgress(0);
    setPages([]);
    setPageIndex(0);
  }, [clearTimers]);

  // ── Dialogue navigation ──────────────────────────────────────────────
  const finishDialogueNode = useCallback(() => {
    if (!chapter || !currentNode) { resetToNodeList(); return; }
    if (!isNodeComplete(chapter.id, currentNode.id)) completeNode(chapter.id, currentNode.id);
    resetToNodeList();
  }, [chapter, currentNode, isNodeComplete, completeNode, resetToNodeList]);

  const showFullText = useCallback(() => {
    if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
    if (pages.length > 0 && pageIndex < pages.length) {
      setDisplayText(pages[pageIndex]);
      setIsTextComplete(true);
      setTextProgress(100);
      if (autoPlay) autoAdvanceRef.current = setTimeout(handlePageComplete, 1200);
    }
  }, [pages, pageIndex, autoPlay, handlePageComplete]);

  const enterCombat = useCallback(() => {
    clearTimers();
    setAutoPlay(false);
    setShowCombatLoading(true);
    setTimeout(() => { setShowCombatLoading(false); setShowCombat(true); }, 1500);
  }, [clearTimers]);

  const onCombatComplete = useCallback((objectiveStatus?: Record<string, boolean>) => {
    if (chapter && currentNode && !isNodeComplete(chapter.id, currentNode.id)) {
      completeNode(chapter.id, currentNode.id);
    }
    if (currentNode && objectiveStatus) {
      setNodeObjectiveStatus(prev => ({ ...prev, [`${chapter?.id}-${currentNode.id}`]: objectiveStatus }));
    }
    setShowCombat(false);
    const postDialogues = currentNode?.postBattleDialogues ?? [];
    if (postDialogues.length > 0) { setPostBattleIndex(0); setPostBattleMode(true); setReadingMode(true); }
    else resetToNodeList();
  }, [chapter, currentNode, isNodeComplete, completeNode, resetToNodeList]);

  const handleAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (!isTextComplete) { showFullText(); return; }
    handlePageComplete();
  }, [isTextComplete, showFullText, handlePageComplete]);

  const handleDialogueClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    handleAdvance();
  }, [handleAdvance]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => {
      const next = !prev;
      if (next && isTextComplete && pageIndex < pages.length - 1) {
        autoAdvanceRef.current = setTimeout(handlePageComplete, 1200);
      }
      return next;
    });
  }, [isTextComplete, pageIndex, pages.length, handlePageComplete]);

  // ── Chapter and node navigation ──────────────────────────────────────
  const openChapter = useCallback((chapterId: string) => {
    const idx = storyChapters.findIndex(c => c.id === chapterId);
    if (idx === -1) return;
    if (idx > 0 && !completedChapters.includes(storyChapters[idx - 1].id)) return;
    setSelectedChapterId(chapterId);
    resetToNodeList();
  }, [completedChapters, resetToNodeList]);

  const openNodeDetail = useCallback((node: StoryNode) => {
    if (!chapter) return;
    if (isChapterCompleted) {
      setSelectedNode(node);
      setShowNodeDetail(true);
      return;
    }
    const isDone = isNodeComplete(chapter.id, node.id);
    const isAvail = available.some(n => n.id === node.id);
    if (!isDone && !isAvail) return;
    setSelectedNode(node);
    setShowNodeDetail(true);
  }, [chapter, isNodeComplete, available, isChapterCompleted]);

  const closeNodeDetail = useCallback(() => {
    setShowNodeDetail(false);
    setSelectedNode(null);
  }, []);

  const startNodeFromDetail = useCallback(() => {
    if (!selectedNode) return;
    setCurrentNode(selectedNode);
    setDialogueIndex(0);
    setPostBattleIndex(0);
    setPostBattleMode(false);
    setReadingMode(true);
    setShowNodeDetail(false);
  }, [selectedNode]);

  // ── Skip / overview ──────────────────────────────────────────────────
  const handleSkip = useCallback(() => { clearTimers(); setAutoPlay(false); setShowOverview(true); }, [clearTimers]);
  const handleKeepWatching = useCallback(() => setShowOverview(false), []);
  const handleSkipComplete = useCallback(() => {
    if (chapter && currentNode && !isNodeComplete(chapter.id, currentNode.id)) {
      completeNode(chapter.id, currentNode.id);
    }
    resetToNodeList();
  }, [chapter, currentNode, isNodeComplete, completeNode, resetToNodeList]);

  // ── Collectible ──────────────────────────────────────────────────────
  const openCollectibleModal = useCallback((collectible: StoryCollectible, title: string) => {
    setActiveCollectible(collectible);
    setCollectibleChapterTitle(title);
    setCollectibleModalOpen(true);
  }, []);

  // ── Objective helper ─────────────────────────────────────────────────
  const areAllObjectivesCompleted = useCallback((node: StoryNode, chapterId: string) => {
    const objectives = node.objectives ?? [];
    if (objectives.length === 0) return true;
    const statusKey = `${chapterId}-${node.id}`;
    const status = nodeObjectiveStatus[statusKey];
    if (!status) return false;
    return objectives.every(obj => status[obj] === true);
  }, [nodeObjectiveStatus]);

  // ─── Keyboard navigation ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!readingMode) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pageIndex > 0) setPageIndex(pageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1);
        else if (isTextComplete) handlePageComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, pageIndex, pages.length, isTextComplete, handlePageComplete]);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Chapter List ───────────────────────────────────────────────
  if (!selectedChapterId) {
    return (
      <div className="space-y-3 max-w-4xl mx-auto max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar-light p-1" style={{ background: PGR.bg }}>
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: PGR.border }}>
          <h2 className="text-lg font-mono font-bold tracking-widest" style={{ color: PGR.text }}>
            <span style={{ color: PGR.red }}>▸</span> STORY CHAPTERS
          </h2>
          <PGRBadge variant="dim">v1.0</PGRBadge>
        </div>
        {storyChapters.map((ch) => {
          const idx = storyChapters.findIndex(c => c.id === ch.id);
          const status: 'completed' | 'available' | 'locked' = completedChapters.includes(ch.id)
            ? 'completed' : idx === 0 || completedChapters.includes(storyChapters[idx - 1].id) ? 'available' : 'locked';
          const nodeCount = ch.nodes.length;
          const completedCount = ch.nodes.filter(n => isNodeComplete(ch.id, n.id)).length;
          const isClickable = status === 'completed' || status === 'available';

          return (
            <div key={ch.id} onClick={() => isClickable && openChapter(ch.id)}
              className={`rounded-xl border p-5 transition-all cursor-pointer ${status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
              style={{
                background: status === 'completed' ? PGR.greenDim : status === 'available' ? PGR.bgPanel : PGR.bgSubtle,
                borderColor: status === 'completed' ? 'rgba(43,182,115,0.3)' : status === 'available' ? PGR.borderActive : PGR.border,
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{status === 'completed' ? '✅' : status === 'locked' ? '🔒' : '📖'}</span>
                  <div>
                    <span className="text-lg font-mono font-semibold block" style={{ color: PGR.text }}>{ch.title}</span>
                    {ch.collectible && <span className="text-xs font-mono" style={{ color: PGR.textDim }}>{ch.collectible.icon} {ch.collectible.name}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono" style={{ color: status === 'completed' ? PGR.green : status === 'available' ? '#0d8fa3' : PGR.textDark }}>
                    {status === 'completed' ? '✅ COMPLETE' : status === 'available' ? `${completedCount}/${nodeCount}` : '🔒 LOCKED'}
                  </span>
                  {status === 'available' && nodeCount > 0 && <PGRProgressBar progress={(completedCount / nodeCount) * 100} variant="cyan" className="w-24 ml-auto mt-1" />}
                </div>
              </div>
              {ch.joinAllies && ch.joinAllies.length > 0 && status !== 'locked' && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {ch.joinAllies.map(id => <PGRBadge key={id} variant="dim">+ {getIdentityDisplay(id).name}</PGRBadge>)}
                </div>
              )}
            </div>
          );
        })}
        <CollectibleModal isOpen={collectibleModalOpen} onClose={() => setCollectibleModalOpen(false)}
          collectible={activeCollectible!} chapterTitle={collectibleChapterTitle} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Node List ──────────────────────────────────────────────────
  if (!readingMode && !showCombat && !showCombatLoading && !showNodeDetail && !showOverview) {
    const progress = allNodes.length > 0 ? completedNodes.length / allNodes.length : 0;
    const allDone = allNodes.length > 0 && completedNodes.length === allNodes.length;
    const allObjectivesComplete = allNodes.every(node => {
      if (!isNodeComplete(chapter!.id, node.id)) return false;
      const objectives = node.objectives ?? [];
      if (objectives.length === 0) return true;
      const statusKey = `${chapter!.id}-${node.id}`;
      const status = nodeObjectiveStatus[statusKey];
      if (!status) return false;
      return objectives.every(obj => status[obj] === true);
    });
    const collectibleUnlocked = allDone && allObjectivesComplete && chapter?.collectible !== undefined;

    return (
      <div className="relative max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar-light" style={{ background: PGR.bg }}>
        <div className="sticky top-0 z-20 flex items-center gap-3 px-1 py-2 mb-3" style={{ background: PGR.bg }}>
          <PGRButton variant="dark" onClick={() => { setSelectedChapterId(null); resetToNodeList(); }} className="!px-3 !py-1.5">← Back</PGRButton>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-mono font-bold truncate" style={{ color: PGR.text }}>{chapter?.title}</h2>
            {chapter?.collectible && <p className="text-[11px] font-mono truncate" style={{ color: PGR.textDim }}>{chapter.collectible.icon} {chapter.collectible.name}</p>}
          </div>
          <span className="text-xs font-mono" style={{ color: PGR.textDim }}>{completedNodes.length}/{allNodes.length}</span>
        </div>

        <PGRProgressBar progress={progress * 100} variant="cyan" className="my-3 mx-1" />

        {allDone && (
          <div className="text-center py-2.5 mb-3 mx-1 rounded-lg" style={{ background: PGR.greenDim, border: `1px solid rgba(43,182,115,0.25)` }}>
            <p className="text-sm font-mono font-bold" style={{ color: PGR.green }}>✅ CHAPTER COMPLETE</p>
          </div>
        )}

        {visibleNodes.length === 0 && (
          <div className="text-center py-12" style={{ color: PGR.textDim }}>
            <p className="text-lg font-mono">No nodes available</p>
            <p className="text-sm mt-2">All nodes in this chapter are locked or completed.</p>
          </div>
        )}

        <div className="space-y-3 px-1 pb-4">
          {visibleNodes.map((node) => {
            const isDone = isNodeComplete(chapter!.id, node.id);
            const isAvail = available.some(n => n.id === node.id);
            const isNext = isAvail && !isDone;
            const objectivesComplete = areAllObjectivesCompleted(node, chapter!.id);

            const displayDone = isChapterCompleted ? true : isDone;
            const displayNext = isChapterCompleted ? false : isNext;
            const displayLocked = isChapterCompleted ? false : (!isDone && !isAvail);

            return (
              <div key={node.id} onClick={() => openNodeDetail(node)}
                className={`relative flex items-center gap-4 rounded-xl border p-3 transition-all ${displayDone ? 'hover:shadow-md cursor-pointer' : displayNext ? 'shadow-sm cursor-pointer hover:shadow-md' : 'opacity-45 cursor-not-allowed'}`}
                style={{ background: PGR.bgPanel, borderColor: displayNext ? 'rgba(30,200,224,0.35)' : PGR.border }}>
                <div className="relative w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center text-2xl overflow-hidden" style={{ background: PGR.bgSubtle, border: `1px solid ${PGR.border}` }}>
                  {displayLocked ? '🔒' : (node.type === 'combat' ? '⚔️' : '📖')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-mono font-semibold truncate" style={{ color: displayLocked ? PGR.textDark : PGR.text }}>{node.title}</span>
                    {node.type === 'combat' && !displayLocked && <PGRBadge variant="red">⚔️</PGRBadge>}
                    {displayNext && <PGRBadge variant="cyan">NEXT</PGRBadge>}
                  </div>
                  {node.description && !displayLocked && <p className="text-xs truncate" style={{ color: PGR.textDim }}>{node.description}</p>}
                  {node.type === 'combat' && node.target && !displayLocked && <p className="text-[10px] font-mono mt-0.5" style={{ color: PGR.amber }}>🎯 {node.target}</p>}
                  {displayDone && node.objectives && node.objectives.length > 0 && (
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: objectivesComplete ? PGR.green : PGR.textDim }}>
                      {objectivesComplete ? '✔ All objectives complete' : '⚠ Some objectives incomplete'}
                    </p>
                  )}
                </div>
                {displayDone && <ClearRibbon />}
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 left-0 right-0 mt-2 p-4 border-t" style={{ background: PGR.bgPanel, borderColor: PGR.border }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl" style={{ color: PGR.amber }}>🏆</span>
              <div>
                <span className="text-base font-mono font-bold" style={{ color: PGR.cyan }}>{completedNodes.length}</span>
                <span className="text-sm font-mono" style={{ color: PGR.textDim }}> /{allNodes.length}</span>
                <p className="text-[10px] font-mono tracking-wide" style={{ color: PGR.textDim }}>Stage Achievement</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs hidden sm:block">
              <PGRProgressBar progress={(completedNodes.length / Math.max(1, allNodes.length)) * 100} variant="cyan" className="w-full" />
            </div>
            {collectibleUnlocked && (
              <button
                onClick={() => openCollectibleModal(chapter!.collectible!, chapter!.title)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                style={{ background: PGR.amberDim, borderColor: 'rgba(217,142,44,0.35)', color: PGR.amber }}
              >
                <span>{chapter!.collectible!.icon}</span>
                <span className="text-xs font-mono font-bold">Collectible Unlocked!</span>
              </button>
            )}
          </div>
        </div>

        <CollectibleModal isOpen={collectibleModalOpen} onClose={() => setCollectibleModalOpen(false)}
          collectible={activeCollectible!} chapterTitle={collectibleChapterTitle} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Skip Overview ──────────────────────────────────────────────
  if (showOverview && currentNode) {
    return (
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 py-8" style={{ background: PGR.bg }}>
        <div className="relative z-10 max-w-2xl w-full p-8 rounded-xl" style={{ background: PGR.bgPanel, border: `1px solid ${PGR.border}` }}>
          <h2 className="text-2xl font-mono font-bold mb-3" style={{ color: PGR.text }}>{currentNode.title}</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: PGR.textDim }}>{currentNode.description || 'No summary available.'}</p>
          <div className="flex gap-4 justify-center">
            <PGRButton onClick={handleKeepWatching}>Keep Watching</PGRButton>
            <PGRButton variant="secondary" onClick={handleSkipComplete}>Skip</PGRButton>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Node Detail ────────────────────────────────────────────────
  if (showNodeDetail && selectedNode && chapter) {
    const isChapterCompletedDetail = chapter ? completedChapters.includes(chapter.id) : false;

    const isDone = isNodeComplete(chapter.id, selectedNode.id) || isChapterCompletedDetail;
    const isCombat = selectedNode.type === 'combat';
    const objectives = selectedNode.objectives ?? (isCombat ? ['Defeat all enemies'] : ['Read all dialogues']);
    const achievements = selectedNode.achievements ?? [];
    const rawMembers = selectedNode.members ?? (selectedNode.forcedIdentity ? [selectedNode.forcedIdentity] : ['rover_eclipse']);
    const objectivesComplete = areAllObjectivesCompleted(selectedNode, chapter.id) || isChapterCompletedDetail;
    const showStageAchievement = isDone && objectivesComplete;
    const description = selectedNode.description || (selectedNode.dialogues?.[0]?.text ? `"${selectedNode.dialogues[0].text}"` : 'No description available.');

    return (
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 py-8" style={{ background: PGR.bg }}>
        <div className="relative z-10 max-w-3xl w-full rounded-xl overflow-hidden" style={{ background: PGR.bgPanel, border: `1px solid ${PGR.border}`, boxShadow: '0 4px 24px rgba(20,20,30,0.08)' }}>
          <div className="flex items-center justify-between px-6 pt-5">
            <PGRButton variant="ghost" onClick={closeNodeDetail}>← BACK</PGRButton>
            {isCombat && <PGRBadge variant="red">⚔️ COMBAT</PGRBadge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 px-6 pb-6 pt-2">
            <div className="md:col-span-2 pr-0 md:pr-6 md:border-r" style={{ borderColor: PGR.border }}>
              <h2 className="text-xl font-mono font-bold mb-2" style={{ color: PGR.text }}>{selectedNode.title}</h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: PGR.textDim }}>{description}</p>
              <h3 className="text-xs font-mono font-semibold tracking-widest mb-2" style={{ color: PGR.textDim }}>OBJECTIVES</h3>
              <ul className="space-y-1">
                {objectives.map((obj, i) => {
                  const statusKey = `${chapter.id}-${selectedNode.id}`;
                  const status = nodeObjectiveStatus[statusKey];
                  const isObjDone = (status?.[obj] ?? false) || isChapterCompletedDetail;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span style={{ color: isObjDone ? PGR.green : PGR.textDark }}>{isObjDone ? '✔' : '○'}</span>
                      <span style={{ color: isObjDone ? PGR.green : PGR.text }}>{obj}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="md:col-span-3 pt-5 md:pt-0 md:pl-6 flex flex-col">
              <div className="relative w-full h-28 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden" style={{ background: PGR.bgSubtle, border: `1px solid ${PGR.border}` }}>
                {isCombat ? '⚔️' : '📖'}
                {isDone && <div className="absolute top-2 right-2"><PGRBadge variant="green">CLEAR</PGRBadge></div>}
              </div>

              {achievements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-mono font-semibold tracking-widest mb-1 flex items-center gap-1" style={{ color: PGR.textDim }}>
                    ACHIEVEMENT
                  </h3>
                  <ul className="divide-y" style={{ borderColor: PGR.border }}>
                    {achievements.map((ach, i) => {
                      const name = typeof ach === 'string' ? ach : ach.name;
                      const isAchDone = isDone;
                      return <AchievementRow key={i} ach={ach} done={isAchDone} />;
                    })}
                  </ul>
                </div>
              )}

              {isCombat && (
                <div className="mb-4">
                  <h3 className="text-xs font-mono font-semibold tracking-widest mb-2" style={{ color: PGR.textDim }}>MEMBERS TO DEPLOY</h3>
                  <div className="flex flex-wrap gap-3">
                    {rawMembers.map((m, i) => (
                      <MemberChip key={i} idOrName={m} forced={selectedNode.forcedIdentity === m} />
                    ))}
                  </div>
                </div>
              )}

              {isCombat && (selectedNode.postBattleDialogues?.length ?? 0) > 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: PGR.amberDim, border: `1px solid rgba(217,142,44,0.25)` }}>
                  <p className="text-xs" style={{ color: PGR.amber }}>📜 Post-battle scene unlocks after victory</p>
                </div>
              )}
              {selectedNode.bossUnlockId && !isDone && (
                <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: PGR.redDim, border: `1px solid rgba(229,72,77,0.2)` }}>
                  <p className="text-xs" style={{ color: PGR.red }}>⭐ Completing this unlocks: {getIdentityDisplay(selectedNode.bossUnlockId).name}</p>
                </div>
              )}

              <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                {showStageAchievement && (
                  <PGRBadge variant="amber" className="cursor-pointer" onClick={() => { if (chapter.collectible) openCollectibleModal(chapter.collectible, chapter.title); }}>
                    🏆 Stage Achievement
                  </PGRBadge>
                )}
                {isDone ? (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="font-mono font-bold text-sm" style={{ color: PGR.green }}>✅ Completed</span>
                    <PGRButton variant="dark" onClick={startNodeFromDetail}>{isCombat ? 'Deploy' : '📜 Read Again'}</PGRButton>
                  </div>
                ) : (
                  <PGRButton variant="dark" onClick={startNodeFromDetail} className="ml-auto !px-6 !py-2.5 !text-sm">
                    {isCombat ? 'Deploy' : '▶ Play Story'}
                  </PGRButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Combat Loading ─────────────────────────────────────────────
  if (showCombatLoading) return <CombatLoadingScreen />;

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Combat ─────────────────────────────────────────────────────
  if (showCombat && currentNode && chapter) {
    const chapterIndex = storyChapters.findIndex(c => c.id === chapter.id);
    return (
      <div className="relative min-h-[80vh]" style={{ background: PGR.bgDark }}>
        <div className="absolute inset-0 overflow-hidden"><ScanlineOverlay /></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          <PGRButton variant="ghost" onClick={() => { setShowCombat(false); resetToNodeList(); }} className="mb-4">← BACK TO CHAPTER</PGRButton>
          <NormalReception
            chapterTitle={currentNode.title}
            chapterIndex={chapterIndex}
            chapterId={chapter.id}
            nodeId={currentNode.id}
            onComplete={onCombatComplete}
            availableIdentities={storyAllies}
            forcedIdentity={currentNode.forcedIdentity ?? null}
            useDawnbreaker={currentNode.useDawnbreaker ?? false}
            objectives={currentNode.objectives || []}
            target={currentNode.target || ''}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: Reading Mode (Multi‑Page, cinematic dark) ──────────────────
  if (readingMode && currentNode && chapter) {
    const isDone = isNodeComplete(chapter.id, currentNode.id) || isChapterCompleted;
    const isAvail = available.some(n => n.id === currentNode.id) || isChapterCompleted;
    if (!isDone && !isAvail && !postBattleMode) { resetToNodeList(); return null; }

    return (
      <>
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          dialogues={activeDialogues}
          description={currentNode.description}
          chapterTitle={chapter.title}
        />

        <div className="relative h-[85vh] flex flex-col px-4 py-6 max-w-4xl mx-auto" style={{ background: PGR.bgDark }} onClick={handleDialogueClick}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none"><ScanlineOverlay /></div>

          {/* Header – with Exit button */}
          <div className="relative z-10 flex items-center gap-3 pb-3 mb-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono truncate" style={{ color: '#8a8d96' }}>{chapter.title}</p>
              <p className="text-xs font-mono truncate" style={{ color: '#c4c6cc' }}>
                {postBattleMode ? `📜 ${currentNode.title} — Aftermath` : currentNode.title}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {/* EXIT BUTTON */}
              <PGRButton variant="ghost" onClick={resetToNodeList} className="px-2 py-1">
                ← Exit
              </PGRButton>
              <PGRButton variant="ghost" onClick={() => setReviewModalOpen(true)} className="px-2 py-1">📜</PGRButton>
              <PGRButton variant="ghost" onClick={toggleAutoPlay} disabled={isLastDialogue && pageIndex >= pages.length - 1} className="px-2 py-1">
                {autoPlay ? '⏸' : '▶'}
              </PGRButton>
              <PGRButton variant="ghost" onClick={(e) => { e.stopPropagation(); handleSkip(); }} className="px-2 py-1">⏭</PGRButton>
            </div>
          </div>

          {postBattleMode && (<div className="relative z-10 mb-4 px-3 py-1.5 rounded self-start flex-shrink-0" style={{ background: 'rgba(217,142,44,0.08)', border: `1px solid rgba(217,142,44,0.25)` }}><p className="text-xs" style={{ color: PGR.amber }}>📜 Aftermath</p></div>)}

          {/* MAIN DIALOGUE AREA – flex-1, scrollable */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0 cursor-pointer select-none" onClick={handleDialogueClick}>
            {currentDialogue ? (
              <div className="page-transition flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                  {currentDialogue.portrait && <span className="text-5xl drop-shadow-lg">{currentDialogue.portrait}</span>}
                  <div>
                    <span className={`text-sm font-mono font-semibold ${currentDialogue.speaker === 'Narrator' ? 'italic' : ''}`} style={{ color: currentDialogue.speaker === 'Narrator' ? '#8a8d96' : '#e4e5e9' }}>
                      {currentDialogue.speaker}
                    </span>
                    {currentDialogue.speaker === 'Narrator' && <span className="block text-[10px] font-mono" style={{ color: '#5c5e66' }}>— Narration</span>}
                    {!isTextComplete && (<div className="w-24 h-0.5 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full transition-all" style={{ width: `${textProgress}%`, background: PGR.cyan }} />
                    </div>)}
                  </div>
                </div>

                <div
                  ref={dialogueContainerRef}
                  className="flex-1 rounded-xl border px-5 py-4 overflow-y-auto custom-scrollbar"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: currentDialogue.speaker === 'Narrator' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                    minHeight: 0,
                  }}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#e4e5e9' }}>
                    {displayText}
                  </p>
                </div>

                {!isTextComplete && (
                  <button onClick={(e) => { e.stopPropagation(); showFullText(); }} className="mt-3 self-start text-xs font-mono px-2 py-1 rounded transition-colors flex-shrink-0" style={{ color: PGR.cyan, border: `1px solid rgba(30,200,224,0.3)` }}>
                    ⏩ Show full page
                  </button>
                )}
              </div>
            ) : (
              // ── FIX: Show "Start Combat" for combat nodes with no dialogues ──
              isCombatNode ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <p className="text-center" style={{ color: '#8a8d96' }}>No dialogue before combat.</p>
                  <PGRButton
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      enterCombat();
                    }}
                    className="px-6 py-2"
                  >
                    ⚔️ Start Combat
                  </PGRButton>
                </div>
              ) : (
                <p className="text-center" style={{ color: '#8a8d96' }}>No dialogue available.</p>
              )
            )}
          </div>

          {/* Tap indicator */}
          <div className="relative z-10 flex flex-col items-center gap-1 mt-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className={`text-xl transition-all ${isTextComplete ? 'animate-bounce' : ''}`} style={{ color: isTextComplete ? PGR.cyan : '#3a3c44' }}>
              {!isTextComplete ? '…' : (isLastDialogue && pageIndex >= pages.length - 1 && !postBattleMode && isCombatNode) ? '⚔️' : '⌄'}
            </div>
            {isTextComplete && isLastDialogue && pageIndex >= pages.length - 1 && !postBattleMode && isCombatNode && (
              <p className="text-[10px] font-mono animate-pulse" style={{ color: PGR.red }}>Tap to enter combat</p>
            )}
            {isTextComplete && !(isLastDialogue && pageIndex >= pages.length - 1) && (
              <p className="text-[10px] font-mono" style={{ color: '#8a8d96' }}>Tap to continue</p>
            )}
          </div>

          <style>{`
            .page-transition { animation: pageFade 0.25s ease-out; }
            @keyframes pageFade { 0% { opacity: 0.5; transform: translateX(8px); } 100% { opacity: 1; transform: translateX(0); } }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
            .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30,200,224,0.3); }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar-light::-webkit-scrollbar-thumb { background: rgba(30,200,224,0.25); }
            .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
          `}</style>
        </div>
      </>
    );
  }

  return null;
}