import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Palette, LayoutGrid, Star, CheckCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function Landing() {
  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-muted/50 to-background py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="hero-title">
              Get testimonials without <span className="text-primary">chasing clients</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Automate testimonial collection and build trust effortlessly. Let your clients come to you with powerful automation.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="text-lg font-semibold hover:scale-105 transition-all duration-200"
              data-testid="button-hero-cta"
            >
              Start Free Trial
            </Button>
            <p className="text-sm text-muted-foreground mt-4" data-testid="hero-note">
              No credit card required • 5-minute setup
            </p>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16">
            <Card className="max-w-4xl mx-auto shadow-xl border border-border">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted/50 rounded-xl p-6" data-testid={`testimonial-preview-${i}`}>
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <Star className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-3">
                          <div className="w-20 h-3 bg-muted rounded"></div>
                          <div className="w-16 h-2 bg-muted/70 rounded mt-1"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-muted rounded"></div>
                        <div className="w-4/5 h-2 bg-muted rounded"></div>
                        <div className="w-full h-2 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="features-title">
              Everything you need to collect testimonials
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="features-subtitle">
              Automate the entire process from request to display, so you can focus on what you do best.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Automated Reminders */}
            <Card className="hover:shadow-xl transition-shadow duration-300" data-testid="feature-automated-reminders">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Automated Reminders</h3>
                <p className="text-muted-foreground mb-6">
                  Set up smart reminder sequences that follow up with clients automatically. Never lose a testimonial opportunity again.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Customizable timing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Multiple reminder types
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Smart delivery optimization
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: Branded Forms */}
            <Card className="hover:shadow-xl transition-shadow duration-300" data-testid="feature-branded-forms">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Palette className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Branded Forms</h3>
                <p className="text-muted-foreground mb-6">
                  Beautiful, mobile-friendly testimonial forms that match your brand perfectly and convert visitors into advocates.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Custom branding
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Mobile responsive
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Video & text support
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: Testimonial Wall */}
            <Card className="hover:shadow-xl transition-shadow duration-300" data-testid="feature-testimonial-wall">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <LayoutGrid className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Testimonial Wall</h3>
                <p className="text-muted-foreground mb-6">
                  Showcase your testimonials with a beautiful, embeddable wall that builds trust and drives conversions on any website.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Easy embedding
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    Multiple layouts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                    SEO optimized
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-muted-foreground font-medium" data-testid="trusted-by-title">
              Trusted by thousands of businesses worldwide
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Company", "Agency", "Studio", "Freelancer", "Consultant"].map((name, index) => (
              <div 
                key={index}
                className="w-32 h-12 bg-muted rounded-lg flex items-center justify-center"
                data-testid={`trusted-logo-${index + 1}`}
              >
                <span className="text-muted-foreground font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="pricing-preview-title">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="pricing-preview-subtitle">
              Choose the plan that works for your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="hover:shadow-lg transition-shadow duration-300" data-testid="pricing-card-free">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free</h3>
                  <div className="text-3xl font-bold text-foreground mb-2">$0</div>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>1 project</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>3 testimonials</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Basic forms</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  variant="outline" 
                  className="w-full"
                  data-testid="button-pricing-free"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-lg relative" data-testid="pricing-card-pro">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pro</h3>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    $19<span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>5 projects</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Unlimited testimonials</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Analytics</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full"
                  data-testid="button-pricing-pro"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Agency Plan */}
            <Card className="hover:shadow-lg transition-shadow duration-300" data-testid="pricing-card-agency">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Agency</h3>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    $49<span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-muted-foreground">For agencies & teams</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>20 projects</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>White-label solution</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  variant="outline" 
                  className="w-full"
                  data-testid="button-pricing-agency"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button variant="link" className="text-primary" data-testid="link-view-detailed-pricing">
              View detailed pricing →
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
