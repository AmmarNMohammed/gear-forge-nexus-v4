import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Shield, Truck, Mail, MessageSquare, Send, MapPin, Phone, Target, Award, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { SetupCard } from "@/components/SetupCard";
import { useProducts } from "@/hooks/useProducts";
import { useSetups } from "@/hooks/useSetups";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-gaming-setup.jpg";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const ContactSection = () => {
  const { t, direction } = useLanguage();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneNumber = "+8618718717134";
  const whatsappNumber = "8618718717134";
  const email = "info@game.fpfei.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success(t("contact.success"));
      setFormData({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4",
              direction === "rtl" && "flex-row-reverse"
            )}
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">{t("contact.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gradient">{t("contact.titleFull")}</span>
          </h2>
          <p className="text-muted-foreground">{t("contact.subtitle")}</p>
        </div>

        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto",
          direction === "rtl" && "lg:grid-flow-dense"
        )}>
          {/* Contact Information */}
          <div className={cn(
            "bg-card/50 border border-border rounded-xl p-8 flex flex-col",
            direction === "rtl" && "text-right"
          )}>
            <h3 className="text-xl font-semibold text-gradient mb-4">{t("contact.aboutNexus")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("contact.aboutDesc")}
            </p>
            
            <h3 className="text-xl font-semibold text-gradient mb-4">{t("contact.info")}</h3>
            
            <div className="space-y-4 flex-1">
              <div className={cn(
                "flex items-center gap-4",
                direction === "rtl" && "flex-row-reverse"
              )}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("contact.location")}</p>
                  <p className="text-muted-foreground text-sm">Foshan, China</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-4",
                direction === "rtl" && "flex-row-reverse"
              )}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("contact.mobile")}</p>
                  <p className="text-muted-foreground text-sm">{phoneNumber}</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-4",
                direction === "rtl" && "flex-row-reverse"
              )}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("contact.email")}</p>
                  <p className="text-muted-foreground text-sm">{email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button asChild className="btn-gradient flex-1">
                <a href={`tel:${phoneNumber}`} className={cn("flex items-center justify-center", direction === "rtl" && "flex-row-reverse")}>
                  <Phone className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {t("contact.callUs")}
                </a>
              </Button>
              <Button asChild variant="outline" className="btn-neon flex-1">
                <a 
                  href={`https://wa.me/${whatsappNumber}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn("flex items-center justify-center", direction === "rtl" && "flex-row-reverse")}
                >
                  <MessageSquare className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {t("contact.whatsapp")}
                </a>
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className={cn(
            "bg-card/50 border border-border rounded-xl p-8 flex flex-col",
            direction === "rtl" && "text-right"
          )}>
            <h3 className="text-xl font-semibold mb-6">{t("contact.sendMessage")}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t("contact.name")}
                </label>
                <Input
                  id="name"
                  placeholder={t("contact.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={cn("bg-background border-border", direction === "rtl" && "text-right")}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("contact.email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("contact.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={cn("bg-background border-border", direction === "rtl" && "text-right")}
                />
              </div>
              <div className="space-y-2 flex-1 flex flex-col">
                <label htmlFor="message" className="text-sm font-medium">
                  {t("contact.message")}
                </label>
                <Textarea
                  id="message"
                  placeholder={t("contact.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className={cn("bg-background border-border resize-none flex-1 min-h-[120px]", direction === "rtl" && "text-right")}
                />
              </div>
              <Button 
                type="submit" 
                className={cn("btn-gradient w-full h-12 text-lg mt-auto", direction === "rtl" && "flex-row-reverse")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  t("contact.sending")
                ) : (
                  <>
                    {t("contact.send")}
                    <Send className={cn("w-5 h-5", direction === "rtl" ? "mr-2 rotate-180" : "ml-2")} />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const { products, isLoading: productsLoading, getFeaturedProducts } = useProducts();
  const { setups, isLoading: setupsLoading, getCuratedSetups, getFeaturedSetups } = useSetups();
  const { t, direction } = useLanguage();
  const featuredProducts = getFeaturedProducts();
  const curatedSetups = getCuratedSetups();
  const exploreSetups = getFeaturedSetups();

  const features = [
    {
      icon: Zap,
      title: t("features.highPerformance"),
      description: t("features.highPerformanceDesc")
    },
    {
      icon: Shield,
      title: t("features.warranty"),
      description: t("features.warrantyDesc")
    },
    {
      icon: Sparkles,
      title: t("features.rgbSync"),
      description: t("features.rgbSyncDesc")
    },
    {
      icon: Truck,
      title: t("features.freeShipping"),
      description: t("features.freeShippingDesc")
    }
  ];

  return (
    <div className="min-h-screen">
      <FloatingWhatsApp />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Ultimate Gaming Setup"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50",
            direction === "rtl" && "bg-gradient-to-l"
          )} />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
          <div className={cn("max-w-2xl", direction === "rtl" && "ml-auto mr-0")}>
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6 animate-fade-in-up",
              direction === "rtl" && "flex-row-reverse"
            )}>
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">{t("hero.badge")}</span>
            </div>
            
            <h1 className={cn(
              "text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up",
              direction === "rtl" && "text-right"
            )} style={{ animationDelay: "0.1s" }}>
              <span className="text-gradient">{t("hero.title1")}</span>
              <br />
              {t("hero.title2")}
              <br />
              {t("hero.title3")}
            </h1>
            
            <p className={cn(
              "text-lg md:text-xl text-muted-foreground mb-8 max-w-lg animate-fade-in-up",
              direction === "rtl" && "text-right"
            )} style={{ animationDelay: "0.2s" }}>
              {t("hero.description")}
            </p>

            <div className={cn(
              "flex flex-wrap gap-4 animate-fade-in-up",
              direction === "rtl" && "flex-row-reverse"
            )} style={{ animationDelay: "0.3s" }}>
              <Button asChild className="btn-gradient h-12 px-8 text-lg">
                <Link to="/shop" className={cn("flex items-center", direction === "rtl" && "flex-row-reverse")}>
                  {t("hero.shopNow")}
                  <ArrowRight className={cn("w-5 h-5", direction === "rtl" ? "mr-2 rotate-180" : "ml-2")} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="btn-neon h-12 px-8 text-lg">
                <Link to="/setups">{t("hero.viewSetups")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-card border-y border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className={cn(
                "flex items-center gap-3 md:gap-4",
                direction === "rtl" && "flex-row-reverse text-right"
              )}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Setups */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient">{t("sections.curatedSetupsTitle")}</span>
              </h2>
              <p className="text-muted-foreground">{t("sections.setupsSubtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-primary hover:bg-primary/10">
              <Link to="/setups" className="flex items-center gap-2">
                {t("sections.viewAll")}
                <ArrowRight className={cn("w-4 h-4", direction === "rtl" && "rotate-180")} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {setupsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : curatedSetups.length > 0 ? (
              curatedSetups.slice(0, 2).map(setup => (
                <SetupCard key={setup.id} setup={setup} />
              ))
            ) : (
              <p
                className={cn(
                  "col-span-full text-center text-muted-foreground py-8",
                  direction === "rtl" && "text-right"
                )}
              >
                {t("sections.noCuratedSetups")}
              </p>
            )}
          </div>

          <Button asChild variant="ghost" className="md:hidden w-full mt-6 text-primary hover:bg-primary/10">
            <Link to="/setups" className={cn("flex items-center justify-center", direction === "rtl" && "flex-row-reverse")}>
              {t("sections.viewAllSetups")}
              <ArrowRight className={cn("w-4 h-4", direction === "rtl" ? "mr-2 rotate-180" : "ml-2")} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient">{t("sections.trendingProductsTitle")}</span>
              </h2>
              <p className="text-muted-foreground">{t("sections.productsSubtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-primary hover:bg-primary/10">
              <Link to="/shop" className="flex items-center gap-2">
                {t("sections.shopAll")}
                <ArrowRight className={cn("w-4 h-4", direction === "rtl" && "rotate-180")} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p
                className={cn(
                  "col-span-full text-center text-muted-foreground py-8",
                  direction === "rtl" && "text-right"
                )}
              >
                {t("sections.noTrendingProducts")}
              </p>
            )}
          </div>

          <Button asChild variant="ghost" className="md:hidden w-full mt-6 text-primary hover:bg-primary/10">
            <Link to="/shop" className={cn("flex items-center justify-center", direction === "rtl" && "flex-row-reverse")}>
              {t("sections.viewAllProducts")}
              <ArrowRight className={cn("w-4 h-4", direction === "rtl" ? "mr-2 rotate-180" : "ml-2")} />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={cn("max-w-3xl mx-auto text-center", direction === "rtl" && "text-right")}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t("cta.buildDream")}
              <br />
              <span className="text-gradient-rgb">{t("cta.gamingSetup")}</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("cta.description")}
            </p>
            <Button asChild className="btn-gradient h-14 px-10 text-lg">
              <Link to="/build" className={cn("flex items-center", direction === "rtl" && "flex-row-reverse")}>
                {t("cta.startBuilding")}
                <Sparkles className={cn("w-5 h-5", direction === "rtl" ? "mr-2" : "ml-2")} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4",
                direction === "rtl" && "flex-row-reverse"
              )}
            >
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">{t("about.badge")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-gradient">{t("about.title")}</span> NexusGear
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("about.subtitle")}
            </p>
          </div>

          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center",
            direction === "rtl" && "lg:grid-flow-dense"
          )}>
            <div className={cn("space-y-6", direction === "rtl" && "text-right lg:col-start-2")}>
              <p className="text-lg text-muted-foreground">
                {t("about.description1")}
              </p>
              <p className="text-muted-foreground">
                {t("about.description2")}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-background/50 border border-border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">{t("about.products")}</p>
                </div>
                <div className="bg-background/50 border border-border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">{t("about.countries")}</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-4",
              direction === "rtl" && "lg:col-start-1 lg:row-start-1"
            )}>
              <div className={cn("bg-card border border-border rounded-xl p-6 space-y-3", direction === "rtl" && "text-right")}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("about.mission")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("about.missionDesc")}
                </p>
              </div>
              <div className={cn("bg-card border border-border rounded-xl p-6 space-y-3", direction === "rtl" && "text-right")}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("about.quality")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("about.qualityDesc")}
                </p>
              </div>
              <div className={cn("bg-card border border-border rounded-xl p-6 space-y-3", direction === "rtl" && "text-right")}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("about.global")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("about.globalDesc")}
                </p>
              </div>
              <div className={cn("bg-card border border-border rounded-xl p-6 space-y-3", direction === "rtl" && "text-right")}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("about.support")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("about.supportDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Setups */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {t("sections.exploreMore")} <span className="text-gradient">{t("sections.exploreSetups")}</span>
            </h2>
            <p className="text-muted-foreground">{t("sections.findInspiration")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {setupsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : exploreSetups.length > 0 ? (
              exploreSetups.slice(0, 2).map(setup => (
                <SetupCard key={setup.id} setup={setup} />
              ))
            ) : (
              <p
                className={cn(
                  "col-span-full text-center text-muted-foreground py-8",
                  direction === "rtl" && "text-right"
                )}
              >
                {t("sections.noExploreSetups")}
              </p>
            )}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline" className="btn-neon">
              <Link to="/setups" className="flex items-center gap-2">
                {t("sections.viewAllSetups")}
                <ArrowRight className={cn("w-4 h-4", direction === "rtl" && "rotate-180")} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <ContactSection />
    </div>
  );
};

export default Index;
