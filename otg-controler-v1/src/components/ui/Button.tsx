import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
}

const variantStyles = {
  // PRIMARY = BRIGHTEST (inverted for maximum contrast)
  primary: `
    bg-bright-snow text-carbon-black font-semibold
    hover:bg-platinum
    active:bg-alabaster-grey
    shadow-md hover:shadow-lg
  `,
  secondary: `
    bg-iron-grey text-platinum border border-border
    hover:bg-slate-grey hover:border-border-hover hover:text-bright-snow
    active:bg-gunmetal
  `,
  danger: `
    bg-pale-slate text-carbon-black font-semibold
    hover:bg-alabaster-grey
    active:bg-pale-slate-dark
    shadow-sm
  `,
  ghost: `
    text-pale-slate-dark bg-transparent
    hover:bg-iron-grey hover:text-platinum
    active:bg-gunmetal
  `,
  // SUCCESS = ACCENT COLOR (for Start Automation)
  success: `
    bg-[var(--accent)] text-white font-semibold
    hover:bg-[var(--accent-hover)] hover:brightness-110
    active:brightness-90
    shadow-md
  `,
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const glowStyles = {
  primary: 'hover:shadow-[0_0_24px_rgba(248,249,250,0.4)]',
  danger: 'hover:shadow-[0_0_20px_rgba(206,212,218,0.35)]',
  success: 'hover:shadow-[0_0_20px_var(--accent-glow)]',
  secondary: 'hover:shadow-[0_0_16px_rgba(173,181,189,0.2)]',
  ghost: '',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, glow, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-lg font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-pale-slate-dark focus-visible:ring-offset-2 focus-visible:ring-offset-carbon-black
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          active:scale-[0.98]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${glow ? glowStyles[variant] : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
