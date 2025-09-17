import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, Mail, MessageSquare, ThumbsUp, Star, Send } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";

export default function HowItWorks() {
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/";
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="how-it-works-title">
              How Testimo Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="how-it-works-subtitle">
              Get testimonials in 4 simple steps. No technical skills required.
            </p>
          </div>

          {/* 4 Steps Process */}
          <div className="max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center mb-20" data-testid="step-1">
              <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    1
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Add client details</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Simply enter your client's name and email address. Set up your project details and customize the testimonial request message to match your brand voice.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Bulk import from CSV
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Custom message templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Project organization
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2">
                <Card className="shadow-xl border border-border">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                          <div className="w-48 h-3 bg-muted/70 rounded"></div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded"></div>
                      <div className="w-3/4 h-2 bg-muted rounded"></div>
                      <div className="w-full h-2 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center mb-20" data-testid="step-2">
              <div className="lg:w-1/2 lg:pl-12 mb-8 lg:mb-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    2
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">We send automated requests</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Testimo automatically sends personalized testimonial requests to your clients at the perfect time. Smart follow-ups ensure maximum response rates.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Perfect timing optimization
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Smart follow-up sequences
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Personalized messages
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2">
                <Card className="shadow-xl border border-border">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">Automated</span>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-muted rounded"></div>
                        <div className="w-4/5 h-3 bg-muted rounded"></div>
                        <div className="w-full h-3 bg-muted rounded"></div>
                      </div>
                      <div className="flex justify-end">
                        <div className="w-20 h-8 bg-primary/20 rounded flex items-center justify-center">
                          <Send className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center mb-20" data-testid="step-3">
              <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    3
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Client submits testimonial</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Your clients receive a beautiful, branded form that's mobile-friendly and easy to complete. They can submit text or video testimonials in just minutes.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Mobile-optimized forms
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Text & video support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Branded experience
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2">
                <Card className="shadow-xl border border-border">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Star className="h-8 w-8 text-primary" />
                        </div>
                        <div className="w-48 h-4 bg-muted rounded mx-auto"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="w-full h-20 bg-muted/50 rounded-lg"></div>
                        <div className="w-32 h-10 bg-primary/20 rounded mx-auto"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col lg:flex-row-reverse items-center mb-20" data-testid="step-4">
              <div className="lg:w-1/2 lg:pl-12 mb-8 lg:mb-0">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    4
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">You approve & publish</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Review and approve testimonials in your dashboard. Once approved, they automatically appear on your testimonial wall and can be embedded anywhere on your website.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Easy approval process
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Automatic publishing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-3" />
                    Embeddable widgets
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2">
                <Card className="shadow-xl border border-border">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <div className="w-full h-3 bg-muted rounded mb-2"></div>
                          <div className="w-3/4 h-3 bg-muted rounded"></div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <div className="w-full h-3 bg-muted rounded mb-2"></div>
                          <div className="w-2/3 h-3 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <div className="w-16 h-8 bg-primary/20 rounded flex items-center justify-center">
                          <ThumbsUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="w-16 h-8 bg-muted/50 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6" data-testid="cta-title">
              Ready to start collecting testimonials?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="cta-subtitle">
              Join thousands of businesses who trust Testimo to automate their testimonial collection process.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="text-lg font-semibold hover:scale-105 transition-all duration-200"
              data-testid="button-cta-start-trial"
            >
              Start Free Trial
            </Button>
            <p className="text-sm text-muted-foreground mt-4" data-testid="cta-note">
              No credit card required • Setup takes 5 minutes
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
