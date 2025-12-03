import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  interactive?: boolean;
  glow?: boolean;
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', title, subtitle, icon, interactive, glow, noPadding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          card card-float
          ${noPadding ? '' : 'p-5'}
          ${interactive ? 'card-interactive cursor-pointer' : ''}
          ${glow ? 'gradient-border' : ''}
          ${className}
        `}
        {...props}
      >
        {(title || icon) && (
          <div className="flex items-center gap-3 mb-4">
            {icon && (
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gunmetal text-pale-slate-dark">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-base font-semibold text-foreground truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-foreground-muted truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
