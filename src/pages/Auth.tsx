import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Gamepad2, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const displayNameSchema = z.string().min(2, "Display name must be at least 2 characters").optional();

type AuthMode = "signin" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== "forgot") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === "signup" && displayName) {
      const displayNameResult = displayNameSchema.safeParse(displayName);
      if (!displayNameResult.success) {
        newErrors.displayName = displayNameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Try custom SMTP first via edge function
      const { error: funcError } = await supabase.functions.invoke("send-auth-email", {
        body: {
          email,
          emailType: "password_reset",
          redirectUrl: `${window.location.origin}/reset-password`,
        },
      });

      if (funcError) {
        // Fall back to default Supabase auth
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot") {
      return handleForgotPassword();
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Sign in failed",
              description: "Invalid email or password. Please try again."
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast({
              variant: "destructive",
              title: "Email not verified",
              description: "Please check your email and verify your account before signing in."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign in failed",
              description: error.message
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in."
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Try signing in instead."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account before signing in."
          });
          setMode("signin");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Forgot password success state
  if (mode === "forgot" && resetEmailSent) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

        <div className="relative z-10 w-full max-w-md px-4">
          <div className={cn(
            "bg-card border border-border rounded-2xl p-8 shadow-2xl text-center",
            direction === "rtl" && "text-right"
          )}>
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("auth.checkEmail")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("auth.resetLinkSent")} <strong>{email}</strong>. 
              {t("auth.checkInbox")}
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setMode("signin");
                setResetEmailSent(false);
              }}
              className={cn("flex items-center", direction === "rtl" && "flex-row-reverse")}
            >
              <ArrowLeft className={cn("w-4 h-4", direction === "rtl" ? "ml-2 rotate-180" : "mr-2")} />
              {t("auth.backToSignIn")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className={cn(
          "bg-card border border-border rounded-2xl p-8 shadow-2xl",
          direction === "rtl" && "text-right"
        )}>
          {/* Logo */}
          <Link to="/" className={cn(
            "flex items-center justify-center gap-2 mb-8",
            direction === "rtl" && "flex-row-reverse"
          )}>
            <Gamepad2 className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold text-gradient">NexusGear</span>
          </Link>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {mode === "signin" ? t("auth.welcomeBack") : mode === "signup" ? t("auth.createAccount") : t("auth.resetPassword")}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin" 
                ? t("auth.signInToAccess")
                : mode === "signup"
                ? t("auth.joinNexus")
                : t("auth.enterEmailReset")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("auth.displayName")}</Label>
                <div className="relative">
                  <User className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                    direction === "rtl" ? "right-3" : "left-3"
                  )} />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t("auth.yourName")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={cn(
                      direction === "rtl" ? "pr-10 text-right" : "pl-10",
                      errors.displayName && "border-destructive"
                    )}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                  direction === "rtl" ? "right-3" : "left-3"
                )} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    direction === "rtl" ? "pr-10 text-right" : "pl-10",
                    errors.email && "border-destructive"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className={cn(
                  "flex items-center justify-between",
                  direction === "rtl" && "flex-row-reverse"
                )}>
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrors({});
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                    direction === "rtl" ? "right-3" : "left-3"
                  )} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      direction === "rtl" ? "pr-10 text-right" : "pl-10",
                      errors.password && "border-destructive"
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className={cn("w-full btn-gradient h-12", direction === "rtl" && "flex-row-reverse")}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? t("auth.signIn") : mode === "signup" ? t("auth.createAccount") : t("auth.sendResetLink")}
                  <ArrowRight className={cn("w-4 h-4", direction === "rtl" ? "mr-2 rotate-180" : "ml-2")} />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrors({});
                }}
                className={cn("text-sm text-primary hover:underline flex items-center justify-center mx-auto", direction === "rtl" && "flex-row-reverse")}
              >
                <ArrowLeft className={cn("w-3 h-3", direction === "rtl" ? "ml-1 rotate-180" : "mr-1")} />
                {t("auth.backToSignIn")}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setErrors({});
                  }}
                  className={cn("text-primary hover:underline font-medium", direction === "rtl" ? "mr-1" : "ml-1")}
                >
                  {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
