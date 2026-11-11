import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useSearch } from 'wouter';
import { CreditCard, FileText, MessageSquareQuote } from 'lucide-react';
import clsx from 'clsx';

import { Button, ButtonLink, Container, Eyebrow, Heading, Section } from '@/components/ui';
import { KITS, PD, SITE, formatPrice, kitById, pdOption, pdPresenter, type KitId, type PdDays } from '@/config';

type PaymentMethod = 'card' | 'purchase_order' | 'quote';

const PAYMENT_OPTIONS: { id: PaymentMethod; icon: typeof CreditCard; title: string; text: string }[] = [
  { id: 'purchase_order', icon: FileText, title: 'Purchase order', text: 'We send a quote and invoice; your business office pays net-30.' },
  { id: 'card', icon: CreditCard, title: 'Card or ACH', text: 'We email a secure checkout link you can pay right away.' },
  { id: 'quote', icon: MessageSquareQuote, title: 'Just a quote for now', text: 'Get pricing to bring to your board or principal.' },
];

interface FormState {
  kit: KitId;
  quantity: number;
  organization: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  schools: string;
  teachers: string;
  students: string;
  pdDays: PdDays;
  pdTiming: string;
  pdParticipants: string;
  pdLocation: string;
  payment: PaymentMethod;
  poNumber: string;
  notes: string;
}

const fieldCls =
  'w-full rounded-2xl border border-cocoa/15 bg-paper px-4 py-3 text-cocoa placeholder:text-cocoa/40 focus:border-mustard';
const labelCls = 'mb-1.5 block font-display text-[15px] font-semibold text-cocoa';
const choiceCls = (selected: boolean) =>
  clsx(
    'cursor-pointer rounded-2xl border-2 p-4 transition',
    selected ? 'border-mustard bg-mustard-soft/50' : 'border-cocoa/10 bg-paper hover:border-cocoa/30',
  );

