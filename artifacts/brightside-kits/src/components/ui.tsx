import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'wouter';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-coral text-white shadow-[0_8px_0_0_#b9503f] hover:bg-[#e2786a] hover:shadow-[0_6px_0_0_#b9503f] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-[0_2px_0_0_#b9503f]',
  secondary:
    'bg-mustard text-cocoa shadow-[0_8px_0_0_#b8862c] hover:bg-[#e2ad48] hover:shadow-[0_6px_0_0_#b8862c] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-[0_2px_0_0_#b8862c]',
  dark: 'bg-cocoa text-cream shadow-[0_8px_0_0_#1f1712] hover:bg-[#4a3a2e] hover:shadow-[0_6px_0_0_#1f1712] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-[0_2px_0_0_#1f1712]',
  ghost:
    'bg-transparent text-cocoa border-2 border-cocoa/20 hover:border-cocoa/50 hover:bg-paper',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold tracking-wide transition-all duration-150 disabled:pointer-events-none disabled:opacity-60';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  external,
  children,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & {
  variant?: Variant;
  size?: Size;
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  const cls = clsx(base, variants[variant], sizes[size], className);
  if (external || /^https?:/.test(href) || href.startsWith('mailto:')) {
    return (
      <a href={href} className={cls} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<'section'>) {
  return <section className={clsx('py-16 sm:py-24', className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('font-script text-2xl text-coral', className)}>{children}</p>
  );
}

export function Heading({
  as: Tag = 'h2',
  children,
  className,
}: {
  as?: 'h1' | 'h2' | 'h3';
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tag
      className={clsx(
        'font-display font-semibold leading-[1.05] text-cocoa',
        Tag === 'h1' ? 'text-4xl sm:text-5xl lg:text-6xl' : Tag === 'h2' ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-2xl',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'rounded-[1.75rem] border border-cocoa/10 bg-paper p-6 shadow-card',
        className,
      )}
      {...props}
    />
  );
}

/** Little decorative hearts and sparkles, like the ones around the logo. */
export function Sparkle({ className, color = '#d9a23a' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx('h-5 w-5', className)}>
      <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function Heart({ className, color = '#d96b5a' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx('h-5 w-5', className)}>
      <path d="M12 21s-7.5-4.6-9.5-9.6C1.2 8 3.3 4.5 6.8 4.5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.5 0 5.6 3.5 4.3 6.9C19.5 16.4 12 21 12 21z" fill={color} />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx('h-5 w-5 shrink-0', className)}>
      <circle cx="12" cy="12" r="11" fill="#dde5d6" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#5b6b50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
