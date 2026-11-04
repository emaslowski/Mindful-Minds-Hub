import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Redirect,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { useTrackPageView } from '@workspace/api-client-react';

import { Layout } from '@/components/Layout';
import { WebsiteRulesGate } from '@/components/WebsiteRulesGate';
import { ExplorationProvider } from '@/components/ExplorationProvider';
import Home from '@/pages/Home';
import { GardeningPage, GardeningVideosPage, LanguageCornerPage, GamesPage } from '@/pages/ActivityPages';
import { SignLanguageVideosPage } from '@/components/language/LanguageCenter';
import Learn from '@/pages/Learn';
import Create from '@/pages/Create';
import ColoringStudio from '@/pages/ColoringStudio';
import Cooking from '@/pages/Cooking';
import Connect from '@/pages/Connect';
import Move from '@/pages/Move';
import MoveActivity from '@/pages/MoveActivity';
import DirectedDraws from '@/pages/DirectedDraws';
import Listen from '@/pages/Listen';
import ListenAsmr from '@/pages/ListenAsmr';
import Grow from '@/pages/Grow';
import GrowJournal from '@/pages/GrowJournal';
import GrowGratitude from '@/pages/GrowGratitude';
import GrowCollab from '@/pages/GrowCollab';
import BlankTemplate from '@/pages/BlankTemplate';
import BlogPost from '@/pages/BlogPost';
import SubmitPost from '@/pages/SubmitPost';
import Resources from '@/pages/Resources';
import Events from '@/pages/Events';
import CheckIn from '@/pages/CheckIn';
import Review from '@/pages/Review';
import Contact from '@/pages/Contact';
import ListenPodcast from '@/pages/ListenPodcast';
import ListenMeditations from '@/pages/ListenMeditations';
import AnonymousAccess from '@/pages/AnonymousAccess';
import PublishedContentDetail from '@/pages/PublishedContentDetail';

const queryClient = new QueryClient();

function PageTracker() {
  const [location] = useLocation();
  const { mutate: trackPageView } = useTrackPageView();

  useEffect(() => {
    const section = location.split('/')[1] || 'home';
    trackPageView({ data: { path: location, section: section || null } });
  }, [location]);

  return null;
}

function PublicRouter() {
  return (
    <Layout>
      <PageTracker />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/gardening/bryan-the-plant-guy" component={GardeningVideosPage} />
        <Route path="/gardening" component={GardeningPage} />
        <Route path="/language-corner/sign-language-videos" component={SignLanguageVideosPage} />
        <Route path="/language-corner" component={LanguageCornerPage} />
        <Route path="/games" component={GamesPage} />

        {/* Top Nav */}
        <Route path="/about"><Redirect to="/" /></Route>
        <Route path="/resources" component={Resources} />
        <Route path="/events" component={Events} />
        <Route path="/contact" component={Contact} />
        <Route path="/anonymous-access" component={AnonymousAccess} />

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
        <Route path="/create/directed-draws" component={DirectedDraws} />
        <Route path="/create/coloring-pages" component={ColoringStudio} />
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
        <Route path="/connect/blog/:id" component={BlogPost} />
        <Route path="/connect/post/:id" component={BlogPost} />
        <Route path="/content/publication/:id" component={PublishedContentDetail} />

        {/* Move Section */}
        <Route path="/move" component={Move} />
        <Route path="/move/:category" component={MoveActivity} />

        {/* Listen Section */}
        <Route path="/listen" component={Listen} />
        <Route path="/listen/asmr" component={ListenAsmr} />
        <Route path="/listen/podcast" component={ListenPodcast} />
        <Route path="/listen/calm-music">
          {() => <BlankTemplate title="Calm Music" subtitle="Relaxing playlists coming soon. Students can add music links here!" />}
        </Route>
        <Route path="/listen/focus-sounds">
          {() => <ListenMeditations focus />}
        </Route>
        <Route path="/listen/dance-tutorials" component={ListenMeditations} />
        <Route path="/listen/meditations" component={ListenMeditations} />
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
          <WebsiteRulesGate>
            <ExplorationProvider>
              <RoutedErrorBoundary>
                <PublicRouter />
              </RoutedErrorBoundary>
            </ExplorationProvider>
          </WebsiteRulesGate>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
