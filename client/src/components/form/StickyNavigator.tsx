import React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface StickyNavigatorProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disablePrev?: boolean;
  disableNext?: boolean;
}

export const StickyNavigator: React.FC<StickyNavigatorProps> = React.memo(
  ({ currentStep, totalSteps, onPrevious, onNext, onSubmit, isSubmitting = false, disablePrev, disableNext }) => {
    const isLast = currentStep === totalSteps;
    return (
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-900/95 backdrop-blur border-t border-zinc-700/40"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-label="Mobile navigation"
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous step"
            onClick={onPrevious}
            disabled={disablePrev || currentStep === 1 || isSubmitting}
            className={`flex-1 min-h-[44px] px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 border ${
              currentStep === 1 || disablePrev || isSubmitting
                ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed border-zinc-700/50"
                : "bg-zinc-800/60 text-white hover:bg-zinc-700/60 border-zinc-700/30"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isLast ? (
            <button
              type="button"
              aria-label="Create companion"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-softgold-500 text-zinc-900 shadow-lg active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Creating…</span>
              ) : (
                <>
                  <span>Create</span>
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Next step"
              onClick={onNext}
              disabled={disableNext || isSubmitting}
              className="flex-1 min-h-[44px] px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-softgold-500 text-zinc-900 shadow-lg active:scale-95 disabled:opacity-60"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default StickyNavigator; 