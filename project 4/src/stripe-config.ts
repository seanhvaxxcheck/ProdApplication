export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price: number;
  interval?: 'month' | 'year';
  features: string[];
  itemLimit: number;
  popular?: boolean;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_starter',
    priceId: 'price_1S5equCZfIVspKe98prCSSX2',
    name: 'Starter',
    description: 'Perfect for small collections',
    mode: 'subscription',
    price: 0.00,
    interval: 'month',
    itemLimit: 10,
    features: [
      "Up to 10 items",
      "Basic inventory management",
      "Photo storage (1 per item)",
      "Email support"
    ],
  },
  {
    id: 'prod_pro',
    priceId: 'price_1S5euOCZfIVspKe9ysPWz3NY',
    name: 'Pro',
    description: 'Ideal for serious collectors',
    mode: 'subscription',
    price: 5.00,
    interval: 'month',
    itemLimit: 100,
    popular: true,
    features: [
      "Includes all free features",
      "Up to 100 items",
      "Market analysis & pricing",
      "Wishlist Items",
      "High support"
    ],
  },
  {
    id: 'prod_collector',
    priceId: 'price_1S3iyBCZfIVspKe9hG2VK67R',
    name: 'Collector',
    description: 'For large collections',
    mode: 'subscription',
    price: 10.00,
    interval: 'month',
    itemLimit: -1,
    features: [
      "Includes all Pro features",
      "Unlimited items",
      "Priority support",
      "First Access to all new features"
    ],
  },
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (productId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === productId);
};