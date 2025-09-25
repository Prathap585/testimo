import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if JWT token exists in localStorage
  const token = localStorage.getItem("authToken");
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!token, // Only fetch if token exists
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch("/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        // If token is invalid, remove it
        if (response.status === 401) {
          localStorage.removeItem("authToken");
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
    logout,
  };
}
