import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white shadow-button hover:bg-primary-600 active:bg-primary-700',
        gradient:
          'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-button hover:from-primary-600 hover:to-primary-700',
        outline: 'border border-border bg-card text-foreground hover:bg-background',
        ghost: 'text-foreground hover:bg-background',
        danger: 'bg-error text-white hover:bg-error/90 active:bg-error/80',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
