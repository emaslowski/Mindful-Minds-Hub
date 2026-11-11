import { FAQ } from '@/config';

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-cocoa/10 rounded-2xl border border-cocoa/10 bg-paper px-6 shadow-card sm:px-8">
      {FAQ.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-cocoa marker:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-xl text-coral transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 pr-12 leading-relaxed text-cocoa-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
