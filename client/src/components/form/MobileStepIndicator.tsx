import React, { useCallback, useMemo, useRef } from "react";

export interface MobileStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  titles?: string[];
  icons?: Array<React.ReactNode | string>;
  isLoading?: boolean;
  onStepClick?: (index: number) => void;
}

export const MobileStepIndicator: React.FC<MobileStepIndicatorProps> = React.memo(
  ({ currentStep, totalSteps, titles = [], icons = [], isLoading = false, onStepClick }) => {
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onStepClick) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          if (currentStep < totalSteps) onStepClick(currentStep + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (currentStep > 1) onStepClick(currentStep - 1);
        }
      },
      [currentStep, totalSteps, onStepClick]
    );

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }, []);

    const onTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (!touchStartRef.current || !onStepClick) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartRef.current.x;
        const dy = t.clientY - touchStartRef.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        touchStartRef.current = null;
        if (absDx > 60 && absDy < 40) {
          if (dx < 0 && currentStep < totalSteps) onStepClick(currentStep + 1);
          if (dx > 0 && currentStep > 1) onStepClick(currentStep - 1);
        }
      },
      [currentStep, totalSteps, onStepClick]
    );

    const ariaLabel = useMemo(() => `Step ${currentStep} of ${totalSteps}${titles[currentStep - 1] ? `: ${titles[currentStep - 1]}` : ""}`, [currentStep, totalSteps, titles]);

    return (
      <div
        className="lg:hidden w-full flex flex-col items-center gap-2 sticky top-20 sm:top-24 z-40"
        aria-label="Step progress"
        onKeyDown={handleKeyDown}
      >
        <div className="text-xs sm:text-sm text-zinc-300" aria-live="polite">{ariaLabel}</div>

        {/* Icon row */}
        <div
          className="w-full overflow-x-auto scrollbar-hide"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {isLoading ? (
            <div className="flex items-center justify-between gap-1.5 px-1" aria-hidden>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="h-11 w-11 rounded-xl bg-zinc-800/50 border border-zinc-700/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              className="flex items-center justify-between gap-1.5 px-1"
              role="tablist"
              aria-label="Create companion steps"
            >
              {Array.from({ length: totalSteps }).map((_, i) => {
                const stepNumber = i + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                const icon = icons[i] ?? "•";
                const title = titles[i];
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={title ? `Step ${stepNumber} of ${totalSteps}: ${title}` : `Step ${stepNumber} of ${totalSteps}`}
                    onClick={onStepClick ? () => onStepClick(stepNumber) : undefined}
                    className={`flex-1 min-w-[44px] min-h-[44px] h-11 px-2 rounded-xl border flex items-center justify-center text-[clamp(18px,5vw,22px)] leading-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/40 tap-target ${
                      isActive
                        ? "bg-gold text-zinc-900 border-gold animate-haptic-bump"
                        : isCompleted
                          ? "border-gold/60 text-gold"
                          : "border-zinc-700/60 text-zinc-300 bg-zinc-800/40"
                    }`}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {title && <span className="sr-only ml-2">{title}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2" role="tablist" aria-label="Progress">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNumber = i + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={titles[i] ? `Step ${stepNumber}: ${titles[i]}` : `Step ${stepNumber}`}
                onClick={onStepClick ? () => onStepClick(stepNumber) : undefined}
                className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-300 min-w-[6px] min-h-[6px] ${
                  isActive ? "bg-gold scale-110" : isCompleted ? "bg-gold/60" : "bg-zinc-600"
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

export default MobileStepIndicator; 