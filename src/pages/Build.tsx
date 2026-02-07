import { useState, useMemo } from "react";
import { Check, ChevronRight, ChevronLeft, ShoppingCart, Sparkles, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products, Product, categories } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type BuildStep = "pc" | "monitor" | "peripherals" | "audio" | "furniture";

export default function Build() {
  const [currentStep, setCurrentStep] = useState<BuildStep>("pc");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});
  const { addItem, openCart } = useCart();
  const { t, direction } = useLanguage();

  const buildSteps: { id: BuildStep; name: string; category: string }[] = [
    { id: "pc", name: t("build.gamingPC"), category: "pcs" },
    { id: "monitor", name: t("build.monitor"), category: "monitors" },
    { id: "peripherals", name: t("build.peripherals"), category: "peripherals" },
    { id: "audio", name: t("build.audio"), category: "audio" },
    { id: "furniture", name: t("build.furniture"), category: "furniture" }
  ];

  const currentStepIndex = buildSteps.findIndex(s => s.id === currentStep);
  const currentStepData = buildSteps[currentStepIndex];
  
  const availableProducts = useMemo(() => {
    return products.filter(p => p.category === currentStepData.category);
  }, [currentStepData]);

  const selectedProductDetails = useMemo(() => {
    return Object.values(selectedProducts)
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [selectedProducts]);

  const totalPrice = selectedProductDetails.reduce((sum, p) => sum + p.price, 0);

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [currentStep]: productId
    }));
  };

  const handleSkipStep = () => {
    if (currentStepIndex < buildSteps.length - 1) {
      setCurrentStep(buildSteps[currentStepIndex + 1].id);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < buildSteps.length - 1) {
      setCurrentStep(buildSteps[currentStepIndex + 1].id);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(buildSteps[currentStepIndex - 1].id);
    }
  };

  const handleAddAllToCart = () => {
    Object.values(selectedProducts).forEach(productId => {
      addItem(productId);
    });
    openCart();
  };

  const handleReset = () => {
    setSelectedProducts({});
    setCurrentStep("pc");
  };

  const isComplete = Object.keys(selectedProducts).length > 0;

  const ChevronIcon = direction === "rtl" ? ChevronLeft : ChevronRight;
  const PrevChevronIcon = direction === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn("text-center mb-8", direction === "rtl" && "text-right")}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{t("build.title")}</span> {t("build.yourSetup")}
          </h1>
          <p className={cn("text-lg text-muted-foreground max-w-2xl", direction === "rtl" ? "mr-0" : "mx-auto")}>
            {t("build.description")}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex items-center justify-center min-w-max gap-2">
            {(direction === "rtl" ? [...buildSteps].reverse() : buildSteps).map((step, index) => {
              const actualIndex = direction === "rtl" ? buildSteps.length - 1 - index : index;
              const isLast = direction === "rtl" ? index === 0 : index === buildSteps.length - 1;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : selectedProducts[step.id]
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {selectedProducts[step.id] ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                        {buildSteps.findIndex(s => s.id === step.id) + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
                  </button>
                  {!isLast && (
                    <ChevronIcon className="w-4 h-4 text-muted-foreground mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8", direction === "rtl" && "lg:grid-flow-dense")}>
          {/* Product Selection */}
          <div className={cn("lg:col-span-2", direction === "rtl" && "lg:col-start-2")}>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className={cn("flex items-center justify-between mb-6", direction === "rtl" && "flex-row-reverse")}>
                <h2 className="text-xl font-bold">
                  {t("build.selectYour")} {currentStepData.name}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                  {t("build.skipStep")}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableProducts.map(product => {
                  const isSelected = selectedProducts[currentStep] === product.id;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className={cn(
                        "flex gap-4 p-4 rounded-xl border transition-all text-left",
                        direction === "rtl" && "flex-row-reverse text-right",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-neon"
                          : "border-border bg-muted/30 hover:border-primary/50"
                      )}
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("flex items-start justify-between gap-2", direction === "rtl" && "flex-row-reverse")}>
                          <div>
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className={cn("flex items-center gap-2 mt-2", direction === "rtl" && "flex-row-reverse")}>
                          <span className="font-bold text-primary">
                            ${product.price.toLocaleString()}
                          </span>
                          {product.hasRgb && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className={cn("w-3 h-3", direction === "rtl" ? "ml-1" : "mr-1")} />
                              RGB
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className={cn("flex justify-between mt-8 pt-6 border-t border-border", direction === "rtl" && "flex-row-reverse")}>
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                >
                  {t("build.previous")}
                </Button>
                <Button
                  className="btn-gradient"
                  onClick={handleNextStep}
                  disabled={currentStepIndex === buildSteps.length - 1}
                >
                  {t("build.nextStep")}
                  <ChevronIcon className={cn("w-4 h-4", direction === "rtl" ? "mr-2" : "ml-2")} />
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className={cn("lg:col-span-1", direction === "rtl" && "lg:col-start-1")}>
            <div className={cn("sticky top-24 bg-card border border-border rounded-xl p-6", direction === "rtl" && "text-right")}>
              <h2 className="text-lg font-bold mb-4">{t("build.yourBuild")}</h2>

              {selectedProductDetails.length === 0 ? (
                <p className="text-muted-foreground text-sm mb-6">
                  {t("build.startSelecting")}
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  {selectedProductDetails.map(product => (
                    <div key={product.id} className={cn("flex items-center gap-3", direction === "rtl" && "flex-row-reverse")}>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-sm text-primary">${product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-4 mb-6">
                <div className={cn("flex justify-between items-center", direction === "rtl" && "flex-row-reverse")}>
                  <span className="text-muted-foreground">{t("build.total")}</span>
                  <span className="text-2xl font-bold text-gradient">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full btn-gradient"
                  disabled={!isComplete}
                  onClick={handleAddAllToCart}
                >
                  <ShoppingCart className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {t("build.addAllToCart")}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleReset}>
                    <RotateCcw className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                    {t("build.reset")}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className={cn("w-4 h-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                    {t("build.share")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
