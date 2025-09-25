import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Eye, Copy, Settings } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface WallData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  testimonials: Array<{
    id: string;
    clientName: string;
    clientTitle?: string;
    clientCompany?: string;
    content: string;
    rating: number;
    videoUrl?: string;
    createdAt: string;
    projectName: string;
    projectId: string;
  }>;
  settings: {
    theme: string;
    layout: string;
    limit: number;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ 
  testimonial, 
  compact = false,
  showProject = false 
}: { 
  testimonial: WallData['testimonials'][0];
  compact?: boolean;
  showProject?: boolean;
}) {
  return (
    <Card className={`h-full ${compact ? "text-sm" : ""}`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <StarRating rating={testimonial.rating} />
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(testimonial.createdAt).toLocaleDateString()}
              </Badge>
              {showProject && (
                <Badge variant="outline" className="text-xs">
                  {testimonial.projectName}
                </Badge>
              )}
            </div>
          </div>
          
          <blockquote className={`text-foreground leading-relaxed ${compact ? "text-sm" : ""}`}>
            "{testimonial.content}"
          </blockquote>
          
          <div className="border-t pt-4">
            <div className="font-medium text-foreground">{testimonial.clientName}</div>
            {testimonial.clientTitle && (
              <div className="text-sm text-muted-foreground">{testimonial.clientTitle}</div>
            )}
            {testimonial.clientCompany && (
              <div className="text-sm text-muted-foreground">{testimonial.clientCompany}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestimonialWall() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>('grid');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [limit, setLimit] = useState(20);

  const { data, isLoading, error } = useQuery<WallData>({
    queryKey: ["/api/testimonials/wall", layout, theme, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        layout,
        theme,
        limit: limit.toString()
      });
      const response = await apiRequest("GET", `/api/testimonials/wall?${params}`);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const handleCopyEmbedCode = () => {
    if (!user?.id) return;
    
    const embedUrl = `${window.location.origin}/wall/${user.id}/embed?theme=${theme}&layout=${layout}&limit=${limit}`;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed code copied!",
      description: "You can now paste this code into any website to display your testimonial wall.",
    });
  };

  const handlePreviewEmbedWall = () => {
    if (!user?.id) return;
    
    const embedUrl = `${window.location.origin}/wall/${user.id}/embed?theme=${theme}&layout=${layout}&limit=${limit}`;
    window.open(embedUrl, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-red-600">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to view your testimonial wall</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-red-600">Error Loading Testimonials</h1>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasTestimonials = data && data.testimonials.length > 0;
  const testimonials = data?.testimonials || [];
  const userData = data?.user;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="testimonial-wall-title">
            Your Testimonial Wall
          </h1>
          <p className="text-muted-foreground mb-4">
            Showcase testimonials from all your projects in one beautiful wall
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary">
              {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Layout:</span>
              <select 
                value={layout} 
                onChange={(e) => setLayout(e.target.value as any)}
                className="px-2 py-1 rounded border"
                data-testid="layout-selector"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Theme:</span>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as any)}
                className="px-2 py-1 rounded border"
                data-testid="theme-selector"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show:</span>
              <select 
                value={limit} 
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1 rounded border"
                data-testid="limit-selector"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>All</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePreviewEmbedWall} 
              variant="outline" 
              size="sm"
              data-testid="preview-embed-button"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Embed
            </Button>
            <Button 
              onClick={handleCopyEmbedCode} 
              variant="outline" 
              size="sm"
              data-testid="copy-embed-button"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          </div>
        </div>

        {/* Testimonials Display */}
        {hasTestimonials ? (
          layout === 'list' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              {testimonials.map((testimonial) => (
                <TestimonialCard 
                  key={testimonial.id} 
                  testimonial={testimonial} 
                  showProject={true}
                />
              ))}
            </div>
          ) : layout === 'compact' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((testimonial) => (
                <TestimonialCard 
                  key={testimonial.id} 
                  testimonial={testimonial} 
                  compact={true}
                  showProject={true}
                />
              ))}
            </div>
          ) : (
            // Default grid layout
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard 
                  key={testimonial.id} 
                  testimonial={testimonial}
                  showProject={true}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No testimonials yet</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Once you collect and approve testimonials from your projects, they'll appear here in a beautiful showcase. You can still customize the embed settings above and copy the embed code to prepare for when testimonials start coming in.
            </p>
            <Button onClick={() => window.location.href = '/'} data-testid="button-go-to-dashboard">
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}