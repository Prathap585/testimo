import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Pricing from "@/pages/pricing";
import HowItWorks from "@/pages/how-it-works";
import About from "@/pages/about";
import ProjectDetails from "@/pages/project-details";
import SubmitTestimonial from "@/pages/submit-testimonial";
import Testimonials from "@/pages/testimonials";
import Embed from "@/pages/embed";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/submit/:id" component={SubmitTestimonial} />
          <Route path="/testimonials" component={Testimonials} />
          <Route path="/embed/:projectId" component={Embed} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/about" component={About} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/projects/:id" component={ProjectDetails} />
          <Route path="/submit/:id" component={SubmitTestimonial} />
          <Route path="/testimonials" component={Testimonials} />
          <Route path="/embed/:projectId" component={Embed} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/about" component={About} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
