import { useEffect, useState } from 'react';
import { BookOpen, Download, ExternalLink, FileText, Package, Presentation, Printer } from 'lucide-react';

import { Eyebrow } from '@/components/ui';
import { SITE } from '@/config';

export interface PrintableFile {
  folder: string;
  name: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
  url: string;
}

export interface PrintableSection {
  folder: string;
  title: string;
  files: PrintableFile[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ext(file: PrintableFile): string {
  return file.name.slice(file.name.lastIndexOf('.') + 1).toUpperCase();
}

function FileIcon({ file }: { file: PrintableFile }) {
  const e = ext(file);
  if (e === 'PDF') return <FileText className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />;
  if (e === 'PPTX') return <Presentation className="h-5 w-5 shrink-0 text-mustard" aria-hidden="true" />;
  return <Package className="h-5 w-5 shrink-0 text-sage" aria-hidden="true" />;
}

/**
 * The lesson printables library, shown on the school login page once a school's
 * access code has been accepted. The hub API lists the files and streams them;
 * every link carries the school code, so only schools with a kit can open them.
 */
export function Printables({ code }: { code: string }) {
  const [sections, setSections] = useState<PrintableSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSections(null);
    setError(null);
    fetch(`${SITE.apiBaseUrl}/api/kits/schools/${encodeURIComponent(code)}/resources`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { sections?: PrintableSection[]; error?: string };
        if (!res.ok || !data.sections) throw new Error(data.error ?? 'The printables could not be loaded.');
        if (!cancelled) setSections(data.sections);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'The printables could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const total = sections?.reduce((n, s) => n + s.files.length, 0) ?? 0;

  return (
    <section id="printables" className="mt-10 rounded-2xl border border-cocoa/10 bg-paper p-7 shadow-card" aria-labelledby="printables-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow tone="sage">Lesson printables</Eyebrow>
          <h2 id="printables-heading" className="mt-2 font-display text-2xl font-bold text-cocoa">Printables for every lesson</h2>
          <p className="mt-2 max-w-2xl text-cocoa-soft">
            Student workbook pages, teacher printables and the slides for each of the 12 lessons.{' '}
            <strong className="font-semibold text-cocoa">Open</strong> shows a PDF in a new tab so you can print it;{' '}
            <strong className="font-semibold text-cocoa">Download</strong> saves a copy. The editable PowerPoint files are under Whole unit.
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage-soft text-sage">
          <Printer className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm font-semibold text-coral">{error}</p>
      ) : !sections ? (
        <p className="mt-6 text-sm text-cocoa-soft">Loading printables…</p>
      ) : total === 0 ? (
        <p className="mt-6 text-sm text-cocoa-soft">No printables have been posted yet. Check back soon.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {sections.filter((s) => s.files.length > 0).map((section, i) => (
            <details key={section.folder} open={i === 0} className="group rounded-xl border border-cocoa/10 bg-cream">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 font-display text-lg font-semibold text-cocoa marker:content-none">
                {section.folder === 'unit' ? (
                  <Package className="h-5 w-5 text-coral" aria-hidden="true" />
                ) : (
                  <BookOpen className="h-5 w-5 text-coral" aria-hidden="true" />
                )}
                <span className="flex-1">{section.title}</span>
                <span className="text-sm font-sans font-normal text-cocoa-soft">
                  {section.files.length} file{section.files.length === 1 ? '' : 's'}
                </span>
                <span className="text-cocoa-soft transition group-open:rotate-90" aria-hidden="true">›</span>
              </summary>
              <ul className="divide-y divide-cocoa/10 border-t border-cocoa/10 px-5">
                {section.files.map((file) => (
                  <li key={file.name} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileIcon file={file} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-cocoa">{file.name}</p>
                        <p className="text-xs text-cocoa-soft">
                          {ext(file) === 'PPTX' ? 'PowerPoint' : ext(file)} · {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={`${SITE.apiBaseUrl}${file.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 font-display text-sm font-semibold text-white hover:bg-coral/90"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open
                      </a>
                      <a
                        href={`${SITE.apiBaseUrl}${file.url}?download=1`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cocoa/20 px-3 py-1.5 font-display text-sm font-semibold text-cocoa hover:border-coral hover:text-coral"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" /> Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
