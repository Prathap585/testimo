import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmbedData {
  project: {
    id: string;
    name: string;
    description?: string;
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

function TestimonialCard({ testimonial, compact = false }: { 
  testimonial: EmbedData['testimonials'][0];
  compact?: boolean;
}) {
  return (
    <Card className={`h-full ${compact ? "text-sm" : ""}`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <StarRating rating={testimonial.rating} />
            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(testimonial.createdAt).toLocaleDateString()}
            </Badge>
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

export default function Embed() {
  const { projectId } = useParams();
  
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Invalid Project</h1>
          <p className="text-muted-foreground">Project ID is required</p>
        </div>
      </div>
    );
  }

  // Get query parameters from URL to pass to API
  const queryString = window.location.search;
  const embedUrl = `/api/projects/${projectId}/testimonials/embed${queryString}`;

  const { data, isLoading, error } = useQuery<EmbedData>({
    queryKey: ["/api/projects", projectId, "testimonials", "embed", queryString],
    queryFn: async () => {
      const response = await fetch(embedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch embed data');
      }
      return response.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <div className="h-6 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-2/3 mx-auto"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/6"></div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Project Not Found</h1>
          <p className="text-muted-foreground">This project is not available or has no published testimonials</p>
        </div>
      </div>
    );
  }

  const { project, testimonials, settings } = data;

  if (testimonials.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">No testimonials available yet</p>
        </div>
      </div>
    );
  }

  // Apply theme classes
  const themeClass = settings.theme === 'dark' ? 'dark' : '';
  
  return (
    <div className={`${themeClass} min-h-screen bg-background`}>
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-4">
            <Badge variant="secondary">
              {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Testimonials Grid */}
        {settings.layout === 'list' ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : settings.layout === 'compact' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} compact />
            ))}
          </div>
        ) : (
          // Default grid layout
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            Powered by Testimo
          </p>
        </div>
      </div>
    </div>
  );
}