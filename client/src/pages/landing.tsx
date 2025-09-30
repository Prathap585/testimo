import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, CheckCircle, Clock, Star, MessageSquare, TrendingUp, Users, Zap, Shield, Sparkles } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleGetStarted = () => {
    setLocation("/signup");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-muted/30 via-background to-muted/20 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight" data-testid="hero-title">
              Collect Powerful Testimonials from Your Clients in <span className="text-primary">Minutes</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed" data-testid="hero-subtitle">
              Testimo helps freelancers and agencies request, manage, and showcase testimonials with ease. No more chasing clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="text-lg px-8 py-6 font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
                data-testid="button-hero-cta"
              >
                Get Started Free
              </Button>
              <p className="text-sm text-muted-foreground" data-testid="hero-note">
                No credit card required • Setup in 5 minutes
              </p>
            </div>
          </div>
          
          {/* Hero Visual - Sample Testimonial Cards */}
          <div className="mt-20">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-colors" data-testid="testimonial-preview-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "Testimo made collecting testimonials effortless. My clients love how simple the process is!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">SC</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Sarah Chen</div>
                        <div className="text-xs text-muted-foreground">Design Agency</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-colors" data-testid="testimonial-preview-2">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "The automated reminders saved me hours. I get more testimonials without lifting a finger."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">MP</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Mike Patterson</div>
                        <div className="text-xs text-muted-foreground">Freelance Developer</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-colors" data-testid="testimonial-preview-3">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "Perfect for managing testimonials across all my client projects. Highly recommend!"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">LK</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Lisa Kim</div>
                        <div className="text-xs text-muted-foreground">Marketing Consultant</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="how-it-works-title">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="how-it-works-subtitle">
              Three simple steps to start collecting testimonials
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center" data-testid="step-1">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Send className="text-primary-foreground h-10 w-10" />
              </div>
              <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Step 1
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Send a Request</h3>
              <p className="text-muted-foreground">
                Send personalized testimonial requests to your clients via email or share a custom link
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center" data-testid="step-2">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="text-primary-foreground h-10 w-10" />
              </div>
              <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Step 2
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Client Submits</h3>
              <p className="text-muted-foreground">
                Your clients fill out a simple form with their details pre-filled. Text or video testimonials supported
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center" data-testid="step-3">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="text-primary-foreground h-10 w-10" />
              </div>
              <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Step 3
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Publish & Share</h3>
              <p className="text-muted-foreground">
                Approve testimonials and embed them on your website with our ready-to-use widget code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="benefits-title">
              Why Choose Testimo?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="benefits-subtitle">
              Everything you need to collect and showcase testimonials that convert
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1: Save Time */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="benefit-save-time">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Save Time</h3>
                <p className="text-muted-foreground">
                  Automated reminders and smart links eliminate manual follow-ups
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2: Build Trust */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="benefit-build-trust">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="text-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Build Trust</h3>
                <p className="text-muted-foreground">
                  Authentic testimonials from real clients build credibility
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3: Easy to Share */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="benefit-easy-share">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="text-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Easy to Share</h3>
                <p className="text-muted-foreground">
                  Embed testimonials anywhere with simple widget code
                </p>
              </CardContent>
            </Card>

            {/* Benefit 4: Boost Conversions */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="benefit-boost-conversions">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="text-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Boost Conversions</h3>
                <p className="text-muted-foreground">
                  Social proof increases trust and drives more sales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="social-proof-title">
              What Users Say
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="social-proof-subtitle">
              Trusted by freelancers and small agencies worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="user-testimonial-1">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "As a freelance designer, getting testimonials used to be such a hassle. Testimo makes it automatic and my clients actually respond!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold">Jessica Davis</div>
                    <div className="text-sm text-muted-foreground">Freelance Designer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="user-testimonial-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "The embeddable widget is a game-changer. I added testimonials to my portfolio in minutes and already seeing more inquiries!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">RT</span>
                  </div>
                  <div>
                    <div className="font-semibold">Ryan Thompson</div>
                    <div className="text-sm text-muted-foreground">Web Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="user-testimonial-3">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "Managing testimonials for multiple clients was a nightmare. Testimo keeps everything organized and professional."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">AM</span>
                  </div>
                  <div>
                    <div className="font-semibold">Amanda Martinez</div>
                    <div className="text-sm text-muted-foreground">Agency Owner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full" data-testid="trust-badge">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Trusted by 500+ businesses worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="pricing-title">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="pricing-subtitle">
              Free Forever Plan available. Upgrade anytime for more features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="pricing-card-free">
              <CardContent className="p-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">1 project</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Up to 3 testimonials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Basic testimonial forms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Email support</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  variant="outline" 
                  size="lg"
                  className="w-full"
                  data-testid="button-pricing-free"
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-2xl relative hover:-translate-y-1 transition-all duration-300" data-testid="pricing-card-pro">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </div>
              <CardContent className="p-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold text-foreground">$19</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Up to 5 projects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Unlimited testimonials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Custom branding & colors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Video testimonials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Analytics & insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Priority support</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleGetStarted}
                  size="lg"
                  className="w-full"
                  data-testid="button-pricing-pro"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="final-cta-title">
            Ready to Collect Testimonials Effortlessly?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto" data-testid="final-cta-subtitle">
            Join hundreds of freelancers and agencies who trust Testimo to showcase their best work through authentic client testimonials.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-10 py-6 font-semibold hover:scale-105 transition-all duration-200 shadow-xl"
            data-testid="button-final-cta"
          >
            Start Collecting Testimonials Today →
          </Button>
          <p className="text-sm text-muted-foreground mt-6" data-testid="final-cta-note">
            Free forever plan. No credit card required.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
