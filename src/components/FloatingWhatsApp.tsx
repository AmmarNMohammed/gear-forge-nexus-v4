import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FloatingWhatsApp = () => {
  const whatsappNumber = "8618718717134";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed left-6 bottom-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
            style={{
              background: "linear-gradient(135deg, hsla(var(--primary), 0.5), hsla(var(--secondary), 0.5))",
              backdropFilter: "blur(8px)",
            }}
            aria-label="Contact us on WhatsApp"
          >
            <MessageCircle className="w-7 h-7 text-primary-foreground" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card border-border">
          <p>Contact us</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FloatingWhatsApp;
