import { Link } from "react-router-dom";
import { Gamepad2, Mail, Twitter, Youtube, Instagram, Twitch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegalModal } from "@/components/LegalModals";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitch, href: "#", label: "Twitch" }
];

export function Footer() {
  const { t, direction } = useLanguage();

  const footerLinks = {
    navigate: [
      { name: t("nav.home"), path: "/" },
      { name: t("nav.shop"), path: "/shop" },
      { name: t("nav.setups"), path: "/setups" },
      { name: t("nav.build"), path: "/build" }
    ],
    shop: [
      { name: t("category.gamingPCs"), path: "/shop?category=pcs" },
      { name: t("category.monitors"), path: "/shop?category=monitors" },
      { name: t("category.peripherals"), path: "/shop?category=peripherals" },
      { name: t("category.furniture"), path: "/shop?category=furniture" },
      { name: t("category.audio"), path: "/shop?category=audio" }
    ],
    support: [
      { name: t("nav.aboutUs"), path: "/#about" },
      { name: t("nav.contactUs"), path: "/#contact" }
    ]
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12",
          direction === "rtl" && "text-right"
        )}>
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className={cn(
              "flex items-center gap-2 mb-4",
              direction === "rtl" && "flex-row-reverse justify-end"
            )}>
              <Gamepad2 className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-gradient">NexusGear</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t("footer.description")}
            </p>
            
            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("footer.newsletter")}</p>
              <div className={cn(
                "flex gap-2",
                direction === "rtl" && "flex-row-reverse"
              )}>
                <Input 
                  placeholder={t("footer.enterEmail")} 
                  className={cn("bg-muted border-border", direction === "rtl" && "text-right")}
                />
                <Button className="btn-gradient px-6">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigate Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.navigate")}</h3>
            <ul className="space-y-2">
              {footerLinks.navigate.map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.shop")}</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map(link => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.support")}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map(link => (
                <li key={link.name}>
                  <a 
                    href={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={cn(
          "mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4",
          direction === "rtl" && "md:flex-row-reverse"
        )}>
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright")}
          </p>
          
          {/* Social Links */}
          <div className={cn(
            "flex items-center gap-4",
            direction === "rtl" && "flex-row-reverse"
          )}>
            {socialLinks.map(social => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className={cn(
            "flex items-center gap-4 text-sm text-muted-foreground",
            direction === "rtl" && "flex-row-reverse"
          )}>
            <LegalModal
              type="privacy"
              trigger={
                <button className="hover:text-primary transition-colors">
                  {t("footer.privacyPolicy")}
                </button>
              }
            />
            <LegalModal
              type="terms"
              trigger={
                <button className="hover:text-primary transition-colors">
                  {t("footer.termsOfService")}
                </button>
              }
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
