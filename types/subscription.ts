// types/subscription.ts - Tipos para el sistema de suscripciones
export interface PurchaseResult {
  success: boolean;
  error?: string;
  userCancelled?: boolean;
  customerInfo?: CustomerInfo;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planType: 'weekly' | 'monthly' | 'yearly' | 'free';
  expirationDate: string | null;
  willRenew: boolean;
  features: PremiumFeatures;
}

export interface PremiumFeatures {
  unlimitedDevotionals: boolean;
  noAds: boolean;
  offlineReading: boolean;
  personalizedContent: boolean;
  exportFeatures: boolean;
  prioritySupport: boolean;
}

export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: any[];
}

export interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: { [key: string]: any };
    all: { [key: string]: any };
  };
  activeSubscriptions: string[];
  allPurchaseDates: { [key: string]: string };
  allExpirationDates: { [key: string]: string };
  requestDate: string;
  firstSeen: string;
  originalApplicationVersion: string;
  originalPurchaseDate?: string;
}

export interface SubscriptionPlan {
  id: string;
  price: string;
  title: string;
  description: string;
  period: 'week' | 'month' | 'year';
  product: any;
}

export interface FormattedOfferings {
  weekly: SubscriptionPlan | null;
  monthly: SubscriptionPlan | null;
  annual: SubscriptionPlan | null;
}
