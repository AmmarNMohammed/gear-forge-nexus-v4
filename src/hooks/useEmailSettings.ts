import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  email_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useEmailSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("email_settings")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setSettings(data);
    }
    setIsLoading(false);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const saveSettings = async (newSettings: Omit<EmailSettings, "id" | "created_at" | "updated_at">) => {
    setIsLoading(true);
    
    if (settings?.id) {
      // Update existing
      const { error } = await supabase
        .from("email_settings")
        .update(newSettings)
        .eq("id", settings.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update email settings",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Email settings updated",
        });
        await fetchSettings();
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("email_settings")
        .insert(newSettings);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save email settings",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Email settings saved",
        });
        await fetchSettings();
      }
    }
    
    setIsLoading(false);
  };

  const sendEmail = async (to: string | string[], subject: string, body: string, emailType: string = "custom") => {
    setIsSending(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("admin-send-email", {
        body: { to, subject, body, emailType },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Email Sent",
        description: `Successfully sent ${result.sent} email(s)`,
      });

      await fetchLogs();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const testConnection = async () => {
    if (!settings) {
      toast({
        title: "Error",
        description: "Please save SMTP settings first",
        variant: "destructive",
      });
      return false;
    }

    try {
      await sendEmail(
        settings.from_email,
        "SMTP Test - NexusGear Admin",
        `<h1>SMTP Configuration Test</h1><p>If you received this email, your SMTP settings are working correctly!</p><p>Sent at: ${new Date().toISOString()}</p>`,
        "test"
      );
      return true;
    } catch {
      return false;
    }
  };

  return {
    settings,
    logs,
    isLoading,
    isSending,
    saveSettings,
    sendEmail,
    testConnection,
    refetchLogs: fetchLogs,
  };
}
