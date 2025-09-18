import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, CreditCard, Calendar, Zap, Users, Building } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Subscription() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
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

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel", {});
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (plan: string) => {
    createCheckoutMutation.mutate(plan);
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'agency': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = (subscriptionStatus as any)?.plan || 'free';
  const usage = (subscriptionStatus as any)?.usage || { projects: 0, testimonials: 0 };
  const limits = (subscriptionStatus as any)?.limits || { projects: 1, testimonials: 3 };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="subscription-title">
            Subscription & Usage
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and view your current usage
          </p>
        </div>

        {/* Current Plan */}
        <Card className="mb-8" data-testid="current-plan-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  {currentPlan === 'free' ? 'You are on the free plan' : 
                   currentPlan === 'pro' ? 'You are on the Pro plan' :
                   'You are on the Agency plan'}
                </CardDescription>
              </div>
              <Badge variant={getBadgeVariant(currentPlan)} className="text-sm">
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  ${currentPlan === 'free' ? '0' : currentPlan === 'pro' ? '19' : '49'}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
              
              {(subscriptionStatus as any)?.currentPeriodEnd && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Renews {formatDate((subscriptionStatus as any).currentPeriodEnd)}</span>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <Badge variant={(subscriptionStatus as any)?.status === 'active' ? 'default' : 'destructive'}>
                  {(subscriptionStatus as any)?.status || 'Active'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card className="mb-8" data-testid="usage-overview-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Usage Overview
            </CardTitle>
            <CardDescription>
              Your current usage for this billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Projects Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Projects</span>
                <span className="text-sm text-muted-foreground">
                  {usage.projects} / {limits.projects === Infinity ? '∞' : limits.projects}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usage.projects, limits.projects)} 
                className="h-2"
              />
              {usage.projects >= limits.projects && limits.projects !== Infinity && (
                <p className="text-sm text-destructive mt-1">
                  You've reached your project limit. Upgrade to create more projects.
                </p>
              )}
            </div>

            {/* Testimonials Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Testimonials</span>
                <span className="text-sm text-muted-foreground">
                  {usage.testimonials} / {limits.testimonials === Infinity ? '∞' : limits.testimonials}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usage.testimonials, limits.testimonials)} 
                className="h-2"
              />
              {usage.testimonials >= limits.testimonials && limits.testimonials !== Infinity && (
                <p className="text-sm text-destructive mt-1">
                  You've reached your testimonial limit. Upgrade for unlimited testimonials.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <Card className={currentPlan === 'free' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Free</CardTitle>
              <div className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>1 project</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Up to 3 testimonials</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Basic features</span>
              </div>
              <Button 
                variant={currentPlan === 'free' ? 'secondary' : 'outline'}
                className="w-full mt-4"
                disabled={currentPlan === 'free'}
                data-testid="free-plan-button"
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={currentPlan === 'pro' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pro
              </CardTitle>
              <div className="text-2xl font-bold">$19<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>5 projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Unlimited testimonials</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Advanced features</span>
              </div>
              <Button 
                onClick={() => handleUpgrade('pro')}
                className="w-full mt-4"
                disabled={createCheckoutMutation.isPending || currentPlan === 'pro'}
                data-testid="pro-plan-button"
              >
                {createCheckoutMutation.isPending ? 'Loading...' : 
                 currentPlan === 'pro' ? 'Current Plan' : 
                 'Upgrade to Pro'}
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className={currentPlan === 'agency' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Agency
              </CardTitle>
              <div className="text-2xl font-bold">$49<span className="text-sm font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>20 projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Unlimited testimonials</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Premium features</span>
              </div>
              <Button 
                onClick={() => handleUpgrade('agency')}
                variant={currentPlan === 'agency' ? 'secondary' : 'outline'}
                className="w-full mt-4"
                disabled={createCheckoutMutation.isPending || currentPlan === 'agency'}
                data-testid="agency-plan-button"
              >
                {createCheckoutMutation.isPending ? 'Loading...' : 
                 currentPlan === 'agency' ? 'Current Plan' : 
                 'Upgrade to Agency'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Actions */}
        {currentPlan !== 'free' && (
          <Card data-testid="subscription-actions-card">
            <CardHeader>
              <CardTitle>Subscription Actions</CardTitle>
              <CardDescription>
                Manage your subscription settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCancel}
                variant="destructive"
                disabled={cancelSubscriptionMutation.isPending}
                data-testid="cancel-subscription-button"
              >
                {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Your subscription will remain active until the end of your current billing period.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}