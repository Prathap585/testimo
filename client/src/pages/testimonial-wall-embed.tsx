import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar, Video as VideoIcon } from "lucide-react";
import { useParams } from "wouter";

interface EmbedWallData {
  user: {
    id: string;
    name: string;
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

function TestimonialCard({ testimonial, compact = false }: { 
  testimonial: EmbedWallData['testimonials'][0];
  compact?: boolean;
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
              <Badge variant="outline" className="text-xs">
                {testimonial.projectName}
              </Badge>
            </div>
          </div>
          
          {testimonial.videoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <VideoIcon className="h-4 w-4" />
                <span>Video Testimonial</span>
              </div>
              <div className="rounded-lg overflow-hidden bg-black">
                <video 
                  controls 
                  className="w-full max-h-96"
                  preload="metadata"
                >
                  <source src={testimonial.videoUrl} type="video/mp4" />
                  <source src={testimonial.videoUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : (
            <blockquote className={`text-foreground leading-relaxed ${compact ? "text-sm" : ""}`}>
              "{testimonial.content}"
            </blockquote>
          )}
          
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

export default function TestimonialWallEmbed() {
  const { userId } = useParams();
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Invalid User</h1>
          <p className="text-muted-foreground">User ID is required</p>
        </div>
      </div>
    );
  }

  // Get query parameters from URL to pass to API
  const queryString = window.location.search;
  const embedUrl = `/api/testimonials/wall/${userId}/embed${queryString}`;

  const { data, isLoading, error } = useQuery<EmbedWallData>({
    queryKey: ["/api/testimonials/wall", userId, "embed", queryString],
    queryFn: async () => {
      const response = await fetch(embedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Error Loading Testimonials</h1>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!data || data.testimonials.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{data?.user.name || 'Our Business'}</h1>
          <p className="text-muted-foreground">No testimonials available yet</p>
        </div>
      </div>
    );
  }

  const { user, testimonials, settings } = data;

  // Apply theme classes
  const themeClass = settings.theme === 'dark' ? 'dark' : '';
  
  return (
    <div className={`${themeClass} min-h-screen bg-background`}>
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{user.name}</h1>
          <p className="text-muted-foreground mb-4">
            What our clients say about us
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary">
              {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Testimonials Display */}
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