import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import { teacherSettings } from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Tag, Plus, X, Info } from 'lucide-react';

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
