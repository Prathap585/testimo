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
import { MoreHorizontal, Plus, Users, Mail, MessageSquare, Phone, Building, CheckCircle, Clock, Upload, Bell, PlayCircle, Pause, CheckSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import ClientFormModal from "./client-form-modal";
import CsvImportModal from "./csv-import-modal";
import ReminderFormModal from "./reminder-form-modal";

interface ClientsListProps {
  projectId: string;
}

export default function ClientsList({ projectId }: ClientsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [reminderClientId, setReminderClientId] = useState<string | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/projects", projectId, "clients"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("DELETE", `/api/clients/${clientId}`, null);
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "The client has been removed from your project.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleScheduleReminder = (clientId: string) => {
    setReminderClientId(clientId);
    setShowReminderModal(true);
  };

  const handleUpdateWorkStatus = (clientId: string, workStatus: string) => {
    updateWorkStatusMutation.mutate({ clientId, workStatus });
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const getWorkStatusBadge = (workStatus: string) => {
    switch (workStatus) {
      case "pending":
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-xs"><PlayCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700"><CheckSquare className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const sendEmailRequestMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("POST", `/api/clients/${clientId}/send-testimonial-request`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Email request sent!",
        description: "The testimonial request has been sent to your client's email.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendSmsRequestMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("POST", `/api/clients/${clientId}/send-sms-request`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "SMS request sent!",
        description: "The testimonial request has been sent to your client's phone.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send SMS request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateWorkStatusMutation = useMutation({
    mutationFn: async ({ clientId, workStatus }: { clientId: string; workStatus: string }) => {
      return await apiRequest("PATCH", `/api/clients/${clientId}`, { workStatus });
    },
    onSuccess: (data, variables) => {
      const statusLabels = {
        pending: "Pending",
        in_progress: "In Progress", 
        completed: "Completed"
      };
      toast({
        title: "Work status updated",
        description: `Client work status updated to ${statusLabels[variables.workStatus as keyof typeof statusLabels]}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmailRequest = (client: Client) => {
    sendEmailRequestMutation.mutate(client.id);
  };

  const handleSendSmsRequest = (client: Client) => {
    sendSmsRequestMutation.mutate(client.id);
  };

  const closeEditModal = () => {
    setEditingClient(undefined);
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
            <p>Failed to load clients. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <>
        <Card data-testid="empty-clients-state">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No clients yet</h3>
              <p className="text-muted-foreground mb-6">
                Add clients to this project so they can submit testimonials for your work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  data-testid="button-add-first-client"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  data-testid="button-import-csv-first"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <ClientFormModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal}
          projectId={projectId}
        />
        <CsvImportModal 
          open={showImportModal} 
          onOpenChange={setShowImportModal}
          projectId={projectId}
        />
        <ReminderFormModal
          open={showReminderModal}
          onOpenChange={setShowReminderModal}
          projectId={projectId}
          preselectedClientId={reminderClientId}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Clients</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            data-testid="button-import-csv"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            data-testid="button-add-client"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="clients-grid">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow duration-200" data-testid={`client-card-${client.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-base font-medium truncate">{client.name}</CardTitle>
                {getWorkStatusBadge(client.workStatus || "pending")}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`client-menu-${client.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleEditClient(client)}
                    data-testid={`edit-client-${client.id}`}
                  >
                    Edit Client
                  </DropdownMenuItem>
                  {(client.workStatus !== "pending") && (
                    <DropdownMenuItem 
                      onClick={() => handleUpdateWorkStatus(client.id, "pending")}
                      data-testid={`set-pending-${client.id}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Mark as Pending
                    </DropdownMenuItem>
                  )}
                  {(client.workStatus !== "in_progress") && (
                    <DropdownMenuItem 
                      onClick={() => handleUpdateWorkStatus(client.id, "in_progress")}
                      data-testid={`set-in-progress-${client.id}`}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Mark as In Progress
                    </DropdownMenuItem>
                  )}
                  {(client.workStatus !== "completed") && (
                    <DropdownMenuItem 
                      onClick={() => handleUpdateWorkStatus(client.id, "completed")}
                      data-testid={`set-completed-${client.id}`}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleSendEmailRequest(client)}
                    disabled={client.isContacted || sendEmailRequestMutation.isPending}
                    data-testid={`send-email-request-${client.id}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {client.isContacted ? "Email Sent" : "Send Email"}
                  </DropdownMenuItem>
                  {client.phone && (
                    <DropdownMenuItem 
                      onClick={() => handleSendSmsRequest(client)}
                      disabled={client.isContacted || sendSmsRequestMutation.isPending}
                      data-testid={`send-sms-request-${client.id}`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {client.isContacted ? "SMS Sent" : "Send SMS"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleScheduleReminder(client.id)}
                    data-testid={`schedule-reminder-${client.id}`}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Schedule Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteClient(client.id)}
                    data-testid={`delete-client-${client.id}`}
                  >
                    Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate" data-testid={`client-email-${client.id}`}>{client.email}</span>
              </div>
              
              {client.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="truncate" data-testid={`client-phone-${client.id}`}>{client.phone}</span>
                </div>
              )}
              
              {client.company && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="truncate" data-testid={`client-company-${client.id}`}>{client.company}</span>
                </div>
              )}

              {client.isContacted && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span data-testid={`client-contacted-${client.id}`}>Request sent</span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  variant={client.isContacted ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleSendEmailRequest(client)}
                  disabled={client.isContacted || sendEmailRequestMutation.isPending}
                  data-testid={`send-email-request-${client.id}`}
                >
                  {sendEmailRequestMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending Email...
                    </>
                  ) : client.isContacted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Email Request
                    </>
                  )}
                </Button>
                
                {client.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleSendSmsRequest(client)}
                    disabled={client.isContacted || sendSmsRequestMutation.isPending}
                    data-testid={`send-sms-request-${client.id}`}
                  >
                    {sendSmsRequestMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending SMS...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        SMS Request
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <ClientFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        projectId={projectId}
      />
      
      {editingClient && (
        <ClientFormModal 
          open={true} 
          onOpenChange={closeEditModal}
          projectId={projectId}
          client={editingClient}
        />
      )}
      
      <CsvImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        projectId={projectId}
      />
      
      <ReminderFormModal
        open={showReminderModal}
        onOpenChange={setShowReminderModal}
        projectId={projectId}
        preselectedClientId={reminderClientId}
      />
    </>
  );
}