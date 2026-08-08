import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { studioAuth } from '@/lib/studioApi';

export default function StudioLogin() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlError = params.get('error');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (creds: { u: string; p: string }) => studioAuth.login(creds.u, creds.p),
    onSuccess: (data) => {
      queryClient.setQueryData(['studio-user'], data.user);
      const dest = data.user.role === 'teacher' ? '/studio/teacher' : '/studio';
      navigate(dest);
    },
  });

  const loginError = loginMutation.error instanceof Error
    ? loginMutation.error.message
    : loginMutation.isError ? 'Login failed' : null;

  return (
    <div className="min-h-screen bg-[#f5efe5] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
            <path d="M50 20 C50 20 38 14 28 18 C18 22 12 32 14 42 C16 52 22 58 28 62 C34 66 44 68 50 68 Z" fill="#C4622D"/>
            <path d="M50 20 C50 20 62 14 72 18 C82 22 88 32 86 42 C84 52 78 58 72 62 C66 66 56 68 50 68 Z" fill="#D4734A"/>
            <path d="M50 18 C50 18 48 30 49 45 C49.5 55 50 68 50 68" stroke="#A8522A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
            <circle cx="38" cy="46" r="4.5" fill="#FAF3E3"/>
            <circle cx="62" cy="46" r="4.5" fill="#FAF3E3"/>
            <circle cx="39" cy="46" r="2.5" fill="#3D2314"/>
            <circle cx="63" cy="46" r="2.5" fill="#3D2314"/>
            <circle cx="40" cy="44.5" r="1" fill="white"/>
            <circle cx="64" cy="44.5" r="1" fill="white"/>
            <path d="M38 56 Q50 65 62 56" stroke="#3D2314" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <h1 className="font-serif text-4xl font-semibold text-[#453329]">Mind Matters</h1>
        <p className="text-[#688a52] mt-1 text-lg font-medium">Student Studio</p>
        <p className="text-[#8a6a55] mt-1 text-sm">Your creative workspace</p>
      </div>

      <Card className="w-full max-w-sm bg-[#eee6d8] border-[#d5cabe] shadow-lg">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="font-serif text-xl text-[#453329]">Sign in to Studio</CardTitle>
          <CardDescription className="text-[#688a52]">
            Enter your group username and password to get started.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {urlError === 'not_enrolled' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Your account hasn't been added to Mind Matters Studio yet. Ask your teacher.</p>
            </div>
          )}

          {!showTeacher ? (
            <>
              <form
                onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ u: username, p: password }); }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[#453329] text-sm">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d] font-mono"
                    placeholder="Enter your group username"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#453329] text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d] pr-10"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a6a55] hover:text-[#453329]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-[#453329] hover:bg-[#5a4035] text-white h-11 rounded-full font-medium"
                >
                  {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>

              <p className="text-xs text-[#8a6a55] mt-4 text-center">
                Ask your teacher if you don't know your login credentials.
              </p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-px bg-[#d5cabe]" />
                <span className="text-xs text-[#8a6a55]">or</span>
                <div className="flex-1 h-px bg-[#d5cabe]" />
              </div>

              <button
                onClick={() => { setShowTeacher(true); loginMutation.reset(); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-[#453329] hover:text-[#c4622d] transition-colors py-1 mt-1"
              >
                <Lock className="h-3.5 w-3.5" />
                Teacher login
              </button>
            </>
          ) : (
            <>
              <form
                onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ u: teacherUsername, p: teacherPassword }); }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="t-username" className="text-[#453329] text-sm">Username</Label>
                  <Input
                    id="t-username"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    autoComplete="username"
                    className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d]"
                    placeholder="Admin username"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="t-password" className="text-[#453329] text-sm">Password</Label>
                  <Input
                    id="t-password"
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d]"
                    placeholder="Admin password"
                    required
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-[#453329] hover:bg-[#5a4035] text-white h-11 rounded-full font-medium"
                >
                  {loginMutation.isPending ? 'Signing in…' : 'Sign in as Teacher'}
                </Button>
              </form>

              <button
                onClick={() => { setShowTeacher(false); loginMutation.reset(); }}
                className="w-full text-sm text-[#8a6a55] hover:text-[#453329] transition-colors py-1 mt-2"
              >
                ← Back to student login
              </button>
            </>
          )}
        </CardContent>
      </Card>

      <a href="/" className="mt-6 text-sm text-[#688a52] hover:text-[#453329] underline transition-colors">
        ← Back to Mind Matters
      </a>
    </div>
  );
}
