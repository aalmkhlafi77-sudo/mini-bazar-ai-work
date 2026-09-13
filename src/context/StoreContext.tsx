import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdminCredentials,
  Brand,
  Category,
  Product,
  ProductVariant,
  CartItem,
  Order,
  OrderStatus,
  HeroSlide,
  StoreSettings,
  ThemeSettings,
  DeliveryMethod,
  PaymentMethod,
  CustomerAddress,
} from '../types';
import {
  initialBrands,
  initialCategories,
  initialProducts,
  initialHeroSlides,
  initialDeliveryMethods,
  initialPaymentMethods,
  initialStoreSettings,
  initialThemeSettings,
} from '../data/initialData';
import { safeStorage } from '../utils/safeStorage';
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
  isFirebaseConfigured,
} from '../firebase';
import {
  listenToProducts,
  listenToCategories,
  listenToBrands,
  listenToOrders,
  listenToStoreSettings,
  listenToHeroSlides,
  saveProductToCloud,
  deleteProductFromCloud,
  saveCategoryToCloud,
  deleteCategoryFromCloud,
  saveBrandToCloud,
  deleteBrandFromCloud,
  saveOrderToCloud,
  updateOrderInCloud,
  saveHeroSlidesToCloud,
  saveStoreSettingsToCloud,
  saveThemeSettingsToCloud,
  publishSettingsToCloud,
  seedInitialFirestoreData,
} from '../utils/firebaseSync';

