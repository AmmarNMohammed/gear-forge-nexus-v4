import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupCard } from "@/components/SetupCard";
import { useSetups } from "@/hooks/useSetups";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Setups() {
  const { setups, isLoading } = useSetups();
  const { t, direction } = useLanguage();

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn("text-center mb-12", direction === "rtl" && "text-right")}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{t("setups.title")}</span> {t("setups.ideas")}
          </h1>
          <p className={cn("text-lg text-muted-foreground max-w-2xl", direction === "rtl" ? "mr-0" : "mx-auto")}>
            {t("setups.description")}
          </p>
        </div>

        {/* Setups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : setups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {setups.map(setup => (
              <SetupCard key={setup.id} setup={setup} showProducts />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 mb-16 text-muted-foreground">
            {t("setups.noSetups")}
          </div>
        )}

        {/* CTA Section */}
        <section className="py-16 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
          <div className="absolute inset-0 bg-grid opacity-20" />
          
          <div className="relative z-10 text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("setups.wantCustom")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              {t("setups.customDescription")}
            </p>
            <Button asChild className="btn-gradient h-12 px-8">
              <Link to="/build" className={cn("flex items-center", direction === "rtl" && "flex-row-reverse")}>
                <Sparkles className={cn("w-5 h-5", direction === "rtl" ? "ml-2" : "mr-2")} />
                {t("setups.buildOwn")}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
