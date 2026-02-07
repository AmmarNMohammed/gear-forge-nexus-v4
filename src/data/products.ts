import productGamingPc from "@/assets/product-gaming-pc.jpg";
import productMonitor from "@/assets/product-monitor.jpg";
import productKeyboard from "@/assets/product-keyboard.jpg";
import productMouse from "@/assets/product-mouse.jpg";
import productHeadset from "@/assets/product-headset.jpg";
import productChair from "@/assets/product-chair.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "pcs" | "monitors" | "peripherals" | "furniture" | "audio" | "accessories";
  brand: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  hasRgb: boolean;
  featured?: boolean;
  specs?: Record<string, string>;
  tags?: string[];
}

export const products: Product[] = [
  {
    id: "pc-1",
    name: "Phantom X Gaming PC",
    description: "Ultimate gaming powerhouse with RTX 4090 and Intel i9-14900K. Experience unparalleled performance for 4K gaming and content creation.",
    price: 3999,
    originalPrice: 4499,
    image: productGamingPc,
    category: "pcs",
    brand: "NexusForge",
    rating: 4.9,
    reviews: 847,
    inStock: true,
    hasRgb: true,
    featured: true,
    specs: {
      "GPU": "NVIDIA RTX 4090 24GB",
      "CPU": "Intel Core i9-14900K",
      "RAM": "64GB DDR5 6000MHz",
      "Storage": "2TB NVMe Gen5 SSD",
      "Cooling": "360mm AIO Liquid Cooler",
      "PSU": "1000W 80+ Platinum"
    },
    tags: ["4K Gaming", "VR Ready", "Streaming"]
  },
  {
    id: "pc-2",
    name: "Stealth Pro Gaming PC",
    description: "High-performance gaming system with RTX 4080 Super. Perfect balance of power and value for competitive gaming.",
    price: 2499,
    image: productGamingPc,
    category: "pcs",
    brand: "NexusForge",
    rating: 4.8,
    reviews: 523,
    inStock: true,
    hasRgb: true,
    specs: {
      "GPU": "NVIDIA RTX 4080 Super 16GB",
      "CPU": "AMD Ryzen 9 7950X3D",
      "RAM": "32GB DDR5 5600MHz",
      "Storage": "1TB NVMe Gen4 SSD",
      "Cooling": "280mm AIO Liquid Cooler",
      "PSU": "850W 80+ Gold"
    },
    tags: ["Esports Ready", "1440p Gaming"]
  },
  {
    id: "pc-3",
    name: "Vortex Entry Gaming PC",
    description: "Budget-friendly gaming PC that doesn't compromise on quality. Great for 1080p gaming and everyday tasks.",
    price: 1299,
    image: productGamingPc,
    category: "pcs",
    brand: "NexusForge",
    rating: 4.6,
    reviews: 1243,
    inStock: true,
    hasRgb: true,
    specs: {
      "GPU": "NVIDIA RTX 4060 Ti 8GB",
      "CPU": "Intel Core i5-14600K",
      "RAM": "16GB DDR5 5200MHz",
      "Storage": "500GB NVMe SSD",
      "Cooling": "Tower Air Cooler",
      "PSU": "650W 80+ Bronze"
    },
    tags: ["Budget Friendly", "1080p Gaming"]
  },
  {
    id: "monitor-1",
    name: "UltraView 34\" Curved OLED",
    description: "Immersive 34-inch curved OLED gaming monitor with 240Hz refresh rate and 0.1ms response time. HDR 1000 certified.",
    price: 1299,
    originalPrice: 1499,
    image: productMonitor,
    category: "monitors",
    brand: "VisionMax",
    rating: 4.9,
    reviews: 634,
    inStock: true,
    hasRgb: true,
    featured: true,
    specs: {
      "Panel": "QD-OLED",
      "Resolution": "3440 x 1440",
      "Refresh Rate": "240Hz",
      "Response Time": "0.1ms GTG",
      "HDR": "HDR 1000",
      "Curve": "1800R"
    },
    tags: ["OLED", "Curved", "HDR"]
  },
  {
    id: "monitor-2",
    name: "ProGamer 27\" IPS",
    description: "Professional esports monitor with 360Hz refresh rate. G-Sync Ultimate certified for tear-free competitive gaming.",
    price: 799,
    image: productMonitor,
    category: "monitors",
    brand: "VisionMax",
    rating: 4.7,
    reviews: 892,
    inStock: true,
    hasRgb: false,
    specs: {
      "Panel": "Fast IPS",
      "Resolution": "1920 x 1080",
      "Refresh Rate": "360Hz",
      "Response Time": "1ms GTG",
      "Sync": "G-Sync Ultimate",
      "Stand": "Height Adjustable"
    },
    tags: ["Esports", "360Hz", "G-Sync"]
  },
  {
    id: "keyboard-1",
    name: "Apex Pro Mechanical Keyboard",
    description: "Premium optical-mechanical keyboard with adjustable actuation. Per-key RGB lighting and aluminum frame.",
    price: 229,
    originalPrice: 269,
    image: productKeyboard,
    category: "peripherals",
    brand: "KeyMaster",
    rating: 4.8,
    reviews: 2341,
    inStock: true,
    hasRgb: true,
    featured: true,
    specs: {
      "Switches": "Optical-Mechanical",
      "Layout": "Full Size",
      "Actuation": "Adjustable 0.2-3.8mm",
      "Backlight": "Per-Key RGB",
      "Frame": "Aircraft-Grade Aluminum",
      "Connectivity": "USB-C / Wireless"
    },
    tags: ["Optical", "Hot-Swappable", "Wireless"]
  },
  {
    id: "keyboard-2",
    name: "Phantom TKL Wireless",
    description: "Tenkeyless wireless mechanical keyboard with low-latency 2.4GHz connection. 80-hour battery life.",
    price: 159,
    image: productKeyboard,
    category: "peripherals",
    brand: "KeyMaster",
    rating: 4.6,
    reviews: 1567,
    inStock: true,
    hasRgb: true,
    specs: {
      "Switches": "Gateron Pro Red",
      "Layout": "TKL (87 Keys)",
      "Battery": "80 Hours",
      "Backlight": "RGB",
      "Connection": "2.4GHz / Bluetooth / USB-C",
      "Hot-Swap": "Yes"
    },
    tags: ["TKL", "Wireless", "Hot-Swappable"]
  },
  {
    id: "mouse-1",
    name: "Viper Ultra Wireless Mouse",
    description: "Ultra-lightweight wireless gaming mouse at just 49g. Focus Pro 30K optical sensor with 750 IPS tracking.",
    price: 149,
    image: productMouse,
    category: "peripherals",
    brand: "SwiftGear",
    rating: 4.9,
    reviews: 3421,
    inStock: true,
    hasRgb: true,
    featured: true,
    specs: {
      "Weight": "49g",
      "Sensor": "Focus Pro 30K",
      "DPI": "30,000",
      "Polling Rate": "4000Hz",
      "Battery": "90 Hours",
      "Switches": "Optical Gen-3"
    },
    tags: ["Ultra-Light", "Wireless", "Esports"]
  },
  {
    id: "mouse-2",
    name: "Titan Ergo Gaming Mouse",
    description: "Ergonomic gaming mouse with thumb rest. 11 programmable buttons for MMO and MOBA gaming.",
    price: 89,
    image: productMouse,
    category: "peripherals",
    brand: "SwiftGear",
    rating: 4.5,
    reviews: 1876,
    inStock: true,
    hasRgb: true,
    specs: {
      "Weight": "95g",
      "Sensor": "PMW3370",
      "DPI": "19,000",
      "Buttons": "11 Programmable",
      "Connection": "Wired USB",
      "Cable": "Paracord Flexible"
    },
    tags: ["Ergonomic", "MMO", "Programmable"]
  },
  {
    id: "headset-1",
    name: "Nova Pro Wireless Headset",
    description: "Premium wireless gaming headset with active noise cancellation. Hi-Res Audio certified with 360° spatial audio.",
    price: 349,
    originalPrice: 399,
    image: productHeadset,
    category: "audio",
    brand: "AudioElite",
    rating: 4.8,
    reviews: 1234,
    inStock: true,
    hasRgb: true,
    featured: true,
    specs: {
      "Drivers": "40mm Planar Magnetic",
      "Frequency": "10Hz - 40kHz",
      "ANC": "Adaptive Active",
      "Battery": "44 Hours",
      "Microphone": "AI-Noise Cancelling",
      "Audio": "360° Spatial Sound"
    },
    tags: ["ANC", "Hi-Res", "Wireless"]
  },
  {
    id: "headset-2",
    name: "Cloud Burst Gaming Headset",
    description: "Lightweight wired gaming headset with exceptional comfort. DTS Headphone:X 7.1 surround sound.",
    price: 99,
    image: productHeadset,
    category: "audio",
    brand: "AudioElite",
    rating: 4.6,
    reviews: 2876,
    inStock: true,
    hasRgb: false,
    specs: {
      "Drivers": "53mm Dynamic",
      "Frequency": "20Hz - 20kHz",
      "Surround": "DTS Headphone:X 7.1",
      "Weight": "280g",
      "Microphone": "Detachable Boom",
      "Pads": "Memory Foam"
    },
    tags: ["Lightweight", "7.1 Surround", "Comfort"]
  },
  {
    id: "chair-1",
    name: "Titan Evo Gaming Chair",
    description: "Premium ergonomic gaming chair with 4-way lumbar support. Magnetic memory foam head pillow and armrests.",
    price: 549,
    originalPrice: 649,
    image: productChair,
    category: "furniture",
    brand: "ErgoThrone",
    rating: 4.9,
    reviews: 4521,
    inStock: true,
    hasRgb: false,
    featured: true,
    specs: {
      "Material": "NEO Hybrid Leatherette",
      "Lumbar": "4-Way Adjustable",
      "Recline": "85° - 165°",
      "Armrests": "4D CloudSwap",
      "Max Weight": "395 lbs",
      "Height Range": "5'6\" - 6'2\""
    },
    tags: ["Ergonomic", "Lumbar Support", "Premium"]
  },
  {
    id: "chair-2",
    name: "Omega Fabric Gaming Chair",
    description: "Breathable fabric gaming chair for extended sessions. Cold-cure foam with premium build quality.",
    price: 399,
    image: productChair,
    category: "furniture",
    brand: "ErgoThrone",
    rating: 4.7,
    reviews: 2143,
    inStock: true,
    hasRgb: false,
    specs: {
      "Material": "SoftWeave Fabric",
      "Lumbar": "External Pillow",
      "Recline": "90° - 160°",
      "Armrests": "3D Adjustable",
      "Max Weight": "330 lbs",
      "Height Range": "5'4\" - 5'11\""
    },
    tags: ["Fabric", "Breathable", "Comfort"]
  }
];

export const categories = [
  { id: "pcs", name: "Gaming PCs", icon: "Monitor" },
  { id: "monitors", name: "Monitors", icon: "MonitorUp" },
  { id: "peripherals", name: "Peripherals", icon: "Keyboard" },
  { id: "audio", name: "Audio", icon: "Headphones" },
  { id: "furniture", name: "Furniture", icon: "Armchair" },
  { id: "accessories", name: "Accessories", icon: "Sparkles" }
] as const;

export const brands = ["NexusForge", "VisionMax", "KeyMaster", "SwiftGear", "AudioElite", "ErgoThrone"];

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowercaseQuery) ||
    p.description.toLowerCase().includes(lowercaseQuery) ||
    p.brand.toLowerCase().includes(lowercaseQuery) ||
    p.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}
