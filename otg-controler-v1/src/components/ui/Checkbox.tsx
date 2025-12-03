import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={`
          group flex items-start gap-3 cursor-pointer select-none
          ${props.disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`
              peer sr-only
              ${className}
            `}
            {...props}
          />
          <div className={`
            w-5 h-5 rounded-md border-2 transition-all duration-200
            bg-background-input border-border
            peer-hover:border-border-hover
            peer-focus-visible:ring-2 peer-focus-visible:ring-pale-slate-dark/20
            peer-checked:bg-pale-slate-dark peer-checked:border-pale-slate-dark
            peer-disabled:opacity-40 peer-disabled:cursor-not-allowed
          `}>
            <svg
              className="w-full h-full text-carbon-black opacity-0 peer-checked:opacity-100 transition-opacity duration-150 p-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {/* Checkmark overlay */}
          <svg
            className="absolute w-5 h-5 text-carbon-black opacity-0 peer-checked:opacity-100 transition-opacity duration-150 p-0.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-foreground-muted mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
