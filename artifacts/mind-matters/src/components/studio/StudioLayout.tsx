import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useStudioUser, useStudioLogout } from '@/hooks/useStudioAuth';
import {
  LayoutDashboard, FolderOpen, Users, Star, Send, BookOpen,
  LogOut, Globe, ClipboardCheck, BarChart3, RefreshCw,
  Briefcase, CalendarDays, ChevronRight, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const STUDENT_NAV: NavItem[] = [
  { href: '/studio', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/studio/projects', label: 'My Projects', icon: <FolderOpen className="h-4 w-4" /> },
  { href: '/studio/peer-reviews', label: 'Peer Reviews', icon: <ClipboardCheck className="h-4 w-4" /> },
  { href: '/studio/handoff/new', label: 'Handoffs', icon: <RefreshCw className="h-4 w-4" /> },
  { href: '/studio/portfolio', label: 'My Portfolio', icon: <Star className="h-4 w-4" /> },
];

const TEACHER_NAV: NavItem[] = [
  { href: '/studio/teacher', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/studio/teacher/review', label: 'Review Submissions', icon: <ClipboardCheck className="h-4 w-4" /> },
  { href: '/studio/teacher/projects', label: 'All Projects', icon: <FolderOpen className="h-4 w-4" /> },
  { href: '/studio/teacher/students', label: 'Students', icon: <Users className="h-4 w-4" /> },
  { href: '/studio/teacher/teams', label: 'Teams', icon: <Users className="h-4 w-4" /> },
  { href: '/studio/teacher/jobs', label: 'Jobs', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/studio/teacher/cycles', label: 'Class Cycles', icon: <CalendarDays className="h-4 w-4" /> },
  { href: '/studio/teacher/handoffs', label: 'Handoffs', icon: <RefreshCw className="h-4 w-4" /> },
  { href: '/studio/teacher/analytics', label: 'Impact & Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/studio/teacher/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export function StudioLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useStudioUser();
  const { mutate: logout } = useStudioLogout();
  const [location] = useLocation();

  const nav = user?.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const dashboardRoot = user?.role === 'teacher' ? '/studio/teacher' : '/studio';

  return (
    <div className="flex h-screen bg-[#f5efe5] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#453329] text-[#f5efe5] flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#5a4035]">
          <Link href={dashboardRoot}>
            <h1 className="font-serif text-lg font-semibold leading-tight">
              Mind Matters
            </h1>
            <p className="text-xs text-[#d5cabe] mt-0.5">
              {user?.role === 'teacher' ? 'Command Center' : 'Studio'}
            </p>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4 border-b border-[#5a4035]">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            {user.role === 'student' && (
              <div className="mt-1 space-y-0.5">
                {user.jobTitle && (
                  <p className="text-xs text-[#d5cabe]">
                    <Briefcase className="inline h-3 w-3 mr-1" />
                    {user.jobTitle}
                  </p>
                )}
                {user.teamName && (
                  <p className="text-xs text-[#d5cabe]">
                    <Users className="inline h-3 w-3 mr-1" />
                    {user.teamName}
                  </p>
                )}
                {user.cycleName && (
                  <p className="text-xs text-[#d5cabe]">
                    <CalendarDays className="inline h-3 w-3 mr-1" />
                    {user.cycleName}
                  </p>
                )}
              </div>
            )}
            {user.role === 'teacher' && (
              <p className="text-xs text-[#d5cabe] mt-0.5">Teacher / Admin</p>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === '/studio' || item.href === '/studio/teacher'
                ? location === item.href
                : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                    active
                      ? 'bg-[#c4622d] text-white font-medium'
                      : 'text-[#d5cabe] hover:bg-[#5a4035] hover:text-white',
                  )}
                >
                  {item.icon}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[#5a4035] space-y-1">
          <Link href="/">
            <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#d5cabe] hover:bg-[#5a4035] hover:text-white transition-colors cursor-pointer">
              <Globe className="h-4 w-4" />
              Public Website
            </span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#d5cabe] hover:bg-[#5a4035] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export function StudioPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#453329]">{title}</h1>
          {subtitle && <p className="text-sm text-[#688a52] mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Assigned': 'bg-amber-100 text-amber-800',
    'Researching': 'bg-blue-100 text-blue-800',
    'Drafting': 'bg-purple-100 text-purple-800',
    'Peer Review': 'bg-orange-100 text-orange-800',
    'Revision Needed': 'bg-red-100 text-red-800',
    'Ready for Teacher Review': 'bg-teal-100 text-teal-800',
    'Teacher Reviewing': 'bg-indigo-100 text-indigo-800',
    'Approved': 'bg-green-100 text-green-800',
    'Published': 'bg-emerald-100 text-emerald-800',
    'Archived': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[status] ?? 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  );
}
