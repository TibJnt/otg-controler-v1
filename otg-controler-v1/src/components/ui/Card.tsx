import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-card-border bg-card p-6 ${className}`}
        {...props}
      >
        {title && <h2 className="text-lg font-medium mb-4">{title}</h2>}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
