import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { useTrackPageView } from '@workspace/api-client-react';

import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import Learn from '@/pages/Learn';
import Create from '@/pages/Create';
import Cooking from '@/pages/Cooking';
import Connect from '@/pages/Connect';
import Move from '@/pages/Move';
import Listen from '@/pages/Listen';
import Grow from '@/pages/Grow';
import GrowJournal from '@/pages/GrowJournal';
import GrowGratitude from '@/pages/GrowGratitude';
import GrowCollab from '@/pages/GrowCollab';
import BlankTemplate from '@/pages/BlankTemplate';
import BlogPost from '@/pages/BlogPost';
import SubmitPost from '@/pages/SubmitPost';
import AboutUs from '@/pages/AboutUs';
import Resources from '@/pages/Resources';
import Events from '@/pages/Events';
import CheckIn from '@/pages/CheckIn';
import Review from '@/pages/Review';
import Contact from '@/pages/Contact';
import ListenPodcast from '@/pages/ListenPodcast';

// ── Studio pages ──────────────────────────────────────────────────────────
import StudioLogin from '@/pages/studio/Login';
import StudentDashboard from '@/pages/studio/Dashboard';
import ProjectList from '@/pages/studio/ProjectList';
import ProjectWorkspace from '@/pages/studio/ProjectWorkspace';
import PeerReviewList from '@/pages/studio/PeerReviewList';
import PeerReviewPage from '@/pages/studio/PeerReviewPage';
import Portfolio from '@/pages/studio/Portfolio';
import HandoffNew from '@/pages/studio/HandoffNew';
import IncomingHandoffs from '@/pages/studio/IncomingHandoffs';
import CommandCenter from '@/pages/studio/teacher/CommandCenter';
import ReviewQueue from '@/pages/studio/teacher/ReviewQueue';
import ProjectReview from '@/pages/studio/teacher/ProjectReview';
import AllProjects from '@/pages/studio/teacher/AllProjects';
import Students from '@/pages/studio/teacher/Students';
import Teams from '@/pages/studio/teacher/Teams';
import Jobs from '@/pages/studio/teacher/Jobs';
import Cycles from '@/pages/studio/teacher/Cycles';
import Handoffs from '@/pages/studio/teacher/Handoffs';
import Analytics from '@/pages/studio/teacher/Analytics';
import TeacherSettings from '@/pages/studio/teacher/Settings';

const queryClient = new QueryClient();

function PageTracker() {
  const [location] = useLocation();
  const { mutate: trackPageView } = useTrackPageView();

  useEffect(() => {
    // Extract section from path (e.g. /learn -> "learn")
    const section = location.split('/')[1] || 'home';
    trackPageView({ data: { path: location, section: section || null } });
  }, [location]);

  return null;
}

function StudioRouter() {
  return (
    <Switch>
      <Route path="/studio/login" component={StudioLogin} />
      <Route path="/studio/teacher/review/:id" component={ProjectReview} />
      <Route path="/studio/teacher/review" component={ReviewQueue} />
      <Route path="/studio/teacher/projects" component={AllProjects} />
      <Route path="/studio/teacher/students" component={Students} />
      <Route path="/studio/teacher/teams" component={Teams} />
      <Route path="/studio/teacher/jobs" component={Jobs} />
      <Route path="/studio/teacher/cycles" component={Cycles} />
      <Route path="/studio/teacher/handoffs" component={Handoffs} />
      <Route path="/studio/teacher/analytics" component={Analytics} />
      <Route path="/studio/teacher/settings" component={TeacherSettings} />
      <Route path="/studio/teacher" component={CommandCenter} />
      <Route path="/studio/projects/:id" component={ProjectWorkspace} />
      <Route path="/studio/projects" component={ProjectList} />
      <Route path="/studio/peer-reviews/:projectId" component={PeerReviewPage} />
      <Route path="/studio/peer-reviews" component={PeerReviewList} />
      <Route path="/studio/handoff/new" component={HandoffNew} />
      <Route path="/studio/handoffs/incoming" component={IncomingHandoffs} />
      <Route path="/studio/portfolio" component={Portfolio} />
      <Route path="/studio" component={StudentDashboard} />
    </Switch>
  );
}

function AppRouter() {
  const [location] = useLocation();
  if (location.startsWith('/studio')) {
    return <StudioRouter />;
  }
  return <PublicRouter />;
}

function PublicRouter() {
  return (
    <Layout>
      <PageTracker />
      <Switch>
        <Route path="/" component={Home} />

        {/* Top Nav */}
        <Route path="/about" component={AboutUs} />
        <Route path="/resources" component={Resources} />
        <Route path="/events" component={Events} />
        <Route path="/contact" component={Contact} />

        {/* Check-in */}
        <Route path="/checkin" component={CheckIn} />

        {/* Review */}
        <Route path="/review" component={Review} />

        {/* Learn Section */}
        <Route path="/learn" component={Learn} />
        <Route path="/learn/:strategy">
          {() => <BlankTemplate title="Strategy Guide" subtitle="This page is coming soon! Check back for tips and activities." />}
        </Route>

        {/* Create Section */}
        <Route path="/create" component={Create} />
        <Route path="/create/cooking" component={Cooking} />
        <Route path="/create/cooking/videos">
          {() => <BlankTemplate title="Cooking Videos" subtitle="Grab your apron! Videos coming soon." />}
        </Route>
        <Route path="/create/cooking/recipes/:id">
          {() => <BlankTemplate title="Recipe Details" subtitle="Full recipe instructions coming soon!" />}
        </Route>
        <Route path="/create/:section">
          {() => <BlankTemplate title="Art Corner" subtitle="Express yourself and relax..." />}
        </Route>

        {/* Connect Section */}
        <Route path="/connect" component={Connect} />
        <Route path="/connect/submit" component={SubmitPost} />
        <Route path="/connect/post/:id" component={BlogPost} />

        {/* Move Section */}
        <Route path="/move" component={Move} />
        <Route path="/move/:category">
          {() => <BlankTemplate title="Let's Move" subtitle="New workouts and challenges coming soon. Students can add content here!" />}
        </Route>

        {/* Listen Section */}
        <Route path="/listen" component={Listen} />
        <Route path="/listen/podcast" component={ListenPodcast} />
        <Route path="/listen/calm-music">
          {() => <BlankTemplate title="Calm Music" subtitle="Relaxing playlists coming soon. Students can add music links here!" />}
        </Route>
        <Route path="/listen/focus-sounds">
          {() => <BlankTemplate title="Focus Sounds" subtitle="Focus playlists coming soon. Students can add content here!" />}
        </Route>
        <Route path="/listen/meditations">
          {() => <BlankTemplate title="Guided Meditations" subtitle="Meditation videos coming soon. Students can add content here!" />}
        </Route>
        <Route path="/listen/nature-sounds">
          {() => <BlankTemplate title="Nature Sounds" subtitle="Nature sound playlists coming soon. Students can add content here!" />}
        </Route>
        <Route path="/listen/:category">
          {() => <BlankTemplate title="Listening Station" subtitle="New sounds and podcasts coming soon." />}
        </Route>

        {/* Grow Section */}
        <Route path="/grow" component={Grow} />
        <Route path="/grow/journal" component={GrowJournal} />
        <Route path="/grow/gratitude" component={GrowGratitude} />
        <Route path="/grow/collab" component={GrowCollab} />
        <Route path="/grow/:category">
          {() => <BlankTemplate title="Personal Growth" subtitle="New content coming soon." />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary>
            <AppRouter />
          </RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
