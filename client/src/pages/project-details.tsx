import { useParams, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Settings,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  Power
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, Client, Testimonial } from "@shared/schema";
import ClientsList from "@/components/clients-list";
import TestimonialsList from "@/components/testimonials-list";
import EmailSettingsForm from "@/components/email-settings-form";
import EmbedCodeGenerator from "@/components/embed-code-generator";
import ReminderSettingsForm from "@/components/reminder-settings-form";
import RemindersDashboard from "@/components/reminders-dashboard";
import ProjectStatusForm from "@/components/project-status-form";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function ProjectDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  if (!id) {
    return <div>Project not found</div>;
  }

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/projects", id, "clients"],
  });

  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/projects", id, "testimonials"],
  });

  // Project status update mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      return await apiRequest("PATCH", `/api/projects/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project status",
        variant: "destructive",
      });
    },
  });

  const copyFormUrl = () => {
    const url = `${window.location.origin}/submit/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Testimonial form URL copied to clipboard",
    });
  };

  const getTestimonialStats = () => {
    if (!testimonials) return { published: 0, pending: 0, total: 0 };
    
    const published = testimonials.filter(t => t.isPublished).length;
    const pending = testimonials.filter(t => !t.isPublished).length;
    const total = testimonials.length;
    
    return { published, pending, total };
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Project not found</h2>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const stats = getTestimonialStats();
  const clientCount = clients?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-6 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="project-title">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-xl text-muted-foreground" data-testid="project-description">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-3">
              {/* Status Badge and Quick Toggle */}
              <div className="flex items-center space-x-3">
                <Badge 
                  variant={project.isActive ? "default" : "secondary"}
                  className="text-sm px-3 py-1"
                  data-testid="project-status"
                >
                  {project.isActive ? "Active" : "Inactive"}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Power className="w-4 h-4 text-muted-foreground" />
                  <Switch
                    checked={project.isActive ?? true}
                    onCheckedChange={(checked) => updateProjectStatusMutation.mutate(checked)}
                    disabled={updateProjectStatusMutation.isPending}
                    data-testid="quick-status-toggle"
                  />
                </div>
              </div>
              {/* Link to Settings for full controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const settingsTab = document.querySelector('[data-testid="tab-settings"]') as HTMLElement;
                  settingsTab?.click();
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-testid="link-to-settings"
              >
                <Settings className="w-3 h-3 mr-1" />
                More controls in Settings
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-clients">{clientCount}</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Testimonials</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-testimonials">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-published-testimonials">{stats.published}</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-testimonials">{stats.pending}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={copyFormUrl} data-testid="button-copy-form-url">
                <Copy className="w-4 h-4 mr-2" />
                Copy Form URL
              </Button>
              <Link href={`/submit/${id}`}>
                <Button variant="outline" data-testid="button-preview-form">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Form
                </Button>
              </Link>
              <Button variant="outline" onClick={() => {
                // Find and click the settings tab
                const settingsTab = document.querySelector('[data-testid="tab-settings"]') as HTMLElement;
                settingsTab?.click();
              }} data-testid="button-email-settings">
                <Settings className="w-4 h-4 mr-2" />
                Email Settings
              </Button>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4" data-testid="project-tabs">
              <TabsTrigger value="clients" data-testid="tab-clients">
                Clients ({clientCount})
              </TabsTrigger>
              <TabsTrigger value="testimonials" data-testid="tab-testimonials">
                Testimonials ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="reminders" data-testid="tab-reminders">
                Reminders
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-6">
              <ClientsList projectId={id} />
            </TabsContent>

            <TabsContent value="testimonials" className="space-y-6">
              <TestimonialsList projectId={id} />
            </TabsContent>

            <TabsContent value="reminders" className="space-y-6">
              <RemindersDashboard projectId={id} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <ProjectStatusForm project={project} />
              <EmailSettingsForm project={project} />
              <ReminderSettingsForm project={project} />
              <EmbedCodeGenerator project={project} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}