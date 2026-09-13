/**
 * Types definition for Mini Bazaar (ميني بازار) Luxury E-Commerce
 */

export type AvailabilityStatus = 'available' | 'out_of_stock' | 'hidden';

export interface Category {
  id: string;
  parent_id?: string | null;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  image_path: string;
  sort_order: number;
  is_active: boolean;
}

export interface Brand {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  logo_path?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  availability_status: AvailabilityStatus;
  availability_note?: string;
  is_default: boolean;
  sort_order: number;
  image_path?: string;
  color_code?: string;
  attribute_type?: 'color' | 'size' | 'volume' | 'style';
}

export interface ProductImage {
  id: string;
  product_id: string;
  product_variant_id?: string | null;
  path: string;
  alt_text_ar: string;
  alt_text_en: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  brand_id?: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sku: string;
  short_description_ar: string;
  short_description_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  compare_at_price?: number;
  availability_status: AvailabilityStatus;
  availability_note_ar?: string;
  availability_note_en?: string;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  sort_order: number;
  rating: number;
  reviews_count: number;
  image_fit?: 'cover' | 'contain' | 'full_width';
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface DeliveryMethod {
  id: string;
  name_ar: string;
  name_en: string;
  description: string;
  fee: number;
  city_group: string;
  is_active: boolean;
  sort_order: number;
}

export type PaymentMethodType = 'bank_transfer' | 'cash_on_delivery' | 'store_pickup';

export interface BankAccountDetails {
  bank_name: string;
  iban: string;
  account_name: string;
  account_number: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name_ar: string;
  name_en: string;
  instructions: string;
  is_active: boolean;
  sort_order: number;
  bank_details?: BankAccountDetails;
}

export type OrderStatus =
  | 'new'
  | 'contacted'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItemSnapshot {
  product_id: string;
  variant_id?: string;
  product_name_snapshot: string;
  variant_name_snapshot?: string;
  sku_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_snapshot?: string;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  note: string;
  changed_by: string;
  created_at: string;
}

export interface CustomerAddress {
  country: string;
  city: string;
  district: string;
  street: string;
  building?: string;
  postal_code?: string;
  additional_details?: string;
  latitude?: number;
  longitude?: number;
  map_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  customer_email_snapshot?: string;
  address_snapshot: CustomerAddress;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  grand_total: number;
  delivery_method_snapshot: DeliveryMethod;
  payment_method_snapshot: PaymentMethod;
  status: OrderStatus;
  customer_notes?: string;
  admin_notes?: string;
  source: 'web' | 'whatsapp';
  placed_at: string;
  created_at?: string;
  bank_transfer_receipt?: string;
  bank_transfer_confirmed?: boolean;
  bank_transfer_verified?: boolean;
  bank_transfer_verified_at?: string;
  bank_transfer_notes?: string;
  items: OrderItemSnapshot[];
  logs: OrderStatusLog[];
}

export interface HeroSlide {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  badge_ar?: string;
  badge_en?: string;
  desktop_image: string;
  mobile_image: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  text_alignment: 'right' | 'center' | 'left';
  layout_type?: 'split' | 'full_background' | 'full_width_banner' | 'centered';
  background_type: 'color' | 'image' | 'gradient';
  background_value: string;
  background_image?: string;
  background_blur?: boolean;
  blur_amount?: number; // 0 to 20 (px) - 0 = ultra clear, 20 = heavy blur
  brightness?: number; // 50 to 150 (%) - 100% is normal
  contrast?: number; // 50 to 150 (%) - 100% is normal
  zoom_scale?: number; // 70 to 150 (%) - 100% is normal
  show_scrim_gradient?: boolean; // toggle dark/light atmospheric gradient scrim
  ambient_blur_layer?: boolean; // toggle background ambient glow/blur reflection
  overlay_opacity?: number; // 0 to 90
  title_color?: string;
  description_color?: string;
  badge_color?: string;
  badge_bg?: string;
  button_bg?: string;
  button_text_color?: string;
  secondary_button_bg?: string;
  secondary_button_text_color?: string;
  pulse_animation?: boolean;
  image_fit?: 'cover' | 'contain' | 'full_width';
  image_position?: 'top' | 'center' | 'bottom';
  desktop_height?: 'compact' | 'standard' | 'cinematic' | 'fullscreen';
  particles_effect?: 'none' | 'golden_sparkles' | 'luxury_dust' | 'floating_stars' | 'ambient_glow';
  particles_density?: 'low' | 'medium' | 'high';
  particles_speed?: 'slow' | 'normal' | 'fast';
  banner_border_style?: 'none' | 'glass' | 'polished' | 'gold_luxury' | 'floating_glow' | 'subtle_card' | 'vintage_bevel';
  banner_border_radius?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  banner_shadow_style?: 'none' | 'soft' | 'deep' | 'golden_glow';
  is_visible: boolean;
  sort_order: number;
}

export type CategoryCardStyle = 'luxury' | 'glass' | 'minimal' | 'compact' | 'overlay' | 'circle';
export type CarouselDirection = 'rtl' | 'ltr';
export type CategoryHoverEffect = 'zoom' | 'lift' | 'glow' | 'subtle';

export interface CategoryCarouselSettings {
  enabled: boolean;
  autoplay: boolean;
  speed: number;
  pause_on_hover: boolean;
  direction: CarouselDirection;
  show_arrows: boolean;
  show_view_all_button: boolean;
  card_style: CategoryCardStyle;
  hover_effect?: CategoryHoverEffect;
  show_item_count: boolean;
  show_description: boolean;
  show_gradient_fade: boolean;
  show_active_indicator?: boolean;
  badge_text_ar?: string;
  title_ar?: string;
}

export type BrandDisplayMode = 'both' | 'logo_only' | 'name_only';
export type BrandLogoSize = 'small' | 'medium' | 'large';

export interface BrandSettings {
  display_mode: BrandDisplayMode; // 'both' | 'logo_only' | 'name_only'
  logo_size: BrandLogoSize; // 'small' | 'medium' | 'large'
  show_product_count: boolean;
  show_on_product_card: boolean;
  show_in_product_modal: boolean;
  show_filter_bar: boolean;
  filter_title_ar?: string;
  badge_style?: 'luxury' | 'minimal' | 'pill';
}

export interface StoreSettings {
  store_name_ar: string;
  store_name_en: string;
  tagline_ar: string;
  tagline_en: string;
  announcement_bar_text_ar: string;
  announcement_bar_text_en: string;
  announcement_bar_visible: boolean;
  announcement_phrases?: string[];
  phone_number: string;
  whatsapp_number: string;
  support_email: string;
  boutique_address_ar: string;
  boutique_address_en: string;
  currency: string;
  currency_ar: string;
  custom_logo_url?: string;
  instagram_url?: string;
  snapchat_url?: string;
  tiktok_url?: string;

