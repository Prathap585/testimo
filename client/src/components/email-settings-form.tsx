import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, RotateCcw, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Project } from "@shared/schema";

interface EmailSettingsFormProps {
  project: Project;
}

const DEFAULT_EMAIL_SETTINGS = {
  fromName: "",
  subject: "Please share your testimonial for {{projectName}}",
  message: "Hi {{clientName}},\n\nI hope this message finds you well!\n\nI would greatly appreciate if you could take a few minutes to share your experience working with me on {{projectName}}. Your testimonial would mean a lot and help showcase the value of my work to future clients.\n\nYou can submit your testimonial using this link: {{testimonialUrl}}\n\nThank you so much for your time and support!\n\nBest regards"
};

export default function EmailSettingsForm({ project }: EmailSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentSettings = (project.emailSettings as any) || DEFAULT_EMAIL_SETTINGS;
  
  const [emailSettings, setEmailSettings] = useState({
    fromName: (currentSettings as any)?.fromName || "",
    subject: (currentSettings as any)?.subject || DEFAULT_EMAIL_SETTINGS.subject,
    message: (currentSettings as any)?.message || DEFAULT_EMAIL_SETTINGS.message,
  });

  const updateEmailSettingsMutation = useMutation({
    mutationFn: async (settings: typeof emailSettings) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}/email-settings`, {
        emailSettings: settings,
      });
    },
    onSuccess: () => {
      toast({
        title: "Email settings updated!",
        description: "Your testimonial request email template has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateEmailSettingsMutation.mutate(emailSettings);
  };

  const handleReset = () => {
    setEmailSettings({
      fromName: "",
      subject: DEFAULT_EMAIL_SETTINGS.subject,
      message: DEFAULT_EMAIL_SETTINGS.message,
    });
  };

  const hasChanges = () => {
    return (
      emailSettings.fromName !== ((currentSettings as any)?.fromName || "") ||
      emailSettings.subject !== ((currentSettings as any)?.subject || DEFAULT_EMAIL_SETTINGS.subject) ||
      emailSettings.message !== ((currentSettings as any)?.message || DEFAULT_EMAIL_SETTINGS.message)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Email Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Customize the email template that will be sent to clients when requesting testimonials. 
            You can use <code>{"{{clientName}}"}</code>, <code>{"{{projectName}}"}</code>, and <code>{"{{testimonialUrl}}"}</code> 
            as placeholders that will be automatically replaced.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromName">From Name (Optional)</Label>
            <Input
              id="fromName"
              placeholder="Your name or company name"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
              data-testid="input-from-name"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to use your default email name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder="Please share your testimonial for {{projectName}}"
              value={emailSettings.subject}
              onChange={(e) => setEmailSettings({...emailSettings, subject: e.target.value})}
              data-testid="input-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Email Message</Label>
            <Textarea
              id="message"
              placeholder="Write your testimonial request message..."
              value={emailSettings.message}
              onChange={(e) => setEmailSettings({...emailSettings, message: e.target.value})}
              rows={8}
              data-testid="textarea-message"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || updateEmailSettingsMutation.isPending}
            data-testid="button-save-email-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateEmailSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updateEmailSettingsMutation.isPending}
            data-testid="button-reset-email-settings"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        {hasChanges() && (
          <Alert>
            <AlertDescription>
              You have unsaved changes. Click "Save Changes" to apply your email template updates.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}