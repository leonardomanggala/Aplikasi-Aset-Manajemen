import * as React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary-600 text-primary-foreground hover:bg-primary-700', secondary: 'border-transparent bg-secondary text-secondary-foreground', outline: 'text-foreground', destructive: 'border-transparent bg-destructive text-destructive-foreground',
};
function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return <div className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)} {...props} />;
}
export { Badge };
