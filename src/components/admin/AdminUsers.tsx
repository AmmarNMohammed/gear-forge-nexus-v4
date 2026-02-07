import { useState, useEffect } from "react";
import { Loader2, Users, Shield, ShieldCheck, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  roles: string[];
  is_admin: boolean;
  is_manager: boolean;
}

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"add" | "remove" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: { action: "list" },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddManager = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "add-role",
          userId: selectedUser.id,
          role: "manager",
        },
      });

      if (error) throw error;

      toast({
        title: "Role Added",
        description: `${selectedUser.email} is now a manager`,
      });

      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add role",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleRemoveManager = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "remove-role",
          userId: selectedUser.id,
          role: "manager",
        },
      });

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `${selectedUser.email} is no longer a manager`,
      });

      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary">
                {users.filter(u => u.is_admin).length}
              </p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
            <div className="bg-secondary/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-secondary">
                {users.filter(u => u.is_manager).length}
              </p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.email}</span>
                    {user.is_admin && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.is_manager && (
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Manager
                      </Badge>
                    )}
                  </div>
                  {user.display_name && (
                    <p className="text-sm text-muted-foreground">{user.display_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!user.is_admin && (
                    <>
                      {user.is_manager ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("remove");
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove Manager
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-secondary/50 text-secondary hover:bg-secondary/10"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("add");
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Make Manager
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Manager Dialog */}
      <AlertDialog open={actionType === "add"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make User a Manager?</AlertDialogTitle>
            <AlertDialogDescription>
              This will give <strong>{selectedUser?.email}</strong> manager access to the admin panel.
              Managers can manage orders, products, inventory, and coupons but cannot access email settings or user management.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddManager}
              disabled={isProcessing}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Manager Dialog */}
      <AlertDialog open={actionType === "remove"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Manager Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove manager access from <strong>{selectedUser?.email}</strong>.
              They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveManager}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
