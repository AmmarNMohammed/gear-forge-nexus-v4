import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface LegalModalProps {
  trigger: React.ReactNode;
  type: "privacy" | "terms";
}

export function LegalModal({ trigger, type }: LegalModalProps) {
  const [open, setOpen] = useState(false);
  const { t, direction } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-w-2xl max-h-[80vh]", direction === "rtl" && "text-right")}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gradient">
            {type === "privacy" ? t("footer.privacyPolicy") : t("footer.termsOfService")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {type === "privacy" ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 text-sm text-muted-foreground">
      <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">1. Introduction</h3>
        <p>
          Welcome to NexusGear. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we collect, use, and safeguard your information when you visit 
          our website or make a purchase.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">2. Information We Collect</h3>
        <p>We collect information you provide directly to us, including:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Name, email address, and contact information</li>
          <li>Billing and shipping addresses</li>
          <li>Payment information (processed securely via third-party providers)</li>
          <li>Order history and preferences</li>
          <li>Communications with our support team</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">3. How We Use Your Information</h3>
        <p>We use your personal information to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Process and fulfill your orders</li>
          <li>Communicate with you about orders, products, and services</li>
          <li>Send promotional emails (with your consent)</li>
          <li>Improve our website and customer experience</li>
          <li>Prevent fraud and enhance security</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">4. Information Sharing</h3>
        <p>
          We do not sell your personal information. We may share your data with trusted third parties 
          who assist us in operating our website, conducting our business, or serving you, including:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Payment processors (e.g., Stripe)</li>
          <li>Shipping and logistics partners</li>
          <li>Analytics providers</li>
          <li>Customer support tools</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">5. Cookies and Tracking</h3>
        <p>
          We use cookies and similar technologies to enhance your browsing experience, analyze site 
          traffic, and personalize content. You can manage your cookie preferences through your browser settings.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">6. Data Security</h3>
        <p>
          We implement industry-standard security measures to protect your personal information. 
          However, no method of transmission over the internet is 100% secure, and we cannot guarantee 
          absolute security.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">7. Your Rights</h3>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt out of marketing communications</li>
          <li>Data portability</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">8. Contact Us</h3>
        <p>
          If you have questions about this Privacy Policy, please contact us at:{" "}
          <span className="text-primary">privacy@nexusgear.com</span>
        </p>
      </section>
    </div>
  );
}

function TermsOfServiceContent() {
  return (
    <div className="space-y-6 text-sm text-muted-foreground">
      <p className="text-xs text-muted-foreground/70">Last updated: February 2026</p>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h3>
        <p>
          By accessing or using NexusGear's website and services, you agree to be bound by these 
          Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">2. Account Registration</h3>
        <p>
          To make purchases, you may need to create an account. You are responsible for maintaining 
          the confidentiality of your account credentials and for all activities under your account. 
          You must provide accurate and complete information during registration.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">3. Products and Pricing</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>All prices are displayed in USD and are subject to change without notice</li>
          <li>We reserve the right to modify or discontinue products at any time</li>
          <li>We make every effort to display accurate product information and images</li>
          <li>In case of pricing errors, we reserve the right to cancel orders</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">4. Orders and Payment</h3>
        <p>
          By placing an order, you warrant that you are legally capable of entering into binding 
          contracts. We accept major credit cards and other payment methods as displayed at checkout. 
          All payments are processed securely through our payment partners.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">5. Shipping and Delivery</h3>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Shipping times are estimates and not guarantees</li>
          <li>Risk of loss transfers to you upon delivery to the carrier</li>
          <li>International orders may be subject to customs duties and taxes</li>
          <li>We are not responsible for delays caused by carriers or customs</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">6. Returns and Refunds</h3>
        <p>
          We offer a 30-day return policy for most products in their original condition. Refunds 
          will be processed to the original payment method within 5-10 business days after we 
          receive the returned item. Some products may have specific return restrictions.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">7. Intellectual Property</h3>
        <p>
          All content on this website, including text, graphics, logos, images, and software, is 
          the property of NexusGear or its licensors and is protected by intellectual property laws. 
          You may not reproduce, distribute, or create derivative works without our written permission.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">8. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, NexusGear shall not be liable for any indirect, 
          incidental, special, consequential, or punitive damages arising from your use of our 
          services or products.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">9. Governing Law</h3>
        <p>
          These Terms of Service shall be governed by and construed in accordance with the laws of 
          the jurisdiction in which NexusGear operates, without regard to conflict of law principles.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">10. Changes to Terms</h3>
        <p>
          We reserve the right to update these Terms of Service at any time. Changes will be effective 
          immediately upon posting. Your continued use of our services constitutes acceptance of the 
          updated terms.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">11. Contact Information</h3>
        <p>
          For questions about these Terms of Service, please contact us at:{" "}
          <span className="text-primary">legal@nexusgear.com</span>
        </p>
      </section>
    </div>
  );
}
