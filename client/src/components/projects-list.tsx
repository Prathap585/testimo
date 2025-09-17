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
import { MoreHorizontal, Plus, Folder, Users, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import ProjectFormModal from "./project-form-modal";

export default function ProjectsList() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-3/4"></div>
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
            <p>Failed to load projects. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <>
        <Card data-testid="empty-projects-state">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start collecting testimonials from your clients.
              </p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                data-testid="button-create-first-project-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
        <ProjectFormModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal} 
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
        <Button 
          onClick={() => setShowCreateModal(true)}
          data-testid="button-create-new-project"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`project-card-${project.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg font-semibold truncate">{project.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`project-menu-${project.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid={`edit-project-${project.id}`}>
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid={`view-project-${project.id}`}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    data-testid={`delete-project-${project.id}`}
                  >
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>0 clients</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span>0 testimonials</span>
                  </div>
                </div>
                
                <Badge 
                  variant={project.isActive ? "default" : "secondary"}
                  data-testid={`project-status-${project.id}`}
                >
                  {project.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <ProjectFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </>
  );
}