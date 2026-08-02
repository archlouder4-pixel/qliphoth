import { useState, useEffect } from 'react';

export interface NoticeEvent {
  id: string;
  title: string;
  subtitle?: string;
  dateRange: string;
  description: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  type: 'event' | 'update' | 'maintenance' | 'research';
}

const NOTICE_EVENTS: NoticeEvent[] = [
  {
    id: 'chaos_incursion_character',
    title: 'CHAOS INCURSION',
    subtitle: 'Xenon: Chaos Lord Debut',
    dateRange: '06/02 - 07/16 23:00 (UTC)',
    description:
      'The "Featured Extraction" banner now features Xenon: Chaos Lord!\n\n' +
      '⚡ 100% SSR rate when you hit an SSR – guaranteed to be Xenon: Chaos Lord!\n' +
      '🌀 Chaos element – unmatched power from the void between dimensions.\n' +
      '⚔️ Signature weapon "Chaos Cleaver" also available in the Weapon banner.\n\n' +
      '📌 Event Currency:\n' +
      '• Uses "Event Manifest Tickets" (🎫) – 175 per pull, 1750 for 10 pulls\n' +
      '• Exchange Eclipse Energy (⚡) for Event Manifest Tickets in the Shop\n' +
      '• Event tickets are only valid during this event period\n\n' +
      '📌 Pity Rules:\n' +
      '• Pity is shared with the "Themed Manifest" banner (standard) and "Fate Themed Manifest" banner (fate)\n' +
      '• Pity carries over between banners\n' +
      '• Featured character will return in future rerun pools',
    image: '🌀',
    buttonText: 'Go to Featured Banner',
    buttonLink: 'gacha',
    type: 'research',
  },
  {
    id: 'chaos_cleaver_weapon',
    title: 'CHAOS CLEAVER',
    subtitle: 'Xenon\'s Signature Weapon',
    dateRange: '06/02 - 07/17 05:00 (UTC)',
    description:
      'The "Target Weapon Extraction" banner now features the 6★ Weapon [Chaos Cleaver]!\n\n' +
      '⚔️ Exclusive to Xenon: Chaos Lord – unlocks his full potential.\n' +
      '📦 Uses "Event Manifest Tickets" (🎫) – 175 per pull, 1750 for 10 pulls\n' +
      '📦 Exchange Eclipse Energy (⚡) for Event Manifest Tickets in the Shop\n' +
      '📦 Standard weapon research rules apply.\n\n' +
      '⚠️ Once the event concludes, [Chaos Cleaver] will not be available via "Target Weapon" Research,\n' +
      'nor will it be added to the standard "Weapon Research" pool in future versions.',
    image: '🗡️',
    buttonText: 'Go to Weapon Banner',
    buttonLink: 'gacha',
    type: 'event',
  },
];

interface NoticeOverlayProps {
  onClose?: () => void;
}

export default function NoticeOverlay({ onClose }: NoticeOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qliphoth_notice_dismissed');
    if (saved === 'true') setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('qliphoth_notice_dismissed', 'true');
    setVisible(false);
    if (onClose) onClose();
  };

  const handleGoToEvent = (link?: string) => {
    if (link) {
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: link }));
      setVisible(false);
      if (onClose) onClose();
    } else {
      handleDismiss();
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % NOTICE_EVENTS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + NOTICE_EVENTS.length) % NOTICE_EVENTS.length);
  };

  if (dismissed || !visible) return null;

  const event = NOTICE_EVENTS[currentIndex];
  const total = NOTICE_EVENTS.length;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full rounded-2xl border border-gray-700 bg-gray-900/95 shadow-2xl overflow-hidden shadow-cyan-500/20">
        {/* Glow border effect */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-cyan-500/20" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{event.image || '📢'}</span>
            <div>
              <p className={`text-xs font-mono font-bold uppercase tracking-wider ${
                event.type === 'research' ? 'text-violet-400' :
                event.type === 'maintenance' ? 'text-rose-400' :
                event.type === 'event' ? 'text-amber-400' :
                'text-cyan-400'
              }`}>
                {event.type === 'research' ? '🔬 BANNER' :
                 event.type === 'maintenance' ? '🔧 MAINTENANCE' :
                 event.type === 'event' ? '🎉 EVENT' :
                 '📰 UPDATE'}
              </p>
              <h2 className="text-2xl font-mono font-bold text-white tracking-wide">
                {event.title}
              </h2>
            </div>
          </div>
          {event.subtitle && (
            <p className="mt-1 text-sm text-cyan-300 font-medium">{event.subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span>📅</span>
            <span>{event.dateRange}</span>
          </div>

          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {event.description.split('\n').map((line, i) => {
              let className = '';
              if (line.startsWith('⚡') || line.startsWith('🌀') || line.startsWith('⚔️') || line.startsWith('📌') || line.startsWith('📦') || line.startsWith('⚠️')) {
                className = 'text-cyan-300 font-medium';
              } else if (line.startsWith('•')) {
                className = 'text-gray-400 ml-2';
              }
              return (
                <p key={i} className={className}>
                  {line}
                </p>
              );
            })}
          </div>

          {/* Carousel navigation */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={prevSlide}
                className="p-1 rounded-full border border-gray-700 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 font-mono">
                {currentIndex + 1} / {total}
              </span>
              <button
                onClick={nextSlide}
                className="p-1 rounded-full border border-gray-700 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {event.buttonText && (
              <button
                onClick={() => handleGoToEvent(event.buttonLink)}
                className="flex-1 rounded-lg border border-cyan-400 bg-cyan-400/10 py-2.5 font-mono text-sm font-bold text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 transition-all shadow-lg shadow-cyan-500/20"
              >
                {event.buttonText}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800/50 py-2.5 font-mono text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-all"
            >
              Close
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-600 font-mono">
            This notice will not reappear until a new event is added.
          </p>
        </div>
      </div>
    </div>
  );
}