import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Power, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Project } from "@shared/schema";

interface ProjectStatusFormProps {
  project: Project;
}

export default function ProjectStatusForm({ project }: ProjectStatusFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isActive, setIsActive] = useState(project.isActive ?? true);
  const [hasChanges, setHasChanges] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}`, { 
        isActive: newStatus 
      });
    },
    onSuccess: () => {
      toast({
        title: "Project status updated!",
        description: `Project is now ${isActive ? "active" : "inactive"}`,
      });
      setHasChanges(false);
      // Invalidate the project queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "with-counts"] });
    },
    onError: (error) => {
      console.error("Error updating project status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      });
      // Reset the switch to original state on error
      setIsActive(project.isActive ?? true);
      setHasChanges(false);
    },
  });

  const handleStatusChange = (newStatus: boolean) => {
    setIsActive(newStatus);
    setHasChanges(newStatus !== (project.isActive ?? true));
  };

  const handleSave = () => {
    updateStatusMutation.mutate(isActive);
  };

  const handleReset = () => {
    setIsActive(project.isActive ?? true);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="w-5 h-5" />
          Project Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Active projects can receive new testimonials and are visible to clients. 
            Inactive projects won't accept new submissions but existing testimonials remain accessible.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Current Status Display */}
          <div className="flex items-center justify-between">
            <Label htmlFor="project-status" className="text-base font-medium">
              Current Status
            </Label>
            <Badge 
              variant={(project.isActive ?? true) ? "default" : "secondary"}
              className="text-sm"
              data-testid="current-project-status"
            >
              {(project.isActive ?? true) ? "Active" : "Inactive"}
            </Badge>
          </div>

          <Separator />

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="status-toggle" className="text-base font-medium">
                Project Active
              </Label>
              <p className="text-sm text-muted-foreground">
                {isActive 
                  ? "Project is accepting new testimonials" 
                  : "Project is paused and not accepting new testimonials"
                }
              </p>
            </div>
            <Switch
              id="status-toggle"
              checked={isActive}
              onCheckedChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
              data-testid="switch-project-status"
            />
          </div>

          {/* Status Preview */}
          {hasChanges && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Status:</span>
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className="text-sm"
                  data-testid="preview-project-status"
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={updateStatusMutation.isPending}
              data-testid="button-save-status"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={updateStatusMutation.isPending}
              data-testid="button-reset-status"
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}