export interface CartNotificationData {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface StoreContextType {
  // Admin Authentication & Security (Exclusively via Firebase Authentication)
  adminUser: User | null;
  adminCredentials: AdminCredentials;
  isAdminAuthenticated: boolean;
  loginAdmin: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendAdminPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  recoverAdminPassword: (params: {
    identifier: string;
    securityAnswer?: string;
    recoveryPin?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateAdminUsername?: (newUsername: string) => { success: boolean; error?: string };
  updateAdminSecurity?: (securityData: {
    security_question?: string;
    security_answer?: string;
    recovery_email?: string;
    recovery_pin?: string;
  }) => { success: boolean; error?: string };
  resetAdminCredentialsToDefault?: () => void;
  refreshAdminToken: () => Promise<{ success: boolean; error?: string }>;
  isFirebaseConfigured: boolean;

  // Catalog & Navigation
  isInitialLoading: boolean;
  initialSyncError: string | null;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  selectedBrand: string | null;
  setSelectedBrand: (brandId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, variantId?: string, quantity?: number, openDrawer?: boolean) => void;
  updateCartQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  lastAddedNotification: CartNotificationData | null;
  clearLastAddedNotification: () => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Delivery & Payment
  deliveryMethods: DeliveryMethod[];
  paymentMethods: PaymentMethod[];

  // Orders
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: CustomerAddress;
    deliveryMethodId: string;
    paymentMethodId: string;
    customerNotes?: string;
    bankTransferReceipt?: string;
    bankTransferConfirmed?: boolean;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note: string, adminNotes?: string) => void;
  updateOrderAdminNotes: (orderId: string, adminNotes: string) => void;
  verifyBankTransferReceipt: (orderId: string, verified: boolean, notes?: string) => void;
  addManualOrder: (order: Partial<Order>) => void;

  // Hero Carousel & Customization
  heroSlides: HeroSlide[];
  updateHeroSlides: (slides: HeroSlide[]) => void;
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  themeSettings: ThemeSettings;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  publishCustomization: () => void;
  hasUnpublishedChanges: boolean;
  restoreDefaultCustomization: () => void;

  // View state navigation
  activeView: 'store' | 'product' | 'checkout' | 'order-success' | 'wishlist' | 'admin' | 'policy' | 'track-order';
  setActiveView: (view: 'store' | 'product' | 'checkout' | 'order-success' | 'wishlist' | 'admin' | 'policy' | 'track-order') => void;
  activePolicy: string | null;
  openPolicy: (policyKey: string) => void;
  isAboutUsModalOpen: boolean;
  setIsAboutUsModalOpen: (isOpen: boolean) => void;
  openAboutUsModal: () => void;
  closeAboutUsModal: () => void;
  isPoliciesModalOpen: boolean;
  setIsPoliciesModalOpen: (isOpen: boolean) => void;
  openPoliciesModal: (policyKey?: string) => void;
  closePoliciesModal: () => void;

  // Product & Category Administration
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  saveBrand: (brand: Brand) => void;
  deleteBrand: (brandId: string) => void;

  // Language
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const isUserAdminAuthorized = (user: User, claims?: Record<string, any>): boolean => {
  if (claims?.admin === true || claims?.admin === 'true' || claims?.admin === 1) {
    return true;
  }
  const email = (user.email || '').toLowerCase().trim();
  if (email === 'a.almkhlafi77@gmail.com') {
    return true;
  }
  // In this store, any user registered in Firebase Authentication is an authorized store administrator
  if (email && email.includes('@')) {
    return true;
  }
  return false;
};

export const mergeStoreSettingsWithDefaults = (incoming?: Partial<StoreSettings> | null): StoreSettings => {
  if (!incoming) return initialStoreSettings;

  // Safe merge of about_us
  const incomingAboutUs = incoming.about_us;
  const defaultAboutUs = initialStoreSettings.about_us;
  const mergedAboutUs = {
    ...defaultAboutUs,
    ...(incomingAboutUs || {}),
    enabled: incomingAboutUs?.enabled !== undefined ? incomingAboutUs.enabled : (defaultAboutUs?.enabled ?? true),
    published: incomingAboutUs?.published !== undefined ? incomingAboutUs.published : (defaultAboutUs?.published ?? true),
    footer_link_title_ar: incomingAboutUs?.footer_link_title_ar || defaultAboutUs?.footer_link_title_ar || 'من نحن',
    modal_title_ar: incomingAboutUs?.modal_title_ar || defaultAboutUs?.modal_title_ar || 'عن بوتيك ميني بازار',
    subtitle_ar: incomingAboutUs?.subtitle_ar ?? defaultAboutUs?.subtitle_ar ?? '',
    paragraphs:
      incomingAboutUs?.paragraphs && incomingAboutUs.paragraphs.length > 0
        ? incomingAboutUs.paragraphs
        : defaultAboutUs?.paragraphs || [],
    vision_ar: incomingAboutUs?.vision_ar || defaultAboutUs?.vision_ar || '',
    mission_ar: incomingAboutUs?.mission_ar || defaultAboutUs?.mission_ar || '',
    values:
      incomingAboutUs?.values && incomingAboutUs.values.length > 0
        ? incomingAboutUs.values
        : defaultAboutUs?.values || [],
    contact_text_ar: incomingAboutUs?.contact_text_ar || defaultAboutUs?.contact_text_ar || '',
    show_last_updated: incomingAboutUs?.show_last_updated !== undefined ? incomingAboutUs.show_last_updated : (defaultAboutUs?.show_last_updated ?? true),
    last_updated: incomingAboutUs?.last_updated || defaultAboutUs?.last_updated || '2026-03-01',
    text_alignment: incomingAboutUs?.text_alignment || defaultAboutUs?.text_alignment || 'right',
    font_size: incomingAboutUs?.font_size || defaultAboutUs?.font_size || 'sm',
  };

  // Safe merge of store_policies
  const incomingPoliciesConfig = incoming.store_policies;
  const defaultPoliciesConfig = initialStoreSettings.store_policies;
  const incomingPolicies = incomingPoliciesConfig?.policies || [];
  const defaultPolicies = defaultPoliciesConfig?.policies || [];

  let finalPolicies = incomingPolicies.length > 0 ? incomingPolicies : defaultPolicies;

  // Ensure default legal policies are preserved if partially missing
  if (finalPolicies.length > 0 && finalPolicies.length < 5) {
    const existingKeys = new Set(finalPolicies.map((p) => p.key || p.id));
    const missingDefaults = defaultPolicies.filter((dp) => !existingKeys.has(dp.key) && !existingKeys.has(dp.id));
    finalPolicies = [...finalPolicies, ...missingDefaults];
  }

  const mergedStorePolicies = {
    ...defaultPoliciesConfig,
    ...(incomingPoliciesConfig || {}),
    section_title_ar: incomingPoliciesConfig?.section_title_ar || defaultPoliciesConfig?.section_title_ar || 'معلومات المتجر',
    section_enabled: incomingPoliciesConfig?.section_enabled !== undefined ? incomingPoliciesConfig.section_enabled : (defaultPoliciesConfig?.section_enabled ?? true),
    display_mode: incomingPoliciesConfig?.display_mode || defaultPoliciesConfig?.display_mode || 'tabs',
    default_policy_id: incomingPoliciesConfig?.default_policy_id || defaultPoliciesConfig?.default_policy_id || 'pol-privacy',
    policies: finalPolicies,
  };

  return {
    ...initialStoreSettings,
    ...incoming,
    brand_settings: {
      ...initialStoreSettings.brand_settings,
      ...(incoming.brand_settings || {}),
    },
    about_us: mergedAboutUs,
    store_policies: mergedStorePolicies,
    social_links:
      incoming.social_links && incoming.social_links.length > 0
        ? incoming.social_links
        : initialStoreSettings.social_links,
    navigation_items:
      incoming.navigation_items && incoming.navigation_items.length > 0
        ? incoming.navigation_items
        : initialStoreSettings.navigation_items,
    footer_columns:
      incoming.footer_columns && incoming.footer_columns.length > 0
        ? incoming.footer_columns
        : initialStoreSettings.footer_columns,
    footer_commitments:
      incoming.footer_commitments && incoming.footer_commitments.length > 0
        ? incoming.footer_commitments
        : initialStoreSettings.footer_commitments,
    footer_payment_methods:
      incoming.footer_payment_methods && incoming.footer_payment_methods.length > 0
        ? incoming.footer_payment_methods
        : initialStoreSettings.footer_payment_methods,
  };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin Authentication State strictly wired to Firebase Authentication
  const [adminUser, setAdminUser] = useState<User | null>(auth?.currentUser || null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(Boolean(auth?.currentUser));

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          if (isUserAdminAuthorized(user, tokenResult.claims)) {
            setAdminUser(user);
            setIsAdminAuthenticated(true);
          } else {
            console.warn('User authenticated in Firebase Auth but lacks admin authorization. Signing out.');
            await signOut(auth);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        } catch (err) {
          console.error('Error verifying getIdTokenResult in onAuthStateChanged:', err);
          // If network error during token verification, retain session if user exists
          if (user.email) {
            setAdminUser(user);
            setIsAdminAuthenticated(true);
          } else {
            await signOut(auth);
            setAdminUser(null);
            setIsAdminAuthenticated(false);
          }
        }
      } else {
        setAdminUser(null);
        setIsAdminAuthenticated(false);
      }
    });
    return () => {
      unsubAuth();
    };
  }, []);

  const adminCredentials: AdminCredentials = {
    username: adminUser?.email ? adminUser.email.split('@')[0] : 'مشرف ميني بازار',
    email: adminUser?.email || '',
    recovery_email: adminUser?.email || '',
  };

  // Catalog & Navigation states strictly populated from Firestore without stale or default fallback flash
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [initialSyncError, setInitialSyncError] = useState<string | null>(null);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = safeStorage.getItem('mb_store_settings');
    if (!saved) return initialStoreSettings;
    try {
      const parsed = JSON.parse(saved);
      return mergeStoreSettingsWithDefaults(parsed);
    } catch {
      return initialStoreSettings;
    }
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const saved = safeStorage.getItem('mb_theme_settings');
    return saved ? JSON.parse(saved) : initialThemeSettings;
  });

  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  // Delivery & Payment options
  const [deliveryMethods] = useState<DeliveryMethod[]>(initialDeliveryMethods);
  const [paymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);

  // Cart & Wishlist with rigorous sanitization
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = safeStorage.getItem('mb_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Clean up and validate every item to ensure no undefined products or corrupt properties
      return parsed.filter(
        (item): item is CartItem =>
          Boolean(item && item.product && typeof item.product === 'object' && item.product.id)
      );
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('mb_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeStorage.getItem('mb_orders');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ord-1001',
            order_number: 'MB-2026-9401',
            customer_name_snapshot: 'سارة عبد الرحمن آل سعود',
            customer_phone_snapshot: '+966509876543',
            customer_email_snapshot: 'sarah.al@example.com',
            address_snapshot: {
              country: 'المملكة العربية السعودية',
              city: 'الرياض',
              district: 'حي حطين',
              street: 'شارع الأمير محمد بن سلمان',
              building: 'فيلا 14',
              notes: 'يرجى الاتصال قبل الوصول بـ 15 دقيقة والتغليف الفاخر الخاص بالهدايا.',
            },
            subtotal: 628,
            delivery_fee: 35,
            discount_total: 0,
            grand_total: 663,
            delivery_method_snapshot: initialDeliveryMethods[0],
            payment_method_snapshot: initialPaymentMethods[0],
            status: 'confirmed',
            source: 'web',
            placed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            items: [
              {
                product_id: 'prod-1',
                variant_id: 'var-1-1',
                product_name_snapshot: 'حقيبة يد ليدي باج عاجية بلمسة ذهبية',
                variant_name_snapshot: 'عاجي طبيعي / بيج فاتح',
                sku_snapshot: 'MB-BAG-001-IVR',
                unit_price: 349,
                quantity: 1,
                line_total: 349,
                image_snapshot: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
              },
              {
                product_id: 'prod-3',
                variant_id: 'var-3-1',
                product_name_snapshot: 'عطر لوميير المركز — زهور البرغموت والعنبر الدافئ',
                variant_name_snapshot: 'حجم 100 مل مركز',
                sku_snapshot: 'MB-PRF-003-100',
                unit_price: 279,
                quantity: 1,
                line_total: 279,
                image_snapshot: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
              },
            ],
            logs: [
              {
                id: 'log-1',
                order_id: 'ord-1001',
                from_status: 'new',
                to_status: 'confirmed',
                note: 'تم تأكيد استلام إيصال التحويل البنكي وتجهيز كرتون الإهداء الفاخر.',
                changed_by: 'المدير العام (مشرف ميني بازار)',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
              },
            ],
          },
        ];
  });

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [lastAddedNotification, setLastAddedNotification] = useState<CartNotificationData | null>(null);

  const clearLastAddedNotification = () => {
    setLastAddedNotification(null);
  };

  // Navigation & View State
  const [activeView, setActiveView] = useState<'store' | 'product' | 'checkout' | 'order-success' | 'wishlist' | 'admin' | 'policy' | 'track-order'>('store');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  // Persistence to storage with robust safeStorage guards
  useEffect(() => {
    try {
      safeStorage.setItem('mb_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to storage:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      safeStorage.setItem('mb_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to storage:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      safeStorage.setItem('mb_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save orders to storage:', e);
    }
  }, [orders]);

  // ================= CLOUD FIRESTORE SYNCHRONIZATION =================
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsInitialLoading(false);
      return;
    }

    let productsSynced = false;
    let categoriesSynced = false;
    let brandsSynced = false;
    let heroSlidesSynced = false;
    let settingsSynced = false;

    const checkInitialSyncDone = () => {
      if (productsSynced && categoriesSynced && brandsSynced && heroSlidesSynced && settingsSynced) {
        setIsInitialLoading(false);
      }
    };

    const handleSyncError = (err: any) => {
      let msg = 'تعذر الاتصال بقاعدة البيانات لجلب المعروضات الحالية. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً.';
      if (err?.code === 'permission-denied') {
        msg = 'تم رفض إذن الوصول إلى بيانات المتجر (Permission Denied). يرجى التأكد من صلاحيات وقواعد أمان Firestore.';
      } else if (err?.code === 'unavailable') {
        msg = 'خدمة Firestore غير متاحة حالياً أو انقطع اتصال الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
      }
      setInitialSyncError(msg);
      setIsInitialLoading(false);
    };

    // Safety timeout: ensure loading skeleton resolves even on slow/degraded networks
    const safetyTimer = setTimeout(() => {
      if (!productsSynced || !categoriesSynced || !brandsSynced || !heroSlidesSynced || !settingsSynced) {
        setInitialSyncError('استغرق الاتصال بقاعدة البيانات وقتاً أطول من المتوقع. يرجى التحقق من اتصال الإنترنت.');
      }
      setIsInitialLoading(false);
    }, 3500);

    // 1. Real-time Products Sync
    const unsubProducts = listenToProducts(
      (cloudProducts) => {
        if (Array.isArray(cloudProducts)) {
          setProducts(cloudProducts);
          safeStorage.setItem('mb_products', JSON.stringify(cloudProducts));
        }
        productsSynced = true;
        checkInitialSyncDone();
      },
      (err) => {
        productsSynced = true;
        handleSyncError(err);
      }
    );

    // 2. Real-time Categories Sync
    const unsubCategories = listenToCategories(
      (cloudCategories) => {
        if (Array.isArray(cloudCategories)) {
          setCategories(cloudCategories);
          safeStorage.setItem('mb_categories', JSON.stringify(cloudCategories));
        }
        categoriesSynced = true;
        checkInitialSyncDone();
      },
      (err) => {
        categoriesSynced = true;
        handleSyncError(err);
      }
    );

    // 3. Real-time Brands Sync
    const unsubBrands = listenToBrands(
      (cloudBrands) => {
        if (Array.isArray(cloudBrands)) {
          setBrands(cloudBrands);
          safeStorage.setItem('mb_brands', JSON.stringify(cloudBrands));
        }
        brandsSynced = true;
        checkInitialSyncDone();
      },
      (err) => {
        brandsSynced = true;
        handleSyncError(err);
      }
    );

    // 4. Real-time Orders Sync
    const unsubOrders = listenToOrders(
      (cloudOrders) => {
        if (Array.isArray(cloudOrders)) {
          setOrders(cloudOrders);
          safeStorage.setItem('mb_orders', JSON.stringify(cloudOrders));
        }
      },
      (err) => {
        console.warn('Orders initial sync notice:', err?.message);
      }
    );

    // 5. Real-time Store Settings & Customization Sync
    const unsubSettings = listenToStoreSettings(
      (cloudData) => {
        if (cloudData.storeSettings) {
          const merged = mergeStoreSettingsWithDefaults(cloudData.storeSettings);
          setStoreSettings(merged);
          safeStorage.setItem('mb_store_settings', JSON.stringify(merged));
        }
        if (cloudData.themeSettings) {
          setThemeSettings(cloudData.themeSettings);
          safeStorage.setItem('mb_theme_settings', JSON.stringify(cloudData.themeSettings));
        }
        settingsSynced = true;
        checkInitialSyncDone();
      },
      (err) => {
        settingsSynced = true;
        handleSyncError(err);
      }
    );

    // 6. Real-time Hero Slides Sync (Single Source of Truth)
    const unsubHeroSlides = listenToHeroSlides(
      (cloudSlides) => {
        if (Array.isArray(cloudSlides)) {
          setHeroSlides(cloudSlides);
          safeStorage.setItem('mb_hero_slides', JSON.stringify(cloudSlides));
        }
        heroSlidesSynced = true;
        checkInitialSyncDone();
      },
      (err) => {
        heroSlidesSynced = true;
        handleSyncError(err);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubCategories();
      unsubBrands();
      unsubOrders();
      unsubSettings();
      unsubHeroSlides();
    };
  }, [isFirebaseConfigured]);

  // Cart operations with comprehensive safety guards
  const addToCart = (product: Product, variantId?: string, quantity: number = 1, openDrawer: boolean = false) => {
    if (!product || !product.id) return;

    try {
      const safeProductVariants = Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants
        : [
            {
              id: `var-default-${product.id}`,
              product_id: product.id,
              name_ar: 'الخيار الافتراضي',
              name_en: 'Default',
              sku: product.sku || 'MB-DEF',
              price: typeof product.price === 'number' ? product.price : 0,
              compare_at_price: product.compare_at_price,
              availability_status: product.availability_status || 'available',
              is_default: true,
              sort_order: 1,
            },
          ];

      const selectedVariant = variantId
        ? safeProductVariants.find((v) => v.id === variantId) || safeProductVariants[0]
        : safeProductVariants.find((v) => v.is_default) || safeProductVariants[0];

      const safeQuantity = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : 1;

      // Safe lightweight product copy to avoid storage bloat
      const cleanProduct: Product = {
        id: product.id,
        category_id: product.category_id,
        brand_id: product.brand_id,
        name_ar: product.name_ar || 'منتج ميني بازار',
        name_en: product.name_en || '',
        short_description_ar: product.short_description_ar || '',
        short_description_en: product.short_description_en || '',
        description_ar: product.description_ar || '',
        description_en: product.description_en || '',
        slug: product.slug || product.id,
        sku: product.sku || 'MB-ITEM',
        price: typeof product.price === 'number' ? product.price : 0,
        compare_at_price: product.compare_at_price,
        availability_status: product.availability_status || 'available',
        is_featured: Boolean(product.is_featured),
        is_new: Boolean(product.is_new),
        is_best_seller: Boolean(product.is_best_seller),
        is_active: product.is_active ?? true,
        sort_order: product.sort_order || 1,
        rating: product.rating || 5,
        reviews_count: product.reviews_count || 1,
        images: Array.isArray(product.images) && product.images.length > 0
          ? [product.images[0]]
          : [
              {
                id: `def-img-${product.id}`,
                product_id: product.id,
                path: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
                alt_text_ar: product.name_ar || 'منتج',
                alt_text_en: product.name_en || 'Product',
                sort_order: 1,
                is_primary: true,
              },
            ],
        variants: safeProductVariants,
      };

      const cleanVariant = selectedVariant
        ? {
            ...selectedVariant,
            price: typeof selectedVariant.price === 'number' ? selectedVariant.price : cleanProduct.price,
            name_ar: selectedVariant.name_ar || 'الخيار الافتراضي',
          }
        : undefined;

      setCart((prev) => {
        const safePrev = Array.isArray(prev)
          ? prev.filter((item) => Boolean(item && item.product && item.product.id))
          : [];

        const existingIndex = safePrev.findIndex(
          (item) =>
            item.product.id === cleanProduct.id &&
            (item.variant?.id ?? 'default') === (cleanVariant?.id ?? 'default')
        );

        if (existingIndex > -1) {
          const updated = [...safePrev];
          const currentQty = typeof updated[existingIndex].quantity === 'number' ? updated[existingIndex].quantity : 1;
          updated[existingIndex] = {
            ...updated[existingIndex],
            product: cleanProduct,
            variant: cleanVariant,
            quantity: currentQty + safeQuantity,
          };
          return updated;
        } else {
          return [...safePrev, { product: cleanProduct, variant: cleanVariant, quantity: safeQuantity }];
        }
      });

      // Show floating luxury feedback toast
      setLastAddedNotification({
        product: cleanProduct,
        variant: cleanVariant,
        quantity: safeQuantity,
      });

      // Only open cart drawer if explicitly requested (e.g. from modal or checkout CTA)
      if (openDrawer) {
        setIsCartOpen(true);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const updateCartQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (!productId) return;
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter((item) => Boolean(item && item.product && item.product.id))
        .map((item) => {
          if (
            item.product.id === productId &&
            (item.variant?.id ?? 'default') === (variantId ?? 'default')
          ) {
            return { ...item, quantity };
          }
          return item;
        })
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    if (!productId) return;
    setCart((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter((item) => Boolean(item && item.product && item.product.id))
        .filter(
          (item) =>
            !(
              item.product.id === productId &&
              (item.variant?.id ?? 'default') === (variantId ?? 'default')
            )
        )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = Array.isArray(cart)
    ? cart.reduce((acc, item) => {
        if (!item || !item.product) return acc;
        const price =
          typeof item.variant?.price === 'number'
            ? item.variant.price
            : typeof item.product.price === 'number'
            ? item.product.price
            : 0;
        const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        return acc + price * qty;
      }, 0)
    : 0;

  const cartCount = Array.isArray(cart)
    ? cart.reduce((acc, item) => {
        if (!item || !item.product) return acc;
        const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        return acc + qty;
      }, 0)
    : 0;

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Order creation (Secure Calculation & Snapshotting)
  const createOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: CustomerAddress;
    deliveryMethodId: string;
    paymentMethodId: string;
    customerNotes?: string;
    bankTransferReceipt?: string;
    bankTransferConfirmed?: boolean;
  }): Promise<Order> => {
    // Re-verify prices and stock from current catalog state
    const deliveryMethod =
      deliveryMethods.find((d) => d.id === orderData.deliveryMethodId) || deliveryMethods[0];
    const paymentMethod =
      paymentMethods.find((p) => p.id === orderData.paymentMethodId) || paymentMethods[0];

    const orderItems = cart.map((item) => {
      // Re-fetch product from products state to prevent frontend price manipulation
      const liveProduct = products.find((p) => p.id === item.product.id) || item.product;
      const liveVariant = item.variant
        ? liveProduct.variants.find((v) => v.id === item.variant?.id) || item.variant
        : undefined;

      const unitPrice = liveVariant?.price ?? liveProduct.price;
      const lineTotal = unitPrice * item.quantity;

      return {
        product_id: liveProduct.id,
        variant_id: liveVariant?.id,
        product_name_snapshot: liveProduct.name_ar,
        variant_name_snapshot: liveVariant?.name_ar,
        sku_snapshot: liveVariant?.sku || liveProduct.sku,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        image_snapshot: liveVariant?.image_path || liveProduct.images[0]?.path,
      };
    });

    const calculatedSubtotal = orderItems.reduce((acc, item) => acc + item.line_total, 0);
    const calculatedDeliveryFee = deliveryMethod.fee;
    const discount = 0;
    const grandTotal = calculatedSubtotal + calculatedDeliveryFee - discount;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MB-2026-${randomNum}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      customer_name_snapshot: orderData.customerName,
      customer_phone_snapshot: orderData.customerPhone,
      customer_email_snapshot: orderData.customerEmail,
      address_snapshot: orderData.address,
      subtotal: calculatedSubtotal,
      delivery_fee: calculatedDeliveryFee,
      discount_total: discount,
      grand_total: grandTotal,
      delivery_method_snapshot: deliveryMethod,
      payment_method_snapshot: paymentMethod,
      status: 'new',
      customer_notes: orderData.customerNotes,
      source: 'web',
      placed_at: new Date().toISOString(),
      bank_transfer_receipt: orderData.bankTransferReceipt,
      bank_transfer_confirmed: Boolean(orderData.bankTransferConfirmed),
      bank_transfer_verified: false,
      items: orderItems,
      logs: [
        {
          id: `log-${Date.now()}`,
          order_id: `ord-${Date.now()}`,
          from_status: 'new',
          to_status: 'new',
          note: 'تم إنشاء الطلب بنجاح عبر المتجر الإلكتروني وحفظ النسخة المعتمدة للأسعار والمواصفات.',
          changed_by: 'نظام ميني بازار المركزي',
          created_at: new Date().toISOString(),
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    clearCart();
    setActiveView('order-success');
    
    // Persist new order to cloud Firestore
    saveOrderToCloud(newOrder);
    
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note: string, adminNotes?: string) => {
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const newLog = {
            id: `log-${Date.now()}`,
            order_id: orderId,
            from_status: ord.status,
            to_status: newStatus,
            note: note || `تم تغيير حالة الطلب إلى "${newStatus}"`,
            changed_by: 'المدير المسؤول (لوحة التحكم)',
            created_at: new Date().toISOString(),
          };
          updatedOrder = {
            ...ord,
            status: newStatus,
            admin_notes: adminNotes !== undefined ? adminNotes : (note || ord.admin_notes),
            logs: [newLog, ...ord.logs],
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      updateOrderInCloud(orderId, updatedOrder);
    }
  };

  const updateOrderAdminNotes = (orderId: string, adminNotes: string) => {
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const newLog = {
            id: `log-${Date.now()}`,
            order_id: orderId,
            from_status: ord.status,
            to_status: ord.status,
            note: `تحديث ملاحظات المشرف للعميل: "${adminNotes}"`,
            changed_by: 'المدير المسؤول (لوحة التحكم)',
            created_at: new Date().toISOString(),
          };
          updatedOrder = {
            ...ord,
            admin_notes: adminNotes,
            logs: [newLog, ...ord.logs],
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      updateOrderInCloud(orderId, updatedOrder);
    }
  };

  const verifyBankTransferReceipt = (orderId: string, verified: boolean, notes?: string) => {
    let updatedOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const newLog = {
            id: `log-${Date.now()}`,
            order_id: orderId,
            from_status: ord.status,
            to_status: verified && ord.status === 'new' ? ('confirmed' as OrderStatus) : ord.status,
            note: verified
              ? `تم التحقق والمطابقة مع البنك بنجاح${notes ? ` (ملاحظة: ${notes})` : ''}`
              : `تم إلغاء تأكيد مطابقة الحوالة البنكية${notes ? ` (ملاحظة: ${notes})` : ''}`,
            changed_by: 'المدير المالي (لوحة التحكم)',
            created_at: new Date().toISOString(),
          };
          updatedOrder = {
            ...ord,
            bank_transfer_verified: verified,
            bank_transfer_verified_at: verified ? new Date().toISOString() : undefined,
            bank_transfer_notes: notes ?? ord.bank_transfer_notes,
            status: verified && ord.status === 'new' ? 'confirmed' : ord.status,
            logs: [newLog, ...ord.logs],
          };
          return updatedOrder;
        }
        return ord;
      })
    );

    if (updatedOrder) {
      updateOrderInCloud(orderId, updatedOrder);
    }
  };

  const addManualOrder = (orderData: Partial<Order>) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MB-WA-${randomNum}`;
    const newOrder: Order = {
      id: `ord-manual-${Date.now()}`,
      order_number: orderNumber,
      customer_name_snapshot: orderData.customer_name_snapshot || 'عميل واتساب',
      customer_phone_snapshot: orderData.customer_phone_snapshot || '+966500000000',
      customer_email_snapshot: orderData.customer_email_snapshot,
      address_snapshot: orderData.address_snapshot || {
        country: 'المملكة العربية السعودية',
        city: 'الرياض',
        district: 'وسط المدينة',
        street: 'شارع عام',
      },
      subtotal: orderData.subtotal || 350,
      delivery_fee: orderData.delivery_fee || 35,
      discount_total: orderData.discount_total || 0,
      grand_total: (orderData.subtotal || 350) + (orderData.delivery_fee || 35),
      delivery_method_snapshot: orderData.delivery_method_snapshot || deliveryMethods[0],
      payment_method_snapshot: orderData.payment_method_snapshot || paymentMethods[0],
      status: 'confirmed',
      customer_notes: orderData.customer_notes || 'طلب وارد ومؤكد مباشرة عبر تطبيق الواتساب',
      source: 'whatsapp',
      placed_at: new Date().toISOString(),
      items: orderData.items || [],
      logs: [
        {
          id: `log-${Date.now()}`,
          order_id: `ord-manual-${Date.now()}`,
          from_status: 'new',
          to_status: 'confirmed',
          note: 'تم إدخال وتثبيت الطلب يدوياً بواسطة فريق خدمة عملاء الواتساب.',
          changed_by: 'خدمة عملاء واتساب ميني بازار',
          created_at: new Date().toISOString(),
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    saveOrderToCloud(newOrder);
  };

  // Customization & Settings Management
  const updateHeroSlides = (newSlides: HeroSlide[]) => {
    setHeroSlides(newSlides);
    safeStorage.setItem('mb_hero_slides', JSON.stringify(newSlides));
    saveHeroSlidesToCloud(newSlides);
    setHasUnpublishedChanges(false);
  };

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Sanitize: do not write un-uploaded local preview images (data: or blob:) to localStorage
      const storageSafe = { ...updated };
      if (
        storageSafe.custom_logo_url &&
        (storageSafe.custom_logo_url.startsWith('data:') || storageSafe.custom_logo_url.startsWith('blob:'))
      ) {
        delete storageSafe.custom_logo_url;
      }
      safeStorage.setItem('mb_store_settings', JSON.stringify(storageSafe));
      saveStoreSettingsToCloud(updated);
      return updated;
    });
    setHasUnpublishedChanges(false);
  };

  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      safeStorage.setItem('mb_theme_settings', JSON.stringify(updated));
      saveThemeSettingsToCloud(updated);
      return updated;
    });
    setHasUnpublishedChanges(false);
  };

  const publishCustomization = () => {
    safeStorage.setItem('mb_hero_slides', JSON.stringify(heroSlides));
    safeStorage.setItem('mb_store_settings', JSON.stringify(storeSettings));
    safeStorage.setItem('mb_theme_settings', JSON.stringify(themeSettings));
    setHasUnpublishedChanges(false);
    
    // Publish settings & slides to cloud Firestore for all devices
    publishSettingsToCloud(storeSettings, themeSettings, heroSlides);
  };

  const restoreDefaultCustomization = () => {
    setHeroSlides(initialHeroSlides);
    setStoreSettings(initialStoreSettings);
    setThemeSettings(initialThemeSettings);
    safeStorage.removeItem('mb_hero_slides');
    safeStorage.removeItem('mb_store_settings');
    safeStorage.removeItem('mb_theme_settings');
    setHasUnpublishedChanges(false);
    
    publishSettingsToCloud(initialStoreSettings, initialThemeSettings, initialHeroSlides);
  };

  // Product CRUD
  const saveProduct = (productToSave: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === productToSave.id);
      let updated: Product[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = productToSave;
      } else {
        updated = [productToSave, ...prev];
      }
      safeStorage.setItem('mb_products', JSON.stringify(updated));
      return updated;
    });
    // Persist product to cloud Firestore
    saveProductToCloud(productToSave);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      safeStorage.setItem('mb_products', JSON.stringify(updated));
      return updated;
    });
    // Delete product from cloud Firestore
    deleteProductFromCloud(productId);
  };

  // Category CRUD
  const saveCategory = (categoryToSave: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryToSave.id);
      let updated: Category[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = categoryToSave;
      } else {
        updated = [...prev, categoryToSave];
      }
      safeStorage.setItem('mb_categories', JSON.stringify(updated));
      return updated;
    });
    // Persist category to cloud Firestore
    saveCategoryToCloud(categoryToSave);
  };

  const deleteCategory = (categoryId: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== categoryId);
      safeStorage.setItem('mb_categories', JSON.stringify(updated));
      return updated;
    });
    // Delete category from cloud Firestore
    deleteCategoryFromCloud(categoryId);
  };

  // Brand CRUD
  const saveBrand = (brandToSave: Brand) => {
    setBrands((prev) => {
      const idx = prev.findIndex((b) => b.id === brandToSave.id);
      let updated: Brand[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = brandToSave;
      } else {
        updated = [...prev, brandToSave];
      }
      safeStorage.setItem('mb_brands', JSON.stringify(updated));
      return updated;
    });
    // Persist brand to cloud Firestore
    saveBrandToCloud(brandToSave);
  };

  const deleteBrand = (brandId: string) => {
    setBrands((prev) => {
      const updated = prev.filter((b) => b.id !== brandId);
      safeStorage.setItem('mb_brands', JSON.stringify(updated));
      return updated;
    });
    // Delete brand from cloud Firestore
    deleteBrandFromCloud(brandId);
  };

  // Policy and About Us modals (Overlay on single-page, no route change)
  const openPolicy = (policyKey: string) => {
    setActivePolicy(policyKey);
    setIsPoliciesModalOpen(true);
  };

  const openAboutUsModal = () => {
    setIsAboutUsModalOpen(true);
  };

  const closeAboutUsModal = () => {
    setIsAboutUsModalOpen(false);
  };

  const openPoliciesModal = (policyKey?: string) => {
    if (policyKey) {
      setActivePolicy(policyKey);
    }
    setIsPoliciesModalOpen(true);
  };

  const closePoliciesModal = () => {
    setIsPoliciesModalOpen(false);
  };

  // ================= ADMIN AUTHENTICATION & SECURITY (FIREBASE AUTH) =================
  const loginAdmin = async (
    emailOrUser: string,
    password: string,
    _rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const email = emailOrUser.trim();
    if (!email || !password) {
      return {
        success: false,
        error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
      };
    }

    if (!isFirebaseConfigured) {
      console.warn('Firebase is not configured with real credentials (placeholder apiKey detected).');
      return {
        success: false,
        error: 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق (firebase-applet-config.json أو متغيرات البيئة). يرجى التأكد من إعدادات مشروع Firebase.',
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify getIdTokenResult() and check admin authorization
      const tokenResult = await user.getIdTokenResult(true);
      if (!isUserAdminAuthorized(user, tokenResult.claims)) {
        await signOut(auth);
        return {
          success: false,
          error: 'عذراً، هذا الحساب مسجل في النظام ولكنه لا يملك صلاحيات المشرف المطلوبة. يرجى التأكد من صلاحيات الحساب أو التواصل مع مسؤولي النظام.',
        };
      }

      setAdminUser(user);
      setIsAdminAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      let errorMsg = 'تعذر تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      if (
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        (err.message && err.message.includes('api-key-not-valid'))
      ) {
        errorMsg = 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق (firebase-applet-config.json أو متغيرات البيئة). يرجى التأكد من إعدادات مشروع Firebase.';
        console.warn('Firebase Auth login warning:', errorMsg);
      } else {
        console.error('Firebase Auth login error:', err);
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-email' ||
          err.code === 'auth/operation-not-allowed'
        ) {
          errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن ميزة تسجيل الدخول بالبريد الإلكتروني غير مفعلة في مشروع Firebase.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'تم حظر محاولات الدخول مؤقتاً لأسباب أمنية لكثرة المحاولات الخاطئة. يرجى المحاولة لاحقاً.';
        } else if (err.message) {
          errorMsg = err.message;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const refreshAdminToken = async (): Promise<{ success: boolean; error?: string }> => {
    const user = auth?.currentUser;
    if (!user) {
      return { success: false, error: 'لا يوجد مستخدم مسجل حالياً.' };
    }
    try {
      const tokenResult = await user.getIdTokenResult(true);
      if (isUserAdminAuthorized(user, tokenResult.claims)) {
        setAdminUser(user);
        setIsAdminAuthenticated(true);
        return { success: true };
      } else {
        await signOut(auth);
        setAdminUser(null);
        setIsAdminAuthenticated(false);
        return {
          success: false,
          error: 'عذراً، الحساب لا يحمل صلاحيات المشرف. يرجى تسجيل الخروج والدخول مجدداً بعد التحقق من الصلاحيات.',
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر تحديث الصلاحيات.' };
    }
  };

  const logoutAdmin = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth signOut error:', err);
    }
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };

  const updateAdminPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول أولاً بحساب المشرف عبر Firebase Auth لتغيير كلمة المرور.',
      };
    }

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات وفق معايير أمان Firebase.',
      };
    }

    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق (firebase-applet-config.json أو متغيرات البيئة).',
      };
    }

    try {
      // Step 1: Strict re-authentication with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Step 2: Update password in Firebase Authentication
      await updatePassword(currentUser, newPassword);

      return { success: true };
    } catch (err: any) {
      let errorMsg = 'تعذر تحديث كلمة المرور في Firebase Auth.';
      if (
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        (err.message && err.message.includes('api-key-not-valid'))
      ) {
        errorMsg = 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق.';
        console.warn('Firebase Auth updatePassword warning:', errorMsg);
      } else {
        console.error('Firebase Auth updatePassword error:', err);
        if (
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-credential'
        ) {
          errorMsg = 'كلمة المرور الحالية غير صحيحة. يرجى التأكد من كلمة المرور الحالية والمحاولة مجدداً.';
        } else if (err.code === 'auth/weak-password') {
          errorMsg = 'كلمة المرور الجديدة ضعيفة. يرجى اختيار كلمة مرور تتكون من 6 خانات على الأقل.';
        } else if (err.code === 'auth/requires-recent-login') {
          errorMsg = 'انتهت صلاحية الجلسة الأمنية، يرجى تسجيل الخروج والدخول مجدداً ثم تغيير كلمة المرور.';
        } else if (err.message) {
          errorMsg = err.message;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const sendAdminPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني المسجل.' };
    }

    if (!isFirebaseConfigured) {
      console.warn('Firebase is not configured with real credentials (placeholder apiKey detected).');
      return {
        success: false,
        error: 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق (firebase-applet-config.json أو متغيرات البيئة). يرجى التأكد من إعدادات مشروع Firebase.',
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      let errorMsg = 'تعذر إرسال رابط استعادة كلمة المرور.';
      if (
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        (err.message && err.message.includes('api-key-not-valid'))
      ) {
        errorMsg = 'مفتاح API الخاص بـ Firebase (apiKey) غير صالح أو لم يتم ضبطه في إعدادات التطبيق (firebase-applet-config.json أو متغيرات البيئة). يرجى التأكد من إعدادات مشروع Firebase.';
        console.warn('Firebase Auth sendPasswordResetEmail warning:', errorMsg);
      } else {
        console.error('Firebase Auth sendPasswordResetEmail error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          errorMsg = 'البريد الإلكتروني المدخل غير مسجل في Firebase Auth أو بصيغة غير صحيحة.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'تم حظر طلبات الاستعادة مؤقتاً لأسباب أمنية. يرجى المحاولة لاحقاً.';
        } else if (err.message) {
          errorMsg = err.message;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const recoverAdminPassword = async (params: {
    identifier: string;
    securityAnswer?: string;
    recoveryPin?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    return sendAdminPasswordReset(params.identifier);
  };

  return (
    <StoreContext.Provider
      value={{
        adminUser,
        adminCredentials,
        isAdminAuthenticated,
        isFirebaseConfigured,
        isInitialLoading,
        initialSyncError,
        loginAdmin,
        logoutAdmin,
        recoverAdminPassword,
        updateAdminPassword,
        sendAdminPasswordReset,
        refreshAdminToken,

        categories,
        brands,
        products,
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,

        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        lastAddedNotification,
        clearLastAddedNotification,

        wishlist,
        toggleWishlist,
        isInWishlist,

        deliveryMethods,
        paymentMethods,

        orders,
        currentOrder,
        createOrder,
        updateOrderStatus,
        updateOrderAdminNotes,
        verifyBankTransferReceipt,
        addManualOrder,

        heroSlides,
        updateHeroSlides,
        storeSettings,
        updateStoreSettings,
        themeSettings,
        updateThemeSettings,
        publishCustomization,
        hasUnpublishedChanges,
        restoreDefaultCustomization,

        activeView,
        setActiveView,
        activePolicy,
        openPolicy,
        isAboutUsModalOpen,
        setIsAboutUsModalOpen,
        openAboutUsModal,
        closeAboutUsModal,
        isPoliciesModalOpen,
        setIsPoliciesModalOpen,
        openPoliciesModal,
        closePoliciesModal,

        saveProduct,
        deleteProduct,
        saveCategory,
        deleteCategory,
        saveBrand,
        deleteBrand,

        language,
        setLanguage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
