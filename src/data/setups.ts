import setupMinimal from "@/assets/setup-minimal.jpg";
import setupRgb from "@/assets/setup-rgb.jpg";
import setupStreamer from "@/assets/setup-streamer.jpg";
import setupEsports from "@/assets/setup-esports.jpg";

export interface SetupProduct {
  productId: string;
  quantity: number;
}

export interface GamingSetup {
  id: string;
  name: string;
  description: string;
  image: string;
  totalPrice: number;
  products: SetupProduct[];
  style: "minimal" | "rgb" | "streamer" | "esports" | "budget" | "luxury";
  featured?: boolean;
  tags: string[];
}

export const gamingSetups: GamingSetup[] = [
  {
    id: "setup-minimal",
    name: "Clean & Minimal",
    description: "A sleek, distraction-free setup focused on productivity and gaming. Perfect for those who appreciate clean aesthetics.",
    image: setupMinimal,
    totalPrice: 4199,
    products: [
      { productId: "pc-2", quantity: 1 },
      { productId: "monitor-1", quantity: 1 },
      { productId: "keyboard-2", quantity: 1 },
      { productId: "mouse-1", quantity: 1 },
      { productId: "chair-2", quantity: 1 }
    ],
    style: "minimal",
    featured: true,
    tags: ["Clean Desk", "Productivity", "Aesthetic"]
  },
  {
    id: "setup-rgb",
    name: "RGB Beast",
    description: "The ultimate RGB gaming battlestation with synchronized lighting across all components. Make a statement.",
    image: setupRgb,
    totalPrice: 6299,
    products: [
      { productId: "pc-1", quantity: 1 },
      { productId: "monitor-1", quantity: 1 },
      { productId: "keyboard-1", quantity: 1 },
      { productId: "mouse-1", quantity: 1 },
      { productId: "headset-1", quantity: 1 },
      { productId: "chair-1", quantity: 1 }
    ],
    style: "rgb",
    featured: true,
    tags: ["RGB Lighting", "Premium", "Show-Off"]
  },
  {
    id: "setup-streamer",
    name: "Content Creator Pro",
    description: "Professional streaming and content creation setup with dual monitors and premium audio. Start your streaming career.",
    image: setupStreamer,
    totalPrice: 5499,
    products: [
      { productId: "pc-1", quantity: 1 },
      { productId: "monitor-2", quantity: 1 },
      { productId: "keyboard-1", quantity: 1 },
      { productId: "mouse-1", quantity: 1 },
      { productId: "headset-1", quantity: 1 },
      { productId: "chair-1", quantity: 1 }
    ],
    style: "streamer",
    featured: true,
    tags: ["Streaming", "Content Creation", "Professional"]
  },
  {
    id: "setup-esports",
    name: "Esports Champion",
    description: "Tournament-grade competitive gaming setup optimized for performance. No distractions, pure focus.",
    image: setupEsports,
    totalPrice: 3899,
    products: [
      { productId: "pc-2", quantity: 1 },
      { productId: "monitor-2", quantity: 1 },
      { productId: "keyboard-1", quantity: 1 },
      { productId: "mouse-1", quantity: 1 },
      { productId: "headset-1", quantity: 1 },
      { productId: "chair-1", quantity: 1 }
    ],
    style: "esports",
    featured: true,
    tags: ["Competitive", "360Hz", "Pro Gaming"]
  }
];

export function getSetupById(id: string): GamingSetup | undefined {
  return gamingSetups.find(s => s.id === id);
}

export function getFeaturedSetups(): GamingSetup[] {
  return gamingSetups.filter(s => s.featured);
}
