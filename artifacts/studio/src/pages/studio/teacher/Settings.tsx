import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { hubAccessApi, siteContentApi, teacherSettings } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Tag, Plus, X, Info, ScrollText, KeyRound } from 'lucide-react';

const RULES_KEY = 'site.rules';

/** Website Rules card: the first-visit agreement, one rule per line. Empty = no dialog on the site. */
function WebsiteRulesCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const { data } = useQuery({ queryKey: ['teacher-site-content'], queryFn: () => siteContentApi.get() });
  const saved = data?.entries.find((e) => e.key === RULES_KEY);
  const savedRules: string[] = Array.isArray(saved?.value) ? (saved!.value as unknown[]).filter((r): r is string => typeof r === 'string') : [];

  useEffect(() => {
    if (!dirty) setText(savedRules.join('\n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRules.join('\n')]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (rules: string[]) => siteContentApi.update(RULES_KEY, rules),
    onSuccess: (_r, rules) => {
      qc.invalidateQueries({ queryKey: ['teacher-site-content'] });
      setDirty(false);
      toast({ title: rules.length ? 'Website Rules published' : 'Website Rules cleared', description: rules.length ? 'Every visitor will read and accept them on their next visit.' : 'The first-visit dialog is off.' });
    },
    onError: (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  const rules = text.split('\n').map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean);

  return (
    <Card className="bg-[#eee6d8] border-[#d5cabe]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[#c4622d]" />
          Website Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[#688a52]">
          The agreement every first-time visitor reads and accepts before entering the site. It starts empty, so no dialog shows.
          After Lesson 3, paste your class’s Community Promise here, one rule per line, and publish it. Change the list and
          everyone is asked to accept again; clear it to turn the dialog off.
        </p>
        <Textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setDirty(true); }}
          rows={6}
          className="bg-white border-[#d5cabe] text-sm"
          placeholder={'We ask before we post.\nWe keep personal information private.\nWe use kind words, every time.'}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#688a52]">
            {savedRules.length === 0 ? 'Not published yet: visitors see no dialog.' : `${savedRules.length} rule${savedRules.length === 1 ? '' : 's'} published.`}
          </span>
          <Button
            className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full flex-shrink-0"
            onClick={() => save(rules)}
            disabled={isPending || !dirty}
          >
            {rules.length ? 'Publish rules' : 'Clear rules'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** School access code card: the code every visitor types before the hub opens. Empty = open to anyone with the link. */
function HubAccessCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const { data } = useQuery({ queryKey: ['teacher-hub-access'], queryFn: () => hubAccessApi.get() });
  const savedCode = data?.code ?? '';

  useEffect(() => {
    if (!dirty) setText(savedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCode]);

  const done = (result: { code: string }) => {
    qc.setQueryData(['teacher-hub-access'], result);
    qc.invalidateQueries({ queryKey: ['teacher-hub-access'] });
    setDirty(false);
    toast({
      title: result.code ? 'School code saved' : 'School code turned off',
      description: result.code
        ? `Visitors now type ${result.code} once before the hub opens. Anyone who had the old code will be asked again.`
        : 'Anyone with the link can open the hub.',
    });
  };
  const fail = (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
  const { mutate: save, isPending: saving } = useMutation({ mutationFn: (code: string) => hubAccessApi.update(code), onSuccess: done, onError: fail });
  const { mutate: reset, isPending: resetting } = useMutation({ mutationFn: () => hubAccessApi.reset(), onSuccess: done, onError: fail });

  const cleaned = text.trim().toUpperCase().replace(/\s+/g, '-');
  const valid = cleaned === '' || /^[A-Z0-9-]{4,32}$/.test(cleaned);
  const busy = saving || resetting;

  return (
    <Card className="bg-[#eee6d8] border-[#d5cabe]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#c4622d]" />
          School access code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[#688a52]">
          Keeps the hub private to your school. With a code set, every visitor (students, families, staff) types it once on
          each device before the site or the Studio opens; signed-in teachers and students are never asked. Share it the way
          you share a Wi-Fi password. Change it and everyone is asked again. Leave it empty to open the hub to anyone with the link.
        </p>
        <Input
          value={text}
          onChange={(e) => { setText(e.target.value.toUpperCase()); setDirty(true); }}
          placeholder="LINCOLN-2026"
          autoComplete="off"
          spellCheck={false}
          className="bg-white border-[#d5cabe] font-mono tracking-wider"
        />
        {!valid && <p className="text-xs text-red-700">Use 4 to 32 letters, numbers or dashes.</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#688a52]">
            {savedCode
              ? `Visitors type ${savedCode}.`
              : data?.source === 'settings' && data.envCode
                ? 'Turned off here; the hub was created with a code.'
                : 'No code: the hub is open to anyone with the link.'}
          </span>
          <div className="flex gap-2">
            {data?.source === 'settings' && data.envCode && (
              <Button variant="outline" className="rounded-full border-[#d5cabe]" onClick={() => reset()} disabled={busy}>
                Use the hub's original code
              </Button>
            )}
            <Button
              className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full flex-shrink-0"
              onClick={() => save(cleaned)}
              disabled={busy || !dirty || !valid}
            >
              {cleaned ? 'Save code' : 'Turn off the code'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newOption, setNewOption] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const { data } = useQuery({
    queryKey: ['teacher-settings'],
    queryFn: () => teacherSettings.get(),
    enabled: !!user,
  });

  const { mutate: updateOptions, isPending } = useMutation({
    mutationFn: (options: string[]) => teacherSettings.updateAuthorDisplayOptions(options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-settings'] });
      qc.invalidateQueries({ queryKey: ['teacher-author-display-options'] });
      toast({ title: 'Author display options saved' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const { mutate: updateNotificationEmails, isPending: savingEmails } = useMutation({
    mutationFn: (emails: string[]) => teacherSettings.updateNotificationEmails(emails),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-settings'] });
      toast({ title: 'Notification emails saved' });
    },
    onError: (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const adminEmails: string[] = data?.adminEmails ?? [];
  const authorOptions: string[] = data?.authorDisplayOptions ?? [];
  const notificationEmails: string[] = data?.notificationEmails ?? [];
  const usingSignInList = data?.notificationEmailsSource === 'admin';

  function addEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'That does not look like an email address', variant: 'destructive' });
      return;
    }
    if (notificationEmails.includes(email)) { setNewEmail(''); return; }
    // When the list is still the sign-in fallback, the first add starts a real list that keeps those addresses.
    updateNotificationEmails([...notificationEmails, email]);
    setNewEmail('');
  }

  function removeEmail(email: string) {
    updateNotificationEmails(notificationEmails.filter((e) => e !== email));
  }

  function addOption() {
    const trimmed = newOption.trim();
    if (!trimmed || authorOptions.includes(trimmed)) return;
    updateOptions([...authorOptions, trimmed]);
    setNewOption('');
  }

  function removeOption(opt: string) {
    updateOptions(authorOptions.filter((o) => o !== opt));
  }

  return (
    <StudioLayout>
      <StudioPage
        title="Settings"
        subtitle="Command Center configuration"
      >
        <div className="space-y-6 max-w-2xl">
          <HubAccessCard />
          <WebsiteRulesCard />

          {/* Notification emails */}
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#c4622d]" />
                Notification Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[#688a52]">
                These addresses receive the urgent red-flag alerts when a student writes something concerning, plus a note
                whenever something is waiting for approval: student submissions, board posts and comments, blog posts and
                private-journal access requests. Any teacher can add their own address here, or ask the Site Assistant to.
              </p>
              {usingSignInList && (
                <p className="text-xs text-[#453329] flex items-start gap-1.5 rounded-lg bg-white border border-[#d5cabe] p-2.5">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#c4622d]" />
                  No list has been set yet, so notifications go to the teacher sign-in addresses below. Add an address to start your own list.
                </p>
              )}
              <div className="space-y-2">
                {notificationEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-[#d5cabe]">
                    <span className="text-sm text-[#453329] font-mono truncate">{email}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${email}`}
                      className="h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => removeEmail(email)}
                      disabled={savingEmails}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                  className="bg-white border-[#d5cabe] text-sm"
                  placeholder="teacher@school.org"
                />
                <Button
                  className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-1 flex-shrink-0"
                  onClick={addEmail}
                  disabled={savingEmails || !newEmail.trim()}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Emails */}
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#c4622d]" />
                Admin Emails (Teachers)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminEmails.length === 0 ? (
                <p className="text-sm text-[#688a52] italic">Not configured</p>
              ) : (
                <div className="space-y-1.5">
                  {adminEmails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[#d5cabe]">
                      <Mail className="h-4 w-4 text-[#688a52] flex-shrink-0" />
                      <span className="text-sm text-[#453329] font-mono">{email}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#688a52] flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                These Google accounts can sign in as teachers. They are also the fallback for notifications when no Notification
                Emails list has been set. Changing who can sign in is done when the hub is set up (the <code className="bg-[#d5cabe]/60 px-1 rounded">ADMIN_EMAILS</code> setting).
              </p>
            </CardContent>
          </Card>

          {/* Author Display Options */}
          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif text-[#453329] flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#c4622d]" />
                Author Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[#688a52]">
                These options appear in the approval workflow when publishing student content. They let you attribute
                work to a team or anonymous label instead of individual students.
              </p>

              <div className="space-y-2">
                {authorOptions.map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-[#d5cabe]"
                  >
                    <span className="text-sm text-[#453329]">{opt}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => {
                        if (authorOptions.length <= 1) {
                          toast({ title: 'At least one option is required', variant: 'destructive' });
                          return;
                        }
                        removeOption(opt);
                      }}
                      disabled={isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOption()}
                  className="bg-white border-[#d5cabe] text-sm"
                  placeholder="Add a new display label…"
                />
                <Button
                  className="bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full gap-1 flex-shrink-0"
                  onClick={addOption}
                  disabled={isPending || !newOption.trim()}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}