  // Category Carousel Settings
  category_carousel?: CategoryCarouselSettings;

  // Brand Display & Customization Settings
  brand_settings?: BrandSettings;

  // WhatsApp & Communications
  whatsapp_default_message?: string;
  whatsapp_tooltip_badge_text?: string;
  whatsapp_tooltip_enabled?: boolean;
  whatsapp_button_hover_text?: string;
  service_hours_ar?: string;

  // Social Links
  social_links?: SocialLink[];

  // Navigation Menu Items & Header Styling
  navigation_items?: NavigationItem[];
  header_bg_color?: string;
  header_border_color?: string;
  header_announcement_bg?: string;
  header_announcement_text_color?: string;
  header_nav_font_size?: 'xs' | 'sm' | 'base' | 'lg';
  header_nav_font_weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  header_nav_text_color?: string;
  header_nav_active_color?: string;
  header_nav_badge_bg?: string;
  header_nav_badge_color?: string;

  // Footer Settings, Styling & Commitments
  footer_bio_ar?: string;
  footer_verification_text_ar?: string;
  footer_copyright_ar?: string;
  footer_designer_credit_ar?: string;
  footer_show_designer_credit?: boolean;
  footer_columns?: FooterColumn[];
  footer_commitments?: { id: string; text_ar: string }[];
  footer_payment_methods?: string[];
  footer_bg_color?: string;
  footer_border_color?: string;
  footer_text_color?: string;
  footer_heading_color?: string;
  footer_link_color?: string;
  footer_badge_bg?: string;
  footer_badge_color?: string;
  footer_font_size?: 'xs' | 'sm' | 'base';
  footer_font_weight?: 'normal' | 'medium' | 'semibold';

