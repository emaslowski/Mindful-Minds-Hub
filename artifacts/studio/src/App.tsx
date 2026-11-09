import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

// Studio pages — students
import StudioLogin from '@/pages/studio/Login';
import StudentDashboard from '@/pages/studio/Dashboard';
import ProjectList from '@/pages/studio/ProjectList';
import ProjectWorkspace from '@/pages/studio/ProjectWorkspace';
import PeerReviewList from '@/pages/studio/PeerReviewList';
import PeerReviewPage from '@/pages/studio/PeerReviewPage';
import Portfolio from '@/pages/studio/Portfolio';
import HandoffNew from '@/pages/studio/HandoffNew';
import IncomingHandoffs from '@/pages/studio/IncomingHandoffs';
import VideoProductions from '@/pages/studio/VideoProductions';
import VideoProductionDetail from '@/pages/studio/VideoProductionDetail';

// Studio pages — teacher
import CommandCenter from '@/pages/studio/teacher/CommandCenter';
import ReviewQueue from '@/pages/studio/teacher/ReviewQueue';
import ProjectReview from '@/pages/studio/teacher/ProjectReview';
import AllProjects from '@/pages/studio/teacher/AllProjects';
import Students from '@/pages/studio/teacher/Students';
import Jobs from '@/pages/studio/teacher/Jobs';
import Cycles from '@/pages/studio/teacher/Cycles';
import Handoffs from '@/pages/studio/teacher/Handoffs';
import Analytics from '@/pages/studio/teacher/Analytics';
import Settings from '@/pages/studio/teacher/Settings';
import AnonymousAccess from '@/pages/studio/teacher/AnonymousAccess';
import TeacherArtwork from '@/pages/studio/teacher/Artwork';
import TeacherAthletes from '@/pages/studio/teacher/Athletes';
import Assistant from '@/pages/studio/teacher/Assistant';

const queryClient = new QueryClient();

/**
 * The studio artifact lives at /studio/ (served by the API server in production).
 * We use an empty wouter base so all route paths stay as /studio/* —
 * matching the navigate() calls and Link hrefs in every page file.
 */
function StudioRouter() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/studio/login" component={StudioLogin} />

      {/* Student routes */}
      <Route path="/studio/video-productions/:projectId" component={VideoProductionDetail} />
      <Route path="/studio/video-productions" component={VideoProductions} />
      <Route path="/studio/projects/:id" component={ProjectWorkspace} />
      <Route path="/studio/projects" component={ProjectList} />
      <Route path="/studio/peer-reviews/:projectId" component={PeerReviewPage} />
      <Route path="/studio/peer-reviews" component={PeerReviewList} />
      <Route path="/studio/handoff/new" component={HandoffNew} />
      <Route path="/studio/handoffs/incoming" component={IncomingHandoffs} />
      <Route path="/studio/portfolio" component={Portfolio} />
      <Route path="/studio" component={StudentDashboard} />

      {/* Teacher routes */}
      <Route path="/studio/teacher/assistant" component={Assistant} />
      <Route path="/studio/teacher/artwork" component={TeacherArtwork} />
      <Route path="/studio/teacher/athletes" component={TeacherAthletes} />
      <Route path="/studio/teacher/review/:id" component={ProjectReview} />
      <Route path="/studio/teacher/review" component={ReviewQueue} />
      <Route path="/studio/teacher/projects" component={AllProjects} />
      <Route path="/studio/teacher/students" component={Students} />
      <Route path="/studio/teacher/jobs" component={Jobs} />
      <Route path="/studio/teacher/cycles" component={Cycles} />
      <Route path="/studio/teacher/handoffs" component={Handoffs} />
      <Route path="/studio/teacher/analytics" component={Analytics} />
      <Route path="/studio/teacher/settings" component={Settings} />
      <Route path="/studio/teacher/anonymous-access" component={AnonymousAccess} />
      <Route path="/studio/teacher" component={CommandCenter} />

      {/* Catch-all: any unmatched /studio/* goes to login */}
      <Route>{() => { window.location.replace('/studio/login'); return null; }}</Route>
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Empty base: all route paths keep their full /studio/* prefix */}
        <WouterRouter base="">
          <RoutedErrorBoundary>
            <StudioRouter />
          </RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
