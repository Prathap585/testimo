import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, RotateCcw, Info, Mail, MessageSquare } from "lucide-react";
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

const DEFAULT_SMS_SETTINGS = {
  message: "Hi {{clientName}}! Could you please share a testimonial for {{projectName}}? It would mean a lot to me. Submit here: {{testimonialUrl}}"
};

export default function EmailSettingsForm({ project }: EmailSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentEmailSettings = (project.emailSettings as any) || DEFAULT_EMAIL_SETTINGS;
  const currentSmsSettings = (project.smsSettings as any) || DEFAULT_SMS_SETTINGS;
  
  const [emailSettings, setEmailSettings] = useState({
    fromName: (currentEmailSettings as any)?.fromName || "",
    subject: (currentEmailSettings as any)?.subject || DEFAULT_EMAIL_SETTINGS.subject,
    message: (currentEmailSettings as any)?.message || DEFAULT_EMAIL_SETTINGS.message,
  });
  
  const [smsSettings, setSmsSettings] = useState({
    message: (currentSmsSettings as any)?.message || DEFAULT_SMS_SETTINGS.message,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { emailSettings?: typeof emailSettings, smsSettings?: typeof smsSettings }) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}`, settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated!",
        description: "Your testimonial request templates have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      emailSettings,
      smsSettings
    });
  };

  const handleReset = () => {
    setEmailSettings({
      fromName: "",
      subject: DEFAULT_EMAIL_SETTINGS.subject,
      message: DEFAULT_EMAIL_SETTINGS.message,
    });
    setSmsSettings({
      message: DEFAULT_SMS_SETTINGS.message,
    });
  };

  const hasChanges = () => {
    const emailChanged = (
      emailSettings.fromName !== ((currentEmailSettings as any)?.fromName || "") ||
      emailSettings.subject !== ((currentEmailSettings as any)?.subject || DEFAULT_EMAIL_SETTINGS.subject) ||
      emailSettings.message !== ((currentEmailSettings as any)?.message || DEFAULT_EMAIL_SETTINGS.message)
    );
    const smsChanged = (
      smsSettings.message !== ((currentSmsSettings as any)?.message || DEFAULT_SMS_SETTINGS.message)
    );
    return emailChanged || smsChanged;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Messaging Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Customize the email and SMS templates that will be sent to clients when requesting testimonials. 
            You can use <code>{"{{clientName}}"}</code>, <code>{"{{projectName}}"}</code>, and <code>{"{{testimonialUrl}}"}</code> 
            as placeholders that will be automatically replaced.
          </AlertDescription>
        </Alert>

        {/* Email Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4" />
            <h3 className="text-lg font-medium">Email Settings</h3>
          </div>

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
              data-testid="textarea-email-message"
            />
          </div>
        </div>

        <Separator />

        {/* SMS Settings Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4" />
            <h3 className="text-lg font-medium">SMS Settings</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smsMessage">SMS Message</Label>
            <Textarea
              id="smsMessage"
              placeholder="Hi {{clientName}}! Could you please share a testimonial for {{projectName}}? Submit here: {{testimonialUrl}}"
              value={smsSettings.message}
              onChange={(e) => setSmsSettings({...smsSettings, message: e.target.value})}
              rows={4}
              data-testid="textarea-sms-message"
            />
            <p className="text-sm text-muted-foreground">
              Keep SMS messages short and clear. Character limit recommendations vary by carrier.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || updateSettingsMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-reset-settings"
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