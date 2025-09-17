import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Building
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Testimonial } from "@shared/schema";

interface TestimonialsListProps {
  projectId: string;
}

export default function TestimonialsList({ projectId }: TestimonialsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading, error } = useQuery<Testimonial[]>({
    queryKey: ["/api/projects", projectId, "testimonials"],
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Testimonial> }) => {
      return await apiRequest("PATCH", `/api/testimonials/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Testimonial updated",
        description: "The testimonial status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update testimonial. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: string) => {
      return await apiRequest("DELETE", `/api/testimonials/${testimonialId}`, null);
    },
    onSuccess: () => {
      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete testimonial. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (testimonialId: string) => {
    updateTestimonialMutation.mutate({
      id: testimonialId,
      updates: { isPublished: true }
    });
  };

  const handleReject = (testimonialId: string) => {
    updateTestimonialMutation.mutate({
      id: testimonialId,
      updates: { isPublished: false }
    });
  };

  const handleDelete = (testimonialId: string) => {
    if (window.confirm("Are you sure you want to delete this testimonial? This action cannot be undone.")) {
      deleteTestimonialMutation.mutate(testimonialId);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Failed to load testimonials. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return (
      <Card data-testid="empty-testimonials-state">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No testimonials yet</h3>
            <p className="text-muted-foreground mb-6">
              Share your testimonial collection form with clients to start receiving feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingTestimonials = testimonials.filter(t => !t.isPublished);
  const publishedTestimonials = testimonials.filter(t => t.isPublished);

  return (
    <div className="space-y-6">
      {/* Pending Testimonials Section */}
      {pendingTestimonials.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            Pending Review ({pendingTestimonials.length})
          </h4>
          <div className="space-y-4" data-testid="pending-testimonials">
            {pendingTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-yellow-200 bg-yellow-50/50" data-testid={`testimonial-pending-${testimonial.id}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium" data-testid={`testimonial-client-name-${testimonial.id}`}>
                        {testimonial.clientName}
                      </span>
                      {testimonial.clientTitle && testimonial.clientCompany && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>{testimonial.clientTitle} at {testimonial.clientCompany}</span>
                        </div>
                      )}
                    </div>
                    {renderStars(testimonial.rating)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`testimonial-menu-${testimonial.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleApprove(testimonial.id)}
                        className="text-green-600"
                        data-testid={`approve-testimonial-${testimonial.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Publish
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(testimonial.id)}
                        className="text-destructive"
                        data-testid={`delete-testimonial-${testimonial.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed" data-testid={`testimonial-content-${testimonial.id}`}>
                    "{testimonial.content}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-yellow-200 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Submitted {testimonial.createdAt ? new Date(testimonial.createdAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(testimonial.id)}
                        disabled={updateTestimonialMutation.isPending}
                        data-testid={`approve-button-${testimonial.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Published Testimonials Section */}
      {publishedTestimonials.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Published ({publishedTestimonials.length})
          </h4>
          <div className="space-y-4" data-testid="published-testimonials">
            {publishedTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-green-200 bg-green-50/50" data-testid={`testimonial-published-${testimonial.id}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{testimonial.clientName}</span>
                      {testimonial.clientTitle && testimonial.clientCompany && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>{testimonial.clientTitle} at {testimonial.clientCompany}</span>
                        </div>
                      )}
                    </div>
                    {renderStars(testimonial.rating)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Published
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`testimonial-menu-${testimonial.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleReject(testimonial.id)}
                          data-testid={`unpublish-testimonial-${testimonial.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(testimonial.id)}
                          className="text-destructive"
                          data-testid={`delete-published-testimonial-${testimonial.id}`}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <span className="text-sm text-muted-foreground">
                      Published {testimonial.updatedAt ? new Date(testimonial.updatedAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}