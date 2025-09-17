import { useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

export default function SubmitTestimonial() {
  const { id } = useParams();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientTitle: "",
    clientCompany: "",
    content: "",
    rating: 0,
  });

  if (!id) {
    return <div>Project not found</div>;
  }

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
  });

  const submitTestimonialMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/projects/${id}/testimonials`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Testimonial submitted!",
        description: "Thank you for your feedback. It will be reviewed and published soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit testimonial. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setFormData(prev => ({
      ...prev,
      rating: newRating
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating.",
        variant: "destructive",
      });
      return;
    }

    submitTestimonialMutation.mutate({
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
      clientTitle: formData.clientTitle.trim() || null,
      clientCompany: formData.clientCompany.trim() || null,
      content: formData.content.trim(),
      rating,
      isPublished: false,
      projectId: id,
    });
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <p className="text-muted-foreground">The testimonial form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Thank you!</h1>
              <p className="text-muted-foreground">
                Your testimonial has been submitted successfully. It will be reviewed and published soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="testimonial-form-title">
            Share Your Experience
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us about your experience working with <span className="font-semibold">{project.name}</span>
          </p>
        </div>

        <Card data-testid="testimonial-form-card">
          <CardHeader>
            <CardTitle>Submit Testimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName" className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </Label>
                  <Input
                    type="text"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    placeholder="John Smith"
                    data-testid="input-client-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientEmail" className="block text-sm font-medium text-foreground mb-2">
                    Your Email *
                  </Label>
                  <Input
                    type="email"
                    id="clientEmail"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                    data-testid="input-client-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientTitle" className="block text-sm font-medium text-foreground mb-2">
                    Your Title (Optional)
                  </Label>
                  <Input
                    type="text"
                    id="clientTitle"
                    name="clientTitle"
                    value={formData.clientTitle}
                    onChange={handleInputChange}
                    placeholder="CEO, Manager, etc."
                    data-testid="input-client-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientCompany" className="block text-sm font-medium text-foreground mb-2">
                    Your Company (Optional)
                  </Label>
                  <Input
                    type="text"
                    id="clientCompany"
                    name="clientCompany"
                    value={formData.clientCompany}
                    onChange={handleInputChange}
                    placeholder="Acme Corp"
                    data-testid="input-client-company"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-3">
                  Rating *
                </Label>
                <div className="flex items-center space-x-1" data-testid="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleRatingChange(star)}
                      data-testid={`rating-star-${star}`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-none text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating > 0 && `${rating}/5`}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
                  Your Testimonial *
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="Share your experience working with us. What did you like most? How did we help you achieve your goals?"
                  data-testid="textarea-testimonial-content"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Tell us about your experience, results achieved, and what you valued most about working together.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitTestimonialMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-submit-testimonial"
              >
                {submitTestimonialMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Testimonial
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}