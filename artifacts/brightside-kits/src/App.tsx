import { useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { useLocationProperty } from 'wouter/use-browser-location';

import { scrollToHash } from '@/lib/scroll';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Home from '@/pages/Home';
import Kits from '@/pages/Kits';
import Order from '@/pages/Order';
import Thanks from '@/pages/Thanks';
import SchoolLogin from '@/pages/SchoolLogin';
import NotFound from '@/pages/NotFound';

const currentHref = () => window.location.pathname + window.location.search + window.location.hash;

/**
 * Scroll to the top on route change, or to a #hash when one is given.
 * Watches the full URL (not just the path), so "/#about" clicked while already on
 * the home page still scrolls: wouter cancels the browser's own jump for those links.
 */
function ScrollManager() {
  const href = useLocationProperty(currentHref, () => '');
  useEffect(() => {
    if (scrollToHash(window.location.hash)) return;
    window.scrollTo({ top: 0 });
  }, [href]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/kits" component={Kits} />
          <Route path="/order" component={Order} />
          <Route path="/thanks" component={Thanks} />
          <Route path="/school-login" component={SchoolLogin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}
