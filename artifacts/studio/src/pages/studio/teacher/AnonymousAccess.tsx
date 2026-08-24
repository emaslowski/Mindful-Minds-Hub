import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, LockKeyhole, RefreshCw, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { StudioLayout, StudioPage } from '@/components/studio/StudioLayout';
import { useRequireStudioRole } from '@/hooks/useStudioAuth';
import {
  teacherAnonymousAccess,
  type AnonymousAccessAccount,
  type AnonymousAccessRequest,
} from '@/lib/studioApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type IssuedCredential = {
  accessCode: string;
  password: string;
  message: string;
  emailSent: boolean;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function AnonymousAccess() {
  const { user, isLoading } = useRequireStudioRole('teacher');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [issuedCredential, setIssuedCredential] = useState<IssuedCredential | null>(null);
  const { data, isLoading: listLoading } = useQuery({
    queryKey: ['teacher-anonymous-access'],
    queryFn: teacherAnonymousAccess.list,
    enabled: !!user,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ accountId, status }: { accountId: number; status: 'active' | 'disabled' }) =>
      teacherAnonymousAccess.updateStatus(accountId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-anonymous-access'] }),
    onError: (error) => toast({ title: 'Unable to update access', description: errorMessage(error), variant: 'destructive' }),
  });

  if (isLoading || !user) return null;

  const pendingRequests = (data?.requests ?? []).filter((request) => request.status === 'pending');
  const accounts = data?.accounts ?? [];

  return (
    <StudioLayout>
      <StudioPage
        title="Anonymous Access"
        subtitle="Review student details before issuing private wellness codes"
      >
        <div className="space-y-6 max-w-5xl">
          {issuedCredential && (
            <Card className="bg-[#fff8e6] border-[#d4a44c]">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="h-6 w-6 text-[#688a52] flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#453329]">
                      {issuedCredential.emailSent ? 'Credentials emailed to the student' : 'Give these details to the student now'}
                    </h2>
                    <p className="text-sm text-[#688a52] mt-1">{issuedCredential.message}</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      <div className="bg-white rounded-lg border border-[#d5cabe] p-3">
                        <p className="text-xs uppercase tracking-wide text-[#8a6a55]">Access code</p>
                        <p className="font-mono font-bold text-[#453329] mt-1">{issuedCredential.accessCode}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-[#d5cabe] p-3">
                        <p className="text-xs uppercase tracking-wide text-[#8a6a55]">Password</p>
                        <p className="font-mono font-bold text-[#453329] mt-1">{issuedCredential.password}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#8a6a55] mt-3">For privacy, passwords are not saved or shown again after you leave this screen.</p>
                    <Button variant="ghost" className="mt-2 text-[#688a52] px-0 hover:bg-transparent hover:text-[#453329]" onClick={() => setIssuedCredential(null)}>
                      I’ve shared these details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#eee6d8] border-[#d5cabe]">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-[#453329] flex items-center gap-2">
                <UserRoundCheck className="h-5 w-5 text-[#c4622d]" />
                Pending requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#688a52] mb-4">
                Review the student’s name, grade, and email before you issue journal access. Credentials are emailed automatically after approval. Older requests may show details as unavailable.
              </p>
              {listLoading ? (
                <p className="text-sm text-[#688a52]">Loading requests…</p>
              ) : pendingRequests.length === 0 ? (
                <p className="text-sm text-[#688a52] italic py-3">No anonymous access requests are waiting right now.</p>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  {pendingRequests.map((request) => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      onIssued={(credential) => {
                        setIssuedCredential(credential);
                        queryClient.invalidateQueries({ queryKey: ['teacher-anonymous-access'] });
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#eee6d8] border-[#d5cabe] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-[#453329] flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#c4622d]" />
                Issued access codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <p className="text-sm text-[#688a52] italic p-6">Approved anonymous accounts will appear here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#d5cabe] text-[#453329]">
                        <th className="text-left px-4 py-3 font-medium">Request ID</th>
                        <th className="text-left px-4 py-3 font-medium">Student</th>
                        <th className="text-left px-4 py-3 font-medium">Grade</th>
                        <th className="text-left px-4 py-3 font-medium">Email</th>
                        <th className="text-left px-4 py-3 font-medium">Access code</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account, index) => (
                        <AccountRow
                          key={account.id}
                          account={account}
                          tinted={index % 2 === 1}
                          onCredentialIssued={setIssuedCredential}
                          onToggleStatus={() => updateStatus({
                            accountId: account.id,
                            status: account.status === 'active' ? 'disabled' : 'active',
                          })}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StudioPage>
    </StudioLayout>
  );
}

function ApprovalCard({
  request,
  onIssued,
}: {
  request: AnonymousAccessRequest;
  onIssued: (credential: IssuedCredential) => void;
}) {
  const { toast } = useToast();
  const studentName = [request.firstName, request.lastName].filter(Boolean).join(' ') || 'Not provided';
  const studentGrade = request.grade ?? 'Not provided';
  const studentEmail = request.studentEmail ?? 'Not provided';
  const [accessCode, setAccessCode] = useState(`MM-${request.requestCode.replace('MM-', '')}`);
  const [password, setPassword] = useState('');
  const { mutate: approve, isPending } = useMutation({
    mutationFn: () => teacherAnonymousAccess.approve(request.id, { accessCode, password }),
    onSuccess: (data) => onIssued({
      accessCode: data.account.accessCode,
      password,
      message: data.emailSent
        ? `Request ${request.requestCode} is approved and the credentials were emailed to ${studentEmail}.`
        : `Request ${request.requestCode} is approved, but the credential email could not be sent. Use the details below to contact the student.`,
      emailSent: data.emailSent,
    }),
    onError: (error) => toast({ title: 'Unable to approve request', description: errorMessage(error), variant: 'destructive' }),
  });

  return (
    <div className="bg-white/70 rounded-xl border border-[#d5cabe] p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8a6a55]">Student</p>
          <p className="font-medium text-[#453329]">{studentName}</p>
          <p className="text-xs text-[#688a52] mt-1">{studentGrade}</p>
          <p className="text-xs text-[#688a52] mt-1 break-all">{studentEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-[#8a6a55]">Request ID</p>
          <p className="font-mono font-bold text-[#453329]">{request.requestCode}</p>
        </div>
        <Badge className="bg-[#d4a44c] text-white">Pending</Badge>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-[#453329]">Access code</Label>
          <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} className="bg-white border-[#d5cabe] font-mono mt-1" />
        </div>
        <div>
          <Label className="text-xs text-[#453329]">Initial password</Label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="bg-white border-[#d5cabe] mt-1" placeholder="At least 8 characters" />
        </div>
        <Button
          className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
          disabled={isPending || password.length < 8 || !accessCode.trim()}
          onClick={() => approve()}
        >
          {isPending ? 'Approving…' : 'Approve & issue credentials'}
        </Button>
      </div>
    </div>
  );
}

function AccountRow({
  account,
  tinted,
  onCredentialIssued,
  onToggleStatus,
}: {
  account: AnonymousAccessAccount;
  tinted: boolean;
  onCredentialIssued: (credential: IssuedCredential) => void;
  onToggleStatus: () => void;
}) {
  const studentName = [account.firstName, account.lastName].filter(Boolean).join(' ') || 'Not provided';
  const studentGrade = account.grade ?? 'Not provided';
  const studentEmail = account.studentEmail ?? 'Not provided';

  return (
    <tr className={tinted ? 'bg-[#f5efe5]' : 'bg-[#eee6d8]'}>
      <td className="px-4 py-3 font-mono text-[#688a52]">{account.requestCode}</td>
      <td className="px-4 py-3 font-medium text-[#453329]">{studentName}</td>
      <td className="px-4 py-3 text-[#688a52]">{studentGrade}</td>
      <td className="px-4 py-3 text-[#688a52] break-all">{studentEmail}</td>
      <td className="px-4 py-3 font-mono font-medium text-[#453329]">{account.accessCode}</td>
      <td className="px-4 py-3">
        <Badge className={account.status === 'active' ? 'bg-[#688a52] text-white' : 'bg-[#8a6a55] text-white'}>
          {account.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <ResetPasswordDialog account={account} onCredentialIssued={onCredentialIssued} />
          <Button
            size="sm"
            variant="outline"
            className={account.status === 'active'
              ? 'border-red-200 text-red-700 hover:bg-red-50'
              : 'border-[#688a52] text-[#688a52] hover:bg-[#e8f0e2]'}
            onClick={onToggleStatus}
          >
            {account.status === 'active' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ResetPasswordDialog({
  account,
  onCredentialIssued,
}: {
  account: AnonymousAccessAccount;
  onCredentialIssued: (credential: IssuedCredential) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: () => teacherAnonymousAccess.resetPassword(account.id, password),
    onSuccess: () => {
      setOpen(false);
      onCredentialIssued({
        accessCode: account.accessCode,
        password,
        message: `Password reset for ${account.accessCode}.`,
        emailSent: false,
      });
      setPassword('');
    },
    onError: (error) => toast({ title: 'Unable to reset password', description: errorMessage(error), variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-[#d5cabe] text-[#453329]">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset password
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#eee6d8] border-[#d5cabe]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#453329] flex items-center gap-2">
            <LockKeyhole className="h-4 w-4" /> Reset password for {account.accessCode}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#453329]">New password</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="bg-white border-[#d5cabe] mt-1" placeholder="At least 8 characters" />
          </div>
          <Button
            className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
            disabled={isPending || password.length < 8}
            onClick={() => resetPassword()}
          >
            {isPending ? 'Resetting…' : 'Save new password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}