import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { initAdminAuth } from '@/lib/admin-auth';

import Home from '@/pages/home';
import Services from '@/pages/services';
import Fleet from '@/pages/fleet';
import Book from '@/pages/book';
import Contact from '@/pages/contact';
import AdminLogin from '@/pages/admin-login';
import Admin from '@/pages/admin';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/fleet" component={Fleet} />
      <Route path="/book" component={Book} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initAdminAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
