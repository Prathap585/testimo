import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertClient, Client } from "@shared/schema";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  client?: Client; // For editing
}

export default function ClientFormModal({ open, onOpenChange, projectId, client }: ClientFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        company: client.company || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
      });
    }
  }, [client]);

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      return await apiRequest("POST", `/api/projects/${projectId}/clients`, data);
    },
    onSuccess: () => {
      toast({
        title: "Client created!",
        description: "The client has been added to your project successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      let errorMessage = "Failed to create client. Please try again.";
      
      // Extract the specific error message from API response
      try {
        const errorText = error.message;
        const jsonStart = errorText.indexOf('{');
        if (jsonStart !== -1) {
          const jsonPart = errorText.substring(jsonStart);
          const errorData = JSON.parse(jsonPart);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      } catch (e) {
        // If parsing fails, use default message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: Partial<InsertClient>) => {
      return await apiRequest("PATCH", `/api/clients/${client!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Client updated!",
        description: "The client information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      let errorMessage = "Failed to update client. Please try again.";
      
      // Extract the specific error message from API response
      try {
        const errorText = error.message;
        const jsonStart = errorText.indexOf('{');
        if (jsonStart !== -1) {
          const jsonPart = errorText.substring(jsonStart);
          const errorData = JSON.parse(jsonPart);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      } catch (e) {
        // If parsing fails, use default message
      }
      
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", company: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Client name and email are required.",
        variant: "destructive",
      });
      return;
    }

    const clientData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      projectId,
    };

    if (isEditing) {
      updateClientMutation.mutate(clientData);
    } else {
      createClientMutation.mutate(clientData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isPending = createClientMutation.isPending || updateClientMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="client-form-modal">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the client information below." 
              : "Add a new client to this project. They will be able to submit testimonials for you."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Client Name *
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g., John Smith, Sarah Johnson"
              data-testid="input-client-name"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address *
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="e.g., john@example.com"
              data-testid="input-client-email"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
              Phone Number (Optional)
            </Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g., +1234567890"
              data-testid="input-client-phone"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include country code for SMS requests (e.g., +1 for US numbers)
            </p>
          </div>

          <div>
            <Label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
              Company (Optional)
            </Label>
            <Input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g., Acme Corp, Small Business Inc"
              data-testid="input-client-company"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-client"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid={isEditing ? "button-update-client" : "button-create-client"}
            >
              {isPending ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Client" : "Add Client")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}