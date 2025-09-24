import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Plus,
  Play,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReminderFormModal from "@/components/reminder-form-modal";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { ReminderWithClient } from "@shared/schema";

interface RemindersListProps {
  projectId: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-yellow-600"
  },
  sent: {
    label: "Sent",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600"
  },
  failed: {
    label: "Failed", 
    icon: AlertCircle,
    variant: "destructive" as const,
    color: "text-red-600"
  },
  canceled: {
    label: "Canceled",
    icon: XCircle,
    variant: "outline" as const,
    color: "text-gray-600"
  }
};

export default function RemindersDashboard({ projectId }: RemindersListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch reminders for this project
  const { data: reminders, isLoading } = useQuery<ReminderWithClient[]>({
    queryKey: ["/api/projects", projectId, "reminders"],
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      return await apiRequest("POST", `/api/reminders/${reminderId}/send`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reminder sent!",
        description: "The reminder has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "reminders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder.",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      return await apiRequest("DELETE", `/api/reminders/${reminderId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reminder deleted",
        description: "The reminder has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "reminders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder.",
        variant: "destructive",
      });
    },
  });

  // Update reminder status mutation
  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/reminders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "reminders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder.",
        variant: "destructive",
      });
    },
  });

  // Filter reminders
  const filteredReminders = reminders?.filter(reminder => {
    const matchesStatus = statusFilter === "all" || reminder.status === statusFilter;
    const matchesChannel = channelFilter === "all" || reminder.channel === channelFilter;
    const matchesSearch = !searchTerm || 
      reminder.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.client?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesChannel && matchesSearch;
  }) || [];

  // Group reminders by status
  const remindersByStatus = {
    pending: filteredReminders.filter(r => r.status === "pending"),
    sent: filteredReminders.filter(r => r.status === "sent"),
    failed: filteredReminders.filter(r => r.status === "failed"),
    canceled: filteredReminders.filter(r => r.status === "canceled"),
  };

  const handleSendReminder = (reminderId: string) => {
    sendReminderMutation.mutate(reminderId);
  };

  const handleDeleteReminder = (reminderId: string) => {
    deleteReminderMutation.mutate(reminderId);
  };

  const handleCancelReminder = (reminderId: string) => {
    updateReminderMutation.mutate({ id: reminderId, status: "canceled" });
  };

  const formatScheduledTime = (scheduledAt: string | Date) => {
    const date = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt;
    const isPast = date < new Date();
    const relative = formatDistanceToNow(date, { addSuffix: true });
    
    return {
      absolute: date.toLocaleString(),
      relative,
      isPast
    };
  };

  const ReminderCard = ({ reminder }: { reminder: ReminderWithClient }) => {
    const statusConfig = STATUS_CONFIG[reminder.status as keyof typeof STATUS_CONFIG];
    const StatusIcon = statusConfig.icon;
    const ChannelIcon = reminder.channel === "email" ? Mail : MessageSquare;
    const timeInfo = formatScheduledTime(reminder.scheduledAt);

    return (
      <Card className="mb-4" data-testid={`reminder-card-${reminder.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{reminder.client?.name || "Unknown Client"}</span>
                </div>
                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Contact:</strong> {reminder.channel === "email" 
                    ? reminder.client?.email 
                    : reminder.client?.phone || "No phone"
                  }
                </p>
                <p className={timeInfo.isPast && reminder.status === "pending" ? "text-destructive" : ""}>
                  <strong>Scheduled:</strong> {timeInfo.absolute} ({timeInfo.relative})
                </p>
                {(reminder.attemptNumber || 0) > 0 && (
                  <p>
                    <strong>Attempts:</strong> {reminder.attemptNumber}
                  </p>
                )}
                {reminder.templateKey && (
                  <p>
                    <strong>Template:</strong> {reminder.templateKey}
                  </p>
                )}
                {(reminder.metadata as any)?.recurring && (
                  <p>
                    <strong>Recurring:</strong> {
                      (reminder.metadata as any)?.recurringInterval === "daily" ? "Daily" :
                      (reminder.metadata as any)?.recurringInterval === "alternate_days" ? "Every 2 days" :
                      (reminder.metadata as any)?.recurringInterval === "weekly" ? "Weekly" : "Yes"
                    } until testimonial received
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {reminder.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReminder(reminder.id)}
                    disabled={sendReminderMutation.isPending}
                    data-testid={`button-send-${reminder.id}`}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Send Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelReminder(reminder.id)}
                    disabled={updateReminderMutation.isPending}
                    data-testid={`button-cancel-${reminder.id}`}
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteReminder(reminder.id)}
                disabled={deleteReminderMutation.isPending}
                data-testid={`button-delete-${reminder.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading reminders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="reminders-dashboard">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminders</h2>
          <p className="text-muted-foreground">
            Manage testimonial request reminders for your clients
          </p>
        </div>
        <Button onClick={() => setShowReminderModal(true)} data-testid="button-add-reminder">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Reminder
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-reminders"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Channel</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger data-testid="select-channel-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(remindersByStatus).map(([status, statusReminders]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const StatusIcon = config.icon;
          
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{statusReminders.length}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reminders found</h3>
            <p className="text-muted-foreground mb-4">
              {reminders?.length === 0 
                ? "Get started by scheduling your first reminder."
                : "Try adjusting your filters to see more results."
              }
            </p>
            <Button onClick={() => setShowReminderModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending-reminders">
              Pending ({remindersByStatus.pending.length})
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent-reminders">
              Sent ({remindersByStatus.sent.length})
            </TabsTrigger>
            <TabsTrigger value="failed" data-testid="tab-failed-reminders">
              Failed ({remindersByStatus.failed.length})
            </TabsTrigger>
            <TabsTrigger value="canceled" data-testid="tab-canceled-reminders">
              Canceled ({remindersByStatus.canceled.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(remindersByStatus).map(([status, statusReminders]) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {statusReminders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No {status} reminders found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                statusReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Schedule Reminder Modal */}
      <ReminderFormModal
        open={showReminderModal}
        onOpenChange={setShowReminderModal}
        projectId={projectId}
      />
    </div>
  );
}