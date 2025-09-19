import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Send, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

interface ReminderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  preselectedClientId?: string;
}

interface ReminderFormData {
  clientId: string;
  channel: "email" | "sms";
  scheduledAt: string;
  templateKey?: string;
}

export default function ReminderFormModal({ 
  open, 
  onOpenChange, 
  projectId, 
  preselectedClientId 
}: ReminderFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ReminderFormData>({
    clientId: preselectedClientId || "",
    channel: "email",
    scheduledAt: "",
    templateKey: ""
  });

  // Load clients for the project
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/projects", projectId, "clients"],
    enabled: open
  });

  // Reset form when modal opens/closes or preselected client changes
  useEffect(() => {
    if (open) {
      const now = new Date();
      const defaultTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      defaultTime.setHours(9, 0, 0, 0); // 9 AM
      
      setFormData({
        clientId: preselectedClientId || "",
        channel: "email",
        scheduledAt: defaultTime.toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
        templateKey: ""
      });
    }
  }, [open, preselectedClientId]);

  const createReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      return await apiRequest("POST", `/api/projects/${projectId}/reminders`, {
        clientId: data.clientId,
        channel: data.channel,
        scheduledAt: data.scheduledAt,
        templateKey: data.templateKey || undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Reminder scheduled!",
        description: "The reminder has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "reminders"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast({
        title: "Error",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.scheduledAt) {
      toast({
        title: "Error", 
        description: "Please select a scheduled time.",
        variant: "destructive",
      });
      return;
    }

    const scheduledTime = new Date(formData.scheduledAt);
    if (scheduledTime <= new Date()) {
      toast({
        title: "Error",
        description: "Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    createReminderMutation.mutate(formData);
  };

  const selectedClient = clients?.find(c => c.id === formData.clientId);
  const canSendSMS = selectedClient?.phone && formData.channel === "sms";
  
  const handleInputChange = (field: keyof ReminderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="reminder-form-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Reminder
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            {clientsLoading ? (
              <div className="text-sm text-muted-foreground">Loading clients...</div>
            ) : (
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleInputChange("clientId", value)}
                disabled={!!preselectedClientId}
              >
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex flex-col">
                        <span>{client.name}</span>
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label htmlFor="channel">Channel *</Label>
            <Select
              value={formData.channel}
              onValueChange={(value: "email" | "sms") => handleInputChange("channel", value)}
            >
              <SelectTrigger data-testid="select-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem 
                  value="sms" 
                  disabled={selectedClient && !selectedClient.phone}
                >
                  SMS {selectedClient && !selectedClient.phone && "(No phone number)"}
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.channel === "sms" && selectedClient && !selectedClient.phone && (
              <p className="text-sm text-destructive">
                This client doesn't have a phone number. Please add one or use email instead.
              </p>
            )}
          </div>

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => handleInputChange("scheduledAt", e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              data-testid="input-scheduled-at"
            />
            <p className="text-xs text-muted-foreground">
              When should this reminder be sent?
            </p>
          </div>

          {/* Template Key (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="templateKey">Custom Template Key (Optional)</Label>
            <Input
              id="templateKey"
              type="text"
              value={formData.templateKey}
              onChange={(e) => handleInputChange("templateKey", e.target.value)}
              placeholder="e.g., follow-up-1, urgent"
              data-testid="input-template-key"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default project template
            </p>
          </div>

          {/* Client Info Summary */}
          {selectedClient && (
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium text-sm mb-2">Reminder Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Client:</strong> {selectedClient.name}</p>
                <p><strong>Contact:</strong> {formData.channel === "email" ? selectedClient.email : selectedClient.phone || "No phone"}</p>
                <p><strong>Channel:</strong> {formData.channel.toUpperCase()}</p>
                {formData.scheduledAt && (
                  <p><strong>Scheduled:</strong> {new Date(formData.scheduledAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReminderMutation.isPending}
            data-testid="button-cancel-reminder"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={createReminderMutation.isPending || (!canSendSMS && formData.channel === "sms")}
            data-testid="button-schedule-reminder"
          >
            <Send className="h-4 w-4 mr-2" />
            {createReminderMutation.isPending ? "Scheduling..." : "Schedule Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}