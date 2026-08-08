import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { studioAuth, type StudioUser } from '@/lib/studioApi';

export function useStudioUser() {
  return useQuery({
    queryKey: ['studio-user'],
    queryFn: () => studioAuth.me().then((r) => r.user),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useStudioLogout() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  return useMutation({
    mutationFn: () => studioAuth.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['studio-user'], null);
      navigate('/studio/login');
    },
  });
}

/**
 * Redirect to /studio/login if not authenticated or wrong role.
 * Returns { user, isLoading }.
 */
export function useRequireStudioRole(
  ...roles: Array<'student' | 'teacher'>
): { user: StudioUser | null | undefined; isLoading: boolean } {
  const { data: user, isLoading } = useStudioUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/studio/login');
    } else if (roles.length > 0 && !roles.includes(user.role)) {
      navigate(user.role === 'teacher' ? '/studio/teacher' : '/studio');
    }
  }, [isLoading, user]);

  return { user, isLoading };
}
