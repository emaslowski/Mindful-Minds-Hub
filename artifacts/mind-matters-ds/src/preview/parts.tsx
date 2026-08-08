import type { ReactNode } from 'react';

export function Row({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function Stack({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/**
 * Guidelines — design and composition do's/don'ts.
 * Supports two call signatures:
 *   1. Legacy: { items: Array<{ kind: 'do' | 'dont'; text: string }> }
 *   2. Richer: { title?: string; dos: string[]; donts: string[] }
 */
export function Guidelines(
  props:
    | { items: Array<{ kind: 'do' | 'dont'; text: string }>; title?: string; dos?: never; donts?: never }
    | { dos: string[]; donts: string[]; title?: string; items?: never },
) {
  const items: Array<{ kind: 'do' | 'dont'; text: string }> =
    'items' in props && props.items
      ? props.items
      : [
          ...((props as { dos: string[] }).dos ?? []).map((text) => ({ kind: 'do' as const, text })),
          ...((props as { donts: string[] }).donts ?? []).map((text) => ({ kind: 'dont' as const, text })),
        ];

  return (
    <div className="rounded-xl border bg-muted/30 p-5">
      {props.title ? (
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {props.title}
        </p>
      ) : null}
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span
              className={`shrink-0 font-semibold ${
                item.kind === 'do' ? 'text-secondary' : 'text-destructive'
              }`}
            >
              {item.kind === 'do' ? '✓ Do' : '✗ Don\'t'}
            </span>
            <span className="text-muted-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