  // Store Info Section, "About Us" and Text Policies System
  footer_store_info_title_ar?: string;
  about_us?: AboutUsSettings;
  store_policies?: StorePoliciesSettings;
}

export interface AboutUsParagraph {
  id: string;
  heading_ar?: string;
  text_ar: string;
}

export interface AboutUsValueItem {
  id: string;
  title_ar: string;
  description_ar?: string;
}

export interface AboutUsSettings {
  enabled: boolean;
  published: boolean;
  footer_link_title_ar: string;
  modal_title_ar: string;
  subtitle_ar?: string;
  paragraphs: AboutUsParagraph[];
  vision_ar?: string;
  mission_ar?: string;
  values?: AboutUsValueItem[];
  contact_text_ar?: string;
  show_last_updated?: boolean;
  last_updated?: string;
  text_alignment?: 'right' | 'center';
  font_size?: 'sm' | 'base' | 'lg';
}

export interface StorePolicyItem {
  id: string;
  key: string;
  title_ar: string;
  footer_link_text_ar: string;
  content_ar: string;
  is_active: boolean;
  is_published: boolean;
  sort_order: number;
  show_last_updated?: boolean;
  last_updated?: string;
}

export interface StorePoliciesSettings {
  section_title_ar: string;
  section_enabled: boolean;
  default_policy_id?: string;
  display_mode?: 'tabs' | 'sidebar' | 'list';
  policies: StorePolicyItem[];
}

export type AboutUsConfig = AboutUsSettings;
export type AboutUsValue = AboutUsValueItem;
export type StorePoliciesConfig = StorePoliciesSettings;

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'snapchat'
  | 'twitter'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'pinterest'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  title_ar: string;
  url: string;
  is_active: boolean;
  sort_order: number;
}

export type NavigationItemType = 'home' | 'category' | 'offers' | 'custom';

export interface NavigationItem {
  id: string;
  title_ar: string;
  type: NavigationItemType;
  category_id?: string;
  url?: string;
  badge?: string;
  is_active: boolean;
  sort_order: number;
}

export interface FooterBullet {
  id: string;
  text_ar: string;
}

export interface FooterLink {
  id: string;
  title_ar: string;
  url?: string;
  action_type?: 'category' | 'policy' | 'admin' | 'custom';
  target_id?: string;
}

export interface FooterColumn {
  id: string;
  title_ar: string;
  type: 'categories' | 'links' | 'bullets';
  links?: FooterLink[];
  bullets?: FooterBullet[];
  is_active: boolean;
  sort_order: number;
}

export interface ThemeSettings {
  primary_gold: string;
  taupe_strong: string;
  bg_color: string;
  surface_color: string;
  border_radius_card: number;
  carousel_autoplay: boolean;
  carousel_interval: number;
  hero_pulse_animation?: boolean;
}

export interface PageSection {
  id: string;
  type: string;
  title_ar: string;
  is_visible: boolean;
  sort_order: number;
}

export interface AdminCredentials {
  username: string;
  email: string;
  security_question?: string;
  recovery_email?: string;
}
