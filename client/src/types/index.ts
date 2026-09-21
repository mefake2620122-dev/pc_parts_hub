export type ConditionType = 'Like New' | 'Excellent' | 'Good' | 'Fair';
export type StockStatusType = 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT';

export interface ProductImage {
  id: number;
  product_id?: number;
  image_url: string;
  is_primary: number;
  sort_order?: number;
}

export interface Product {
  id: number;
  product_code: string;
  name: string;
  slug: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  brand: string;
  model: string;
  price: number;
  condition: ConditionType;
  stock_status: StockStatusType;
  quantity: number;
  description: string;
  specifications: Record<string, string>;
  is_featured: number;
  is_new_arrival: number;
  primary_image?: string;
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  description?: string;
  sort_order: number;
  is_active: number;
  total_products?: number;
  in_stock_count?: number;
}

export interface ComboItem {
  id: number;
  custom_label: string;
  product_id?: number;
  product_name?: string;
  product_price?: number;
  product_slug?: string;
  stock_status?: StockStatusType;
}

export interface Combo {
  id: number;
  title: string;
  name?: string;
  slug?: string;
  description: string;
  price: number;
  image?: string;
  image_url?: string;
  stock_status?: StockStatusType;
  is_featured?: number;
  created_at?: string;
  items?: ComboItem[];
  products?: any[];
}

export interface SiteSettings {
  business_name?: string;
  tagline?: string;
  sub_tagline?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  maps_url?: string;
  opening_hours?: string;
  about_text?: string;
  currency?: string;
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_desc?: string;
  hero_image?: string;
  trust_card_1_title?: string;
  trust_card_1_desc?: string;
  trust_card_2_title?: string;
  trust_card_2_desc?: string;
  trust_card_3_title?: string;
  trust_card_3_desc?: string;
  trust_card_4_title?: string;
  trust_card_4_desc?: string;
  [key: string]: string | undefined;
}

export interface Admin {
  id: number;
  username: string;
  name: string;
}
