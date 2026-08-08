import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { studioAuth } from '@/lib/studioApi';

// Google "G" logo SVG (official brand colors)
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function StudioLogin() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlError = params.get('error');

  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: () => studioAuth.login(username, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['studio-user'], data.user);
      navigate('/studio/teacher');
    },
  });

  function handleGoogleSignIn() {
    window.location.href = '/api/auth/google?returnTo=/studio';
  }

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
            {showTeacherForm
              ? 'Teacher access — enter your admin credentials.'
              : 'Use your school Google account to access your workspace.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* URL errors (e.g. not_enrolled from Google callback) */}
          {urlError === 'not_enrolled' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Account not enrolled</p>
                <p className="mt-0.5">Your Google account hasn't been added to Mind Matters Studio yet. Ask your teacher to enroll you.</p>
              </div>
            </div>
          )}

          {!showTeacherForm ? (
            <>
              {/* Student: Google sign-in */}
              <Button
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-gray-50 text-[#453329] border border-[#d5cabe] shadow-sm rounded-full flex items-center justify-center gap-3 h-11 font-medium transition-colors"
              >
                <GoogleIcon />
                Sign in with Google
              </Button>

              <p className="text-xs text-[#8a6a55] text-center">
                Only enrolled students and teachers can access the Studio.
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-[#d5cabe]" />
                <span className="text-xs text-[#8a6a55]">or</span>
                <div className="flex-1 h-px bg-[#d5cabe]" />
              </div>

              {/* Teacher login toggle */}
              <button
                onClick={() => setShowTeacherForm(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-[#453329] hover:text-[#c4622d] transition-colors py-1"
              >
                <Lock className="h-3.5 w-3.5" />
                Teacher login
              </button>
            </>
          ) : (
            <>
              {/* Teacher: username/password */}
              <form
                onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[#453329] text-sm">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="bg-white border-[#d5cabe] focus-visible:ring-[#c4622d]"
                    placeholder="Enter your username"
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
                  {loginMutation.isPending ? 'Signing in…' : 'Sign in as Teacher'}
                </Button>
              </form>

              <button
                onClick={() => { setShowTeacherForm(false); loginMutation.reset(); }}
                className="w-full text-sm text-[#8a6a55] hover:text-[#453329] transition-colors py-1"
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
