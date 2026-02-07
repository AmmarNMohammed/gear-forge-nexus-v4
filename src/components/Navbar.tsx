import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Gamepad2, Search, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const location = useLocation();
  const { getCartCount, toggleCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { t, direction } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.shop"), path: "/shop" },
    { name: t("nav.setups"), path: "/setups" },
    { name: t("nav.build"), path: "/build" },
    { name: t("nav.aboutUs"), path: "/#about" },
    { name: t("nav.contactUs"), path: "/#contact" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const cartCount = getCartCount();

  return (
    <nav
      dir={direction}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - stays on start (right in RTL, left in LTR) */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary transition-all duration-300 group-hover:text-glow" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold text-gradient">NexusGear</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              link.path.includes("#") ? (
                <a
                  key={link.path}
                  href={link.path}
                  className="relative py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative py-2 text-sm font-medium transition-colors",
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-neon" />
                  )}
                </Link>
              )
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse-glow">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Auth Button */}
            {!authLoading && (
              user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="hidden md:flex"
                >
                  <Link to="/account">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden md:flex"
                >
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t("nav.signIn")}
                  </Link>
                </Button>
              )
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className={cn(
              "py-4 space-y-2",
              direction === "rtl" && "text-right"
            )}>
              {navLinks.map(link => (
                link.path.includes("#") ? (
                  <a
                    key={link.path}
                    href={link.path}
                    className="block px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "block px-4 py-3 rounded-lg transition-colors",
                      location.pathname === link.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              
              {/* Mobile Auth Link */}
              {!authLoading && (
                user ? (
                  <Link
                    to="/account"
                    className="block px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {t("nav.myAccount")}
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="block px-4 py-3 rounded-lg transition-colors bg-primary/10 text-primary"
                  >
                    {t("nav.signInSignUp")}
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
