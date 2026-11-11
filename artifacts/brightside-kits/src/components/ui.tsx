import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'wouter';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-coral text-white shadow-sm hover:bg-[#b5503f]',
  secondary: 'bg-mustard text-cocoa shadow-sm hover:bg-[#c8922f]',
  dark: 'bg-cocoa text-white shadow-sm hover:bg-[#4a3a2e]',
  ghost: 'bg-transparent text-cocoa border border-cocoa/25 hover:border-cocoa/60 hover:bg-paper',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-[15px]',
  lg: 'px-6 py-3.5 text-base',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-display font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60';

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

const eyebrowTones = {
  coral: 'text-coral',
  mustard: 'text-mustard',
  sage: 'text-sage',
} as const;

/** Small uppercase section label. */
export function Eyebrow({
  children,
  className,
  tone = 'coral',
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof eyebrowTones;
}) {
  return (
    <p className={clsx('font-display text-xs font-bold uppercase tracking-[0.16em]', eyebrowTones[tone], className)}>
      {children}
    </p>
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
        'font-display font-bold leading-[1.1] text-cocoa',
        Tag === 'h1' ? 'text-4xl sm:text-5xl lg:text-[3.5rem]' : Tag === 'h2' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
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
        'rounded-2xl border border-cocoa/10 bg-paper p-6 shadow-card',
        className,
      )}
      {...props}
    />
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={clsx('h-5 w-5 shrink-0', className)}>
      <circle cx="12" cy="12" r="11" fill="#e3e9dd" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#5b6b50" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