function Field({ label, htmlFor, required, hint, children }: { label: string; htmlFor: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {required && <span className="text-coral"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-cocoa-soft">{hint}</p>}
    </div>
  );
}

function parsePdDays(raw: string | null): PdDays {
  return pdOption(raw)?.days ?? 0;
}

export default function Order() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const initial = useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      kit: kitById(params.get('kit'))?.id ?? 'school',
      pdDays: parsePdDays(params.get('pd')),
    };
  }, [search]);

  const [form, setForm] = useState<FormState>({
    kit: initial.kit,
    quantity: 1,
    organization: '',
    contactName: '',
    role: '',
    email: '',
    phone: '',
    address: '',
    schools: '',
    teachers: '',
    students: '',
    pdDays: initial.pdDays,
    pdTiming: '',
    pdParticipants: '',
    pdLocation: '',
    payment: initial.kit === 'district' ? 'quote' : 'purchase_order',
    poNumber: '',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      kit: initial.kit,
      pdDays: initial.pdDays || f.pdDays,
      payment: initial.kit === 'district' ? 'quote' : f.payment,
    }));
  }, [initial]);

  useEffect(() => {
    document.title = `Order a kit — ${SITE.name}`;
    return () => {
      document.title = `${SITE.name} — Learning Kits for Schools`;
    };
  }, []);

  const kit = kitById(form.kit)!;
  const isDistrict = kit.id === 'district';
  const pd = pdOption(form.pdDays);
  const kitSubtotal = kit.price === null ? null : kit.price * Math.max(1, form.quantity);
  const total = kitSubtotal === null ? null : kitSubtotal + (pd?.price ?? 0);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch(`${SITE.apiBaseUrl}/api/kits/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: window.location.origin }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; reference?: string };
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
      const q = new URLSearchParams({ ref: data.reference ?? '', kit: kit.id, payment: form.payment });
      if (pd) q.set('pd', String(pd.days));
      navigate(`/thanks?${q.toString()}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const mailtoFallback = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Kit order: ${kit.name}`)}&body=${encodeURIComponent(
    [
      `Kit: ${kit.name}`,
      `Quantity: ${form.quantity}`,
      `Professional development: ${pd ? `${pd.days} days on site (${form.pdTiming || 'dates TBD'})` : 'none'}`,
      `Organization: ${form.organization}`,
      `Contact: ${form.contactName} (${form.role})`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Shipping address: ${form.address}`,
      `Payment: ${form.payment}`,
      `Notes: ${form.notes}`,
    ].join('\n'),
  )}`;

  return (
    <Section className="pt-10">
      <Container className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <Eyebrow>Order a kit</Eyebrow>
          <Heading as="h1" className="mt-2">Tell us about your classroom, school or district</Heading>
          <p className="mt-4 max-w-xl text-lg text-cocoa-soft">
            Fill in the form and we will confirm by email within two school days with a quote,
            invoice or checkout link, whichever you choose below.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-10" noValidate>
            {/* Kit */}
            <fieldset>
              <legend className="font-display text-2xl font-semibold text-cocoa">1. Choose a kit</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {KITS.map((k) => (
                  <label key={k.id} className={choiceCls(form.kit === k.id)}>
                    <input
                      type="radio"
                      name="kit"
                      value={k.id}
                      checked={form.kit === k.id}
                      onChange={() => {
                        set('kit', k.id);
                        if (k.id === 'district') set('payment', 'quote');
                      }}
                      className="sr-only"
                    />
                    <span className="block font-display text-lg font-semibold text-cocoa">{k.name}</span>
                    <span className="block text-sm text-cocoa-soft">{k.audience}</span>
                    <span className="mt-2 block font-display text-xl font-semibold text-cocoa">{formatPrice(k.price)}</span>
                  </label>
                ))}
              </div>
              {!isDistrict && (
                <div className="mt-4 max-w-xs">
                  <Field label="Quantity" htmlFor="quantity" hint="One kit per classroom (Classroom Kit) or per building (School Kit).">
                    <input
                      id="quantity"
                      type="number"
                      min={1}
                      max={500}
                      value={form.quantity}
                      onChange={(e) => set('quantity', Math.max(1, Number(e.target.value) || 1))}
                      className={fieldCls}
                    />
                  </Field>
                </div>
              )}
              {isDistrict && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Number of schools" htmlFor="schools">
                    <input id="schools" type="text" inputMode="numeric" value={form.schools} onChange={(e) => set('schools', e.target.value)} className={fieldCls} placeholder="e.g. 4" />
                  </Field>
                  <Field label="Teachers" htmlFor="teachers">
                    <input id="teachers" type="text" inputMode="numeric" value={form.teachers} onChange={(e) => set('teachers', e.target.value)} className={fieldCls} placeholder="e.g. 28" />
                  </Field>
                  <Field label="Students" htmlFor="students">
                    <input id="students" type="text" inputMode="numeric" value={form.students} onChange={(e) => set('students', e.target.value)} className={fieldCls} placeholder="e.g. 900" />
                  </Field>
                </div>
              )}
            </fieldset>

            {/* Professional development */}
            <fieldset>
              <legend className="font-display text-2xl font-semibold text-cocoa">2. Add on-site professional development?</legend>
              <p className="mt-2 max-w-xl text-cocoa-soft">
                {pdPresenter().charAt(0).toUpperCase() + pdPresenter().slice(1)} comes to you for hands-on training. {PD.groupSize}. Optional.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className={choiceCls(form.pdDays === 0)}>
                  <input type="radio" name="pd" value="0" checked={form.pdDays === 0} onChange={() => set('pdDays', 0)} className="sr-only" />
                  <span className="block font-display text-lg font-semibold text-cocoa">No PD for now</span>
                  <span className="block text-sm text-cocoa-soft">Kit only. You can add it later.</span>
                  <span className="mt-2 block font-display text-xl font-semibold text-cocoa">$0</span>
                </label>
                {PD.options.map((o) => (
                  <label key={o.days} className={choiceCls(form.pdDays === o.days)}>
                    <input type="radio" name="pd" value={o.days} checked={form.pdDays === o.days} onChange={() => set('pdDays', o.days)} className="sr-only" />
                    <span className="block font-display text-lg font-semibold text-cocoa">{o.name}</span>
                    <span className="block text-sm text-cocoa-soft">{o.summary}</span>
                    <span className="mt-2 block font-display text-xl font-semibold text-cocoa">+{formatPrice(o.price)}</span>
                  </label>
                ))}
              </div>
              {pd && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Preferred dates" htmlFor="pdTiming" hint="A month, a week, or 'before school starts'.">
                    <input id="pdTiming" value={form.pdTiming} onChange={(e) => set('pdTiming', e.target.value)} className={fieldCls} placeholder="e.g. late August" />
                  </Field>
                  <Field label="Educators attending" htmlFor="pdParticipants">
                    <input id="pdParticipants" type="text" inputMode="numeric" value={form.pdParticipants} onChange={(e) => set('pdParticipants', e.target.value)} className={fieldCls} placeholder="e.g. 24" />
                  </Field>
                  <Field label="Where" htmlFor="pdLocation" hint="School or district office, and the city.">
                    <input id="pdLocation" value={form.pdLocation} onChange={(e) => set('pdLocation', e.target.value)} className={fieldCls} placeholder="District office, Middleport NY" />
                  </Field>
                  <p className="text-sm text-cocoa-soft sm:col-span-3">{PD.travelNote}</p>
                </div>
              )}
            </fieldset>

            {/* Contact */}
            <fieldset>
              <legend className="font-display text-2xl font-semibold text-cocoa">3. Your details</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="School or district" htmlFor="organization" required>
                    <input id="organization" required value={form.organization} onChange={(e) => set('organization', e.target.value)} className={fieldCls} placeholder="Roy-Hart Central School District" />
                  </Field>
                </div>
                <Field label="Your name" htmlFor="contactName" required>
                  <input id="contactName" required autoComplete="name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} className={fieldCls} />
                </Field>
                <Field label="Role" htmlFor="role">
                  <input id="role" autoComplete="organization-title" value={form.role} onChange={(e) => set('role', e.target.value)} className={fieldCls} placeholder="Teacher, principal, counselor, purchasing…" />
                </Field>
                <Field label="Work email" htmlFor="email" required>
                  <input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={fieldCls} />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={fieldCls} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Shipping address" htmlFor="address" required={!isDistrict} hint="Where the printed manuals and workbooks should go.">
                    <textarea id="address" rows={2} required={!isDistrict} autoComplete="street-address" value={form.address} onChange={(e) => set('address', e.target.value)} className={fieldCls} />
                  </Field>
                </div>
              </div>
            </fieldset>

            {/* Payment */}
            <fieldset>
              <legend className="font-display text-2xl font-semibold text-cocoa">4. How would you like to pay?</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PAYMENT_OPTIONS.map(({ id, icon: Icon, title, text }) => (
                  <label key={id} className={choiceCls(form.payment === id)}>
                    <input type="radio" name="payment" value={id} checked={form.payment === id} onChange={() => set('payment', id)} className="sr-only" />
                    <Icon className="h-6 w-6 text-coral" />
                    <span className="mt-2 block font-display text-lg font-semibold text-cocoa">{title}</span>
                    <span className="block text-sm text-cocoa-soft">{text}</span>
                  </label>
                ))}
              </div>
              {form.payment === 'purchase_order' && (
                <div className="mt-4 max-w-xs">
                  <Field label="PO number (if you have one)" htmlFor="poNumber">
                    <input id="poNumber" value={form.poNumber} onChange={(e) => set('poNumber', e.target.value)} className={fieldCls} />
                  </Field>
                </div>
              )}
            </fieldset>

            <Field label="Anything else we should know?" htmlFor="notes" hint="Grade levels, start date, tax-exempt status, or questions.">
              <textarea id="notes" rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={fieldCls} />
            </Field>

            {error && (
              <div role="alert" className="rounded-2xl border border-coral/40 bg-peach-soft/60 p-4 text-cocoa">
                <p className="font-semibold">{error}</p>
                <p className="mt-1 text-sm">
                  You can also{' '}
                  <a href={mailtoFallback} className="font-semibold text-coral underline underline-offset-4">
                    email your order to {SITE.contactEmail}
                  </a>
                  .
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : form.payment === 'quote' ? 'Request my quote' : 'Place order'}
              </Button>
              <p className="text-sm text-cocoa-soft">No payment is taken on this page.</p>
            </div>
          </form>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-cocoa/10 bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-cocoa">Order summary</h2>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-cocoa-soft">Kit</dt>
                <dd className="font-bold text-cocoa">{kit.name}</dd>
              </div>
              {!isDistrict && (
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa-soft">Quantity</dt>
                  <dd className="font-semibold text-cocoa">{form.quantity}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-cocoa-soft">Hub access</dt>
                <dd className="font-semibold text-cocoa">{SITE.accessMonths} months</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cocoa-soft">On-site PD</dt>
                <dd className="text-right font-semibold text-cocoa">
                  {pd ? `${pd.days} days · +${formatPrice(pd.price)}` : 'None'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-cocoa/10 pt-3">
                <dt className="font-display text-lg font-semibold text-cocoa">Estimated total</dt>
                <dd className="font-display text-2xl font-semibold text-cocoa">{total === null ? 'Quote' : formatPrice(total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-cocoa-soft">
              Shipping{pd ? ', PD travel' : ''} and applicable tax are added to the invoice. Tax-exempt schools: add your certificate in the notes.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-cocoa">
              {kit.includes.slice(0, 5).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard" aria-hidden="true" />
                  {line}
                </li>
              ))}
              {pd && (
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                  {pd.name}: {pd.days} days of on-site professional development
                </li>
              )}
            </ul>
            {kit.checkoutUrl && !pd && (
              <div className="mt-6 border-t border-cocoa/10 pt-5">
                <p className="text-sm text-cocoa-soft">Prefer to pay by card right now?</p>
                <ButtonLink href={kit.checkoutUrl} external variant="dark" className="mt-2 w-full">Pay online</ButtonLink>
              </div>
            )}
          </div>
        </aside>
      </Container>
    </Section>
  );
}
