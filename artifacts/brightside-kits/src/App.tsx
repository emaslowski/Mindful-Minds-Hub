import { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Home from '@/pages/Home';
import Kits from '@/pages/Kits';
import Order from '@/pages/Order';
import Thanks from '@/pages/Thanks';
import NotFound from '@/pages/NotFound';

/** Scroll to the top on route change, or to a #hash when one is given. */
function ScrollManager() {
  const [location] = useLocation();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [location]);
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
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}
