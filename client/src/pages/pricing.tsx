import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Get current subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      return await apiRequest("POST", "/api/subscription/create-checkout", { plan });
    },
    onSuccess: (data: any) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
    } else {
      window.location.href = "/";
    }
  };

  const handleUpgrade = (plan: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    createCheckoutMutation.mutate(plan);
  };

  const currentPlan = subscriptionStatus?.plan || 'free';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="pricing-title">
              Choose your plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="pricing-subtitle">
              Start free, upgrade when you're ready. All plans include a 14-day free trial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="shadow-lg" data-testid="pricing-detailed-free">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
                  <div className="text-4xl font-bold text-foreground mb-4">$0</div>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>1 project</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Up to 3 testimonials</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Basic testimonial forms</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Email collection</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Basic testimonial wall</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  variant={currentPlan === 'free' ? 'secondary' : 'outline'}
                  className="w-full"
                  data-testid="button-pricing-detailed-free"
                  disabled={currentPlan === 'free'}
                >
                  {currentPlan === 'free' ? 'Current Plan' : 'Get Started Free'}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-xl relative transform scale-105" data-testid="pricing-detailed-pro">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-foreground mb-4">
                    $19<span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>5 projects</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Unlimited testimonials</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Custom branded forms</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Advanced testimonial wall</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Analytics & insights</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Email automation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Video testimonials</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Export options</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  className="w-full"
                  data-testid="button-pricing-detailed-pro"
                  disabled={createCheckoutMutation.isPending || currentPlan === 'pro'}
                >
                  {createCheckoutMutation.isPending ? 'Loading...' : 
                   currentPlan === 'pro' ? 'Current Plan' : 
                   currentPlan === 'free' ? 'Upgrade to Pro' : 'Switch to Pro'}
                </Button>
              </CardContent>
            </Card>

            {/* Agency Plan */}
            <Card className="shadow-lg" data-testid="pricing-detailed-agency">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Agency</h3>
                  <div className="text-4xl font-bold text-foreground mb-4">
                    $49<span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">For agencies & teams</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>20 projects</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Unlimited testimonials</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>White-label solution</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Custom integrations</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleUpgrade('agency')}
                  variant={currentPlan === 'agency' ? 'secondary' : 'outline'}
                  className="w-full"
                  data-testid="button-pricing-detailed-agency"
                  disabled={createCheckoutMutation.isPending || currentPlan === 'agency'}
                >
                  {createCheckoutMutation.isPending ? 'Loading...' : 
                   currentPlan === 'agency' ? 'Current Plan' : 
                   'Upgrade to Agency'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-12" data-testid="faq-title">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              <Card data-testid="faq-change-plans">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Can I change plans anytime?</h3>
                  <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                </CardContent>
              </Card>
              
              <Card data-testid="faq-refunds">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Do you offer refunds?</h3>
                  <p className="text-muted-foreground">We offer a 30-day money-back guarantee on all paid plans. No questions asked.</p>
                </CardContent>
              </Card>
              
              <Card data-testid="faq-projects">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">What counts as a project?</h3>
                  <p className="text-muted-foreground">A project is typically one business, brand, or service that you're collecting testimonials for.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
