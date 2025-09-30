import { useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Send, CheckCircle, Video, Upload, X, Search, ChevronDown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

export default function SubmitTestimonial() {
  const { id } = useParams();
  
  // Parse URL search parameters to get client email for prepopulation
  const searchParams = new URLSearchParams(window.location.search);
  const clientEmail = searchParams.get('email');
  
  console.log('Submit Testimonial Debug:', {
    url: window.location.href,
    search: window.location.search,
    clientEmail,
    projectId: id
  });
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [testimonialType, setTestimonialType] = useState<"text" | "video">("text");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // "Find my info" functionality
  const [showFindMyInfo, setShowFindMyInfo] = useState(!clientEmail); // Show if not prepopulated
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
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
    queryKey: ["/api/projects", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}/public`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      return response.json();
    }
  });

  // Fetch client data for prepopulation if email is provided
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ["/api/projects", id, "client-by-email", clientEmail],
    queryFn: async () => {
      if (!clientEmail || !id) return null;
      try {
        const response = await fetch(`/api/projects/${id}/client-by-email?email=${encodeURIComponent(clientEmail)}`);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    enabled: !!clientEmail && !!id,
  });

  // Prepopulate form data when client data is loaded
  useEffect(() => {
    console.log('useEffect triggered - clientData:', clientData);
    if (clientData) {
      console.log('Prepopulating form with:', {
        name: clientData.name,
        email: clientData.email,
        company: clientData.company
      });
      setFormData(prev => ({
        ...prev,
        clientName: clientData.name || "",
        clientEmail: clientData.email || "",
        clientCompany: clientData.company || "",
      }));
    }
  }, [clientData]);

  const handleFindMyInfo = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address to search for your information.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/projects/${id}/client-by-email?email=${encodeURIComponent(searchEmail.trim())}`);
      if (response.ok) {
        const clientData = await response.json();
        // Populate form with found client data
        setFormData(prev => ({
          ...prev,
          clientName: clientData.name || "",
          clientEmail: clientData.email || "",
          clientCompany: clientData.company || "",
        }));
        setShowFindMyInfo(false); // Hide the search after successful find
        toast({
          title: "Found your information!",
          description: `Welcome back, ${clientData.name}! Your details have been filled in.`,
        });
      } else {
        toast({
          title: "Not found",
          description: "We couldn't find your information. Please fill in the form manually or check your email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const submitTestimonialMutation = useMutation({
    mutationFn: async (data: any) => {
      let testimonialData = { ...data };
      
      // Handle video upload if video testimonial
      if (testimonialType === "video" && selectedVideo) {
        try {
          setIsUploadingVideo(true);
          setVideoUploadProgress(10);
          
          // Get upload URL (public endpoint)
          const uploadRes = await apiRequest("POST", "/api/video/upload-url/public", {
            fileExtension: selectedVideo.name.split('.').pop()?.toLowerCase() || 'mp4',
            projectId: id
          });
          const uploadResponse = await uploadRes.json();
          
          setVideoUploadProgress(30);
          
          // Upload video to object storage
          const uploadResult = await fetch(uploadResponse.uploadUrl, {
            method: 'PUT',
            body: selectedVideo,
            headers: {
              'Content-Type': selectedVideo.type,
            },
          });
          
          if (!uploadResult.ok) {
            throw new Error('Video upload failed');
          }
          
          setVideoUploadProgress(70);
          
          // Submit testimonial first
          const testimonialRes = await apiRequest("POST", `/api/projects/${id}/testimonials`, {
            ...testimonialData,
            type: "video"
          });
          const testimonial = await testimonialRes.json();
          
          setVideoUploadProgress(90);
          
          // Update testimonial with video metadata (public endpoint)
          await apiRequest("POST", `/api/testimonials/${testimonial.id}/video/public`, {
            objectPath: uploadResponse.objectPath,
            videoDuration: null,
            uploadToken: uploadResponse.uploadToken
          });
          
          setVideoUploadProgress(100);
          return testimonial;
        } catch (error) {
          setIsUploadingVideo(false);
          setVideoUploadProgress(0);
          throw error;
        }
      }
      
      return await apiRequest("POST", `/api/projects/${id}/testimonials`, testimonialData);
    },
    onSuccess: () => {
      setSubmitted(true);
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      toast({
        title: "Testimonial submitted!",
        description: testimonialType === "video" 
          ? "Thank you for your video testimonial. It will be reviewed and published soon."
          : "Thank you for your feedback. It will be reviewed and published soon.",
      });
    },
    onError: (error) => {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file (MP4, WebM, MOV, or AVI).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 100MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedVideo(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (testimonialType === "text" && !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide your testimonial content.",
        variant: "destructive",
      });
      return;
    }

    if (testimonialType === "video" && !selectedVideo) {
      toast({
        title: "Error",
        description: "Please select a video file for your testimonial.",
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
      content: testimonialType === "text" ? formData.content.trim() : "Video testimonial",
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
              <Tabs value={testimonialType} onValueChange={(value) => setTestimonialType(value as "text" | "video")} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" data-testid="tab-text-testimonial">
                    Written Testimonial
                  </TabsTrigger>
                  <TabsTrigger value="video" data-testid="tab-video-testimonial">
                    <Video className="w-4 h-4 mr-2" />
                    Video Testimonial
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-6">
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
                      required={testimonialType === "text"}
                      placeholder="Share your experience working with us. What did you like most? How did we help you achieve your goals?"
                      data-testid="textarea-testimonial-content"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Tell us about your experience, results achieved, and what you valued most about working together.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-6">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Video Testimonial *
                    </Label>
                    
                    {!selectedVideo ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium">Upload your video testimonial</p>
                          <p className="text-sm text-muted-foreground">
                            Share your experience in a personal video message
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: MP4, WebM, MOV, AVI (max 100MB)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-select-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Select Video File
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                          data-testid="input-video-file"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Video className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{selectedVideo.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeVideo}
                              data-testid="button-remove-video"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {videoPreviewUrl && (
                            <video
                              src={videoPreviewUrl}
                              controls
                              className="w-full max-h-64 rounded border"
                              data-testid="video-preview"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-change-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Change Video
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* "Find my info" functionality for non-prepopulated forms */}
              {showFindMyInfo && (
                <Collapsible open={showFindMyInfo} onOpenChange={setShowFindMyInfo}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mb-4"
                      type="button"
                      data-testid="button-find-my-info"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Find my info
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mb-6">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-3">
                              If you're already in our system, we can automatically fill in your details. 
                              Just enter your email address below:
                            </p>
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                placeholder="Enter your email address"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFindMyInfo()}
                                data-testid="input-search-email"
                              />
                              <Button
                                type="button"
                                onClick={handleFindMyInfo}
                                disabled={isSearching || !searchEmail.trim()}
                                data-testid="button-search-client"
                              >
                                {isSearching ? (
                                  "Searching..."
                                ) : (
                                  <>
                                    <Search className="w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Don't see your email? No problem! Just collapse this section and fill in the form manually.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
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

              {isUploadingVideo && testimonialType === "video" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading video...</span>
                    <span>{videoUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitTestimonialMutation.isPending || isUploadingVideo}
                className="w-full"
                size="lg"
                data-testid="button-submit-testimonial"
              >
                {isUploadingVideo ? (
                  "Uploading video..."
                ) : submitTestimonialMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit {testimonialType === "video" ? "Video " : ""}Testimonial
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