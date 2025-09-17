import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import type { Testimonial } from "@shared/schema";

export default function Testimonials() {
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/public"],
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-1/3 mt-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="testimonials-title">
            What Our Clients Say
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="testimonials-subtitle">
            Real feedback from real clients who've experienced our service firsthand.
          </p>
        </div>

        {testimonials && testimonials.length > 0 ? (
          <>
            {/* Featured Testimonial */}
            {testimonials.length > 0 && (
              <div className="mb-16">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-xl">
                  <CardContent className="p-8 lg:p-12">
                    <div className="text-center">
                      <div className="flex justify-center mb-6">
                        {renderStars(testimonials[0].rating)}
                      </div>
                      <blockquote className="text-2xl lg:text-3xl font-medium text-foreground mb-8 leading-relaxed">
                        "{testimonials[0].content}"
                      </blockquote>
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-foreground" data-testid="featured-client-name">
                            {testimonials[0].clientName}
                          </div>
                          {testimonials[0].clientTitle && testimonials[0].clientCompany && (
                            <div className="text-sm text-muted-foreground" data-testid="featured-client-title">
                              {testimonials[0].clientTitle}, {testimonials[0].clientCompany}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* All Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(1).map((testimonial) => (
                <Card key={testimonial.id} className="hover:shadow-lg transition-shadow" data-testid={`testimonial-${testimonial.id}`}>
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {renderStars(testimonial.rating)}
                    </div>
                    <blockquote className="text-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm" data-testid={`client-name-${testimonial.id}`}>
                          {testimonial.clientName}
                        </div>
                        {testimonial.clientTitle && testimonial.clientCompany && (
                          <div className="text-xs text-muted-foreground" data-testid={`client-title-${testimonial.id}`}>
                            {testimonial.clientTitle}, {testimonial.clientCompany}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Card className="bg-muted/50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Ready to Share Your Experience?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Have you worked with us? We'd love to hear about your experience and share your success story.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Contact us to share your testimonial
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                No Testimonials Yet
              </h3>
              <p className="text-muted-foreground">
                We're working hard to collect testimonials from our amazing clients. Check back soon!
              </p>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}