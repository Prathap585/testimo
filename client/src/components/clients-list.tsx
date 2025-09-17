import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Users, Mail, Building, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import ClientFormModal from "./client-form-modal";

interface ClientsListProps {
  projectId: string;
}

export default function ClientsList({ projectId }: ClientsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
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

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const sendTestimonialRequestMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("POST", `/api/clients/${clientId}/send-testimonial-request`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Testimonial request sent!",
        description: "The testimonial request has been sent to your client's email.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send testimonial request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendTestimonialRequest = (client: Client) => {
    sendTestimonialRequestMutation.mutate(client.id);
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
              <Button 
                onClick={() => setShowCreateModal(true)}
                data-testid="button-add-first-client"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          </CardContent>
        </Card>
        <ClientFormModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal}
          projectId={projectId}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Clients</h3>
        <Button 
          onClick={() => setShowCreateModal(true)}
          data-testid="button-add-client"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="clients-grid">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow duration-200" data-testid={`client-card-${client.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium truncate">{client.name}</CardTitle>
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
                  <DropdownMenuItem 
                    onClick={() => handleSendTestimonialRequest(client)}
                    disabled={client.isContacted || sendTestimonialRequestMutation.isPending}
                    data-testid={`send-request-${client.id}`}
                  >
                    {client.isContacted ? "Request Sent" : "Send Request"}
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

              <div className="pt-2">
                <Button
                  variant={client.isContacted ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleSendTestimonialRequest(client)}
                  disabled={client.isContacted || sendTestimonialRequestMutation.isPending}
                  data-testid={`send-testimonial-request-${client.id}`}
                >
                  {sendTestimonialRequestMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : client.isContacted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Request Sent
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Request Testimonial
                    </>
                  )}
                </Button>
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
    </>
  );
}