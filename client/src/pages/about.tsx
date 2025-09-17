import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Eye, Rocket, Shield, Users } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function About() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-20 bg-gradient-to-br from-muted/50 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="about-title">
              About Testimo
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="about-subtitle">
              We believe every business deserves powerful social proof without the hassle.
            </p>
          </div>

          {/* Story Section */}
          <Card className="shadow-lg border border-border mb-16" data-testid="story-section">
            <CardContent className="p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="prose prose-lg text-muted-foreground max-w-none space-y-6">
                <p>
                  Testimo was born from a simple frustration: as freelancers and agency owners, we were constantly chasing clients for testimonials. We'd complete amazing projects, but getting social proof felt like pulling teeth.
                </p>
                <p>
                  We'd send follow-up emails, make awkward phone calls, and still ended up with only a fraction of the testimonials we deserved. Meanwhile, potential clients were making decisions based on social proof we couldn't easily collect or display.
                </p>
                <p>
                  That's when we realized: what if we could automate the entire process? What if collecting testimonials could be as easy as sending an invoice?
                </p>
                <p>
                  Today, Testimo helps thousands of businesses collect testimonials effortlessly, turning happy clients into powerful advocates without the chase.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="shadow-lg border border-border" data-testid="mission-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To help every business effortlessly collect and showcase testimonials, building trust and driving growth through authentic social proof.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-border" data-testid="vision-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  A world where every great business has the social proof they deserve, and potential customers can easily find trusted service providers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values Section */}
          <Card className="shadow-lg border border-border mb-16" data-testid="values-section">
            <CardContent className="p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-8 text-center">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center" data-testid="value-simplicity">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="text-primary text-xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Simplicity</h4>
                  <p className="text-sm text-muted-foreground">
                    Complex problems deserve simple solutions. We make testimonial collection effortless.
                  </p>
                </div>
                
                <div className="text-center" data-testid="value-trust">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-primary text-xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Trust</h4>
                  <p className="text-sm text-muted-foreground">
                    We handle your client relationships with care and maintain the highest privacy standards.
                  </p>
                </div>
                
                <div className="text-center" data-testid="value-empowerment">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-primary text-xl" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Empowerment</h4>
                  <p className="text-sm text-muted-foreground">
                    Every business deserves powerful social proof to showcase their amazing work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="shadow-lg border border-border" data-testid="contact-form-section">
            <CardContent className="p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6 text-center">Get in Touch</h2>
              <p className="text-muted-foreground text-center mb-8">
                Have questions or feedback? We'd love to hear from you.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your name"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your@email.com"
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="What's this about?"
                    data-testid="input-contact-subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell us more..."
                    data-testid="textarea-contact-message"
                  />
                </div>
                
                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={contactMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
