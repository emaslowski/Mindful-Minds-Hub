import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studioAuth } from '@/lib/studioApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function StudioLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { mutate: login, isPending, error } = useMutation({
    mutationFn: () => studioAuth.login(username.trim(), password),
    onSuccess: (data) => {
      queryClient.setQueryData(['studio-user'], data.user);
      if (data.user.role === 'teacher') {
        navigate('/studio/teacher');
      } else {
        navigate('/studio');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username && password) login();
  }

  return (
    <div className="min-h-screen bg-[#f5efe5] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl font-semibold text-[#453329]">Mind Matters</h1>
        <p className="text-[#688a52] mt-2 text-lg">Student Studio</p>
      </div>

      <Card className="w-full max-w-sm bg-[#eee6d8] border-[#d5cabe] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-xl text-[#453329]">Sign in</CardTitle>
          <CardDescription className="text-[#688a52]">
            Use the username and password provided by your teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[#453329]">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                autoComplete="username"
                className="bg-white border-[#d5cabe] focus:border-[#c4622d]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#453329]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-white border-[#d5cabe] focus:border-[#c4622d]"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending || !username || !password}
              className="w-full bg-[#c4622d] hover:bg-[#a85226] text-white rounded-full"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-xs text-[#688a52] mt-4 text-center">
            Don't have an account? Ask your teacher to set one up for you.
          </p>
        </CardContent>
      </Card>

      <a href="/" className="mt-6 text-sm text-[#688a52] hover:text-[#453329] underline">
        ← Back to Mind Matters
      </a>
    </div>
  );
}
