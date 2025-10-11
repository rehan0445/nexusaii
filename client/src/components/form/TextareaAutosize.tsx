import React, { useEffect, useMemo, useRef } from "react";

export interface TextareaAutosizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (next: string) => void;
  maxLength?: number;
  label?: string;
  ariaLabel?: string;
}

function resizeToFit(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

const TextareaAutosizeInner = React.forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  ({ value, onValueChange, maxLength, label, ariaLabel, className = "", ...rest }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      resizeToFit(innerRef.current);
    }, [value]);

    const remaining = useMemo(() => {
      if (typeof maxLength !== "number") return undefined;
      return Math.max(0, maxLength - value.length);
    }, [value, maxLength]);

    return (
      <div className="relative">
        <textarea
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === "function") ref(node as HTMLTextAreaElement | null);
            else if (ref && "current" in (ref as any)) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          aria-label={ariaLabel || label}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onInput={(e) => resizeToFit(e.currentTarget)}
          className={`w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 placeholder-zinc-500 shadow-inner ${className}`}
          {...rest}
        />
        {typeof maxLength === "number" && (
          <div className="absolute bottom-2 right-3 text-xs select-none" aria-live="polite">
            <span className={`${value.length > maxLength ? "text-red-400" : value.length > maxLength * 0.9 ? "text-softgold-500" : "text-zinc-400"}`}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

export const TextareaAutosize = React.memo(TextareaAutosizeInner);
export default TextareaAutosize; 