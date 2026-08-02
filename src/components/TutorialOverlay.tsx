import { useState, useEffect } from 'react';
import { getTutorialStep, getNextStepId, TAB_TUTORIALS } from '../data/tutorial';
import useGameStore from '../store/gameStore';

interface TutorialOverlayProps {
  stepId: string;
  onComplete: () => void;
}

export default function TutorialOverlay({ stepId, onComplete }: TutorialOverlayProps) {
  const [currentStepId, setCurrentStepId] = useState(stepId);
  const [stepData, setStepData] = useState(getTutorialStep(stepId));
  const [progress, setProgress] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const { seenTutorialSteps, setTutorialStepSeen } = useGameStore();

  // Calculate total steps in the current sequence
  useEffect(() => {
    const allSteps = Object.values(TAB_TUTORIALS).flat();
    const currentIndex = allSteps.indexOf(currentStepId);
    if (currentIndex !== -1) {
      setProgress(currentIndex + 1);
      setTotalSteps(allSteps.length);
    }
  }, [currentStepId]);

  useEffect(() => {
    const step = getTutorialStep(currentStepId);
    setStepData(step);
  }, [currentStepId]);

  const handleNext = () => {
    if (!stepData) return;
    setTutorialStepSeen(currentStepId);
    const nextId = getNextStepId(currentStepId);
    if (nextId) {
      setCurrentStepId(nextId);
    } else {
      // Tutorial complete
      onComplete();
    }
  };

  const handleSkip = () => {
    // Mark all steps in the current sequence as seen
    const allSteps = Object.values(TAB_TUTORIALS).flat();
    const currentIndex = allSteps.indexOf(currentStepId);
    if (currentIndex !== -1) {
      const remaining = allSteps.slice(currentIndex);
      remaining.forEach(id => setTutorialStepSeen(id));
    }
    onComplete();
  };

  if (!stepData) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-2xl w-full rounded border border-cyan-500/30 bg-pgr-card p-8 shadow-glow-cyan">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1 bg-pgr-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500"
              style={{ width: `${totalSteps > 0 ? (progress / totalSteps) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-pgr-dim whitespace-nowrap">
            {progress} / {totalSteps}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-mono font-bold text-cyan-400 mb-4 tracking-wider">
          {stepData.title}
        </h2>

        {/* Description list */}
        <div className="space-y-3 mb-6">
          {stepData.description.map((text, index) => (
            <p key={index} className="text-sm text-pgr-text leading-relaxed">
              {text.startsWith('⚠️') ? (
                <span className="text-amber-400">{text}</span>
              ) : text.startsWith('•') ? (
                <span className="text-pgr-dim">{text}</span>
              ) : (
                text
              )}
            </p>
          ))}
        </div>

        {/* Tab indicator */}
        {stepData.targetTab && (
          <div className="mb-4 rounded border border-pgr-border bg-pgr-darker/50 p-2 text-center">
            <span className="text-xs font-mono text-pgr-dim">
              📍 Navigate to: <span className="text-cyan-400 font-bold uppercase">{stepData.targetTab}</span>
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 rounded border border-cyan-400 bg-cyan-400/10 py-3 font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition-all"
          >
            {stepData.nextStep ? 'NEXT →' : 'COMPLETE ✓'}
          </button>
          <button
            onClick={handleSkip}
            className="rounded border border-pgr-border bg-pgr-darker/50 px-6 py-3 font-mono text-sm text-pgr-dim hover:border-cyan-400 hover:text-cyan-400 transition-all"
          >
            SKIP
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-pgr-dim/50 font-mono">
          {stepData.nextStep ? 'Step-by-step tutorial' : 'Tutorial complete'}
        </p>
      </div>
    </div>
  );
}