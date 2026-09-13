import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from '../firebase';
import {
  Product,
  Category,
  Brand,
  Order,
  StoreSettings,
  ThemeSettings,
  HeroSlide,
} from '../types';
import {
  initialCategories,
  initialBrands,
  initialProducts,
  initialHeroSlides,
  initialStoreSettings,
  initialThemeSettings,
} from '../data/initialData';

export interface CloudOperationResult {
  success: boolean;
  error?: string;
}

function formatFirestoreError(error: any, fallback: string): string {
  if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded') || error?.message?.includes('resource-exhausted')) {
    return 'تم بلوغ الحصة اليومية المجانية لقاعدة البيانات مؤقتاً. تم حفظ العملية محلياً بنجاح.';
  }
  if (error?.code === 'permission-denied') {
    return 'ليس لديك صلاحية لتنفيذ هذا الإجراء على قاعدة البيانات.';
  }
  if (error?.code === 'unavailable') {
    return 'تعذر الاتصال بالسحابة حالياً، تم تطبيق التعديل محلياً.';
  }
  return error?.message || fallback;
}

// Flag to avoid concurrent seeding runs
let isSeeding = false;

/**
 * Admin-only protected seeding process.
 * Explicitly inspects each document before creation so no existing data is ever overwritten.
 * Never called automatically on guest visitors.
 */
export async function seedInitialFirestoreData(): Promise<CloudOperationResult> {
  if (isSeeding) return { success: false, error: 'التهيئة جارية بالفعل' };
  isSeeding = true;

  try {
    const batch = writeBatch(db);
    let writesCount = 0;

    // 1. Seed Categories if missing
    for (const cat of initialCategories) {
      const catRef = doc(db, 'categories', cat.id);
      const snap = await getDoc(catRef);
      if (!snap.exists()) {
        batch.set(catRef, cat);
        writesCount++;
      }
    }

    // 2. Seed Brands if missing
    for (const brand of initialBrands) {
      const brandRef = doc(db, 'brands', brand.id);
      const snap = await getDoc(brandRef);
      if (!snap.exists()) {
        batch.set(brandRef, brand);
        writesCount++;
      }
    }

    // 3. Seed Products if missing
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'products', prod.id);
      const snap = await getDoc(prodRef);
      if (!snap.exists()) {
        batch.set(prodRef, prod);
        writesCount++;
      }
    }

    // 4. Seed Hero Slides in unified collection if missing
    for (const slide of initialHeroSlides) {
      const slideRef = doc(db, 'hero_slides', slide.id);
      const snap = await getDoc(slideRef);
      if (!snap.exists()) {
        batch.set(slideRef, slide);
        writesCount++;
      }
    }

    // 5. Seed General Store Settings if missing
    const generalRef = doc(db, 'store_settings', 'general');
    const generalSnap = await getDoc(generalRef);
    if (!generalSnap.exists()) {
      batch.set(generalRef, {
        storeSettings: initialStoreSettings,
        updated_at: new Date().toISOString(),
      });
      writesCount++;
    }

    // 6. Seed Theme Settings if missing
    const themeRef = doc(db, 'store_settings', 'theme');
    const themeSnap = await getDoc(themeRef);
    if (!themeSnap.exists()) {
      batch.set(themeRef, {
        themeSettings: initialThemeSettings,
        updated_at: new Date().toISOString(),
      });
      writesCount++;
    }

    if (writesCount > 0) {
      await batch.commit();
      console.log(`✅ Completed selective Firestore seeding: ${writesCount} documents written.`);
    } else {
      console.log('ℹ️ Firestore already populated; skipped seeding without touching documents.');
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Firestore seeding notice:', formatFirestoreError(error, 'تنبيه في تهيئة السحابة'));
    return {
      success: false,
      error: formatFirestoreError(error, 'فشلت عملية تهيئة البيانات السحابية'),
    };
  } finally {
    isSeeding = false;
  }
}

// ================= Real-time Listeners =================

/**
 * Real-time Products listener.
 * Empty collections are treated as valid empty states (e.g. admin cleared products).
 */
export function listenToProducts(
  callback: (products: Product[]) => void,
  onError?: (error: any) => void
) {
  try {
    const productsRef = collection(db, 'products');
    return onSnapshot(
      productsRef,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Product);
        });
        list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        callback(list);
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Products sync snapshot notice:', error?.message);
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time Categories listener.
 */
export function listenToCategories(
  callback: (categories: Category[]) => void,
  onError?: (error: any) => void
) {
  try {
    const categoriesRef = collection(db, 'categories');
    return onSnapshot(
      categoriesRef,
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Category);
        });
        list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        callback(list);
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Categories sync snapshot notice:', error?.message);
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time Brands listener.
 */
export function listenToBrands(
  callback: (brands: Brand[]) => void,
  onError?: (error: any) => void
) {
  try {
    const brandsRef = collection(db, 'brands');
    return onSnapshot(
      brandsRef,
      (snapshot) => {
        const list: Brand[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Brand);
        });
        list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        callback(list);
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Brands sync snapshot notice:', error?.message);
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time Orders listener.
 */
export function listenToOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: any) => void
) {
  try {
    const ordersRef = collection(db, 'orders');
    return onSnapshot(
      ordersRef,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Order);
        });
        list.sort((a, b) => {
          const tA = new Date(a.placed_at || a.created_at).getTime();
          const tB = new Date(b.placed_at || b.created_at).getTime();
          return tB - tA;
        });
        callback(list);
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Orders sync snapshot notice:', error?.message);
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time Store Settings & Theme listener.
 */
export function listenToStoreSettings(
  callback: (data: {
    storeSettings?: StoreSettings;
    themeSettings?: ThemeSettings;
  }) => void,
  onError?: (error: any) => void
) {
  try {
    const generalRef = doc(db, 'store_settings', 'general');
    const themeRef = doc(db, 'store_settings', 'theme');

    let currentStore: StoreSettings | undefined;
    let currentTheme: ThemeSettings | undefined;

    const notify = () => {
      callback({
        storeSettings: currentStore,
        themeSettings: currentTheme,
      });
    };

    const unsubGeneral = onSnapshot(
      generalRef,
      (docSnap) => {
        if (docSnap.exists()) {
          currentStore = docSnap.data().storeSettings;
        }
        notify();
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('General settings sync notice:', error?.message);
        }
        if (onError) onError(error);
        notify();
      }
    );

    const unsubTheme = onSnapshot(
      themeRef,
      (docSnap) => {
        if (docSnap.exists()) {
          currentTheme = docSnap.data().themeSettings;
        }
        notify();
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Theme settings sync notice:', error?.message);
        }
        if (onError) onError(error);
        notify();
      }
    );

    return () => {
      unsubGeneral();
      unsubTheme();
    };
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Real-time Unified Hero Slides listener.
 * Reads ONLY from 'hero_slides' collection to avoid competing sources or size overflows.
 */
export function listenToHeroSlides(
  callback: (slides: HeroSlide[]) => void,
  onError?: (error: any) => void
) {
  try {
    const heroRef = collection(db, 'hero_slides');
    return onSnapshot(
      heroRef,
      (snapshot) => {
        const list: HeroSlide[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as HeroSlide);
        });
        list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        callback(list);
      },
      (error) => {
        if (error?.code !== 'resource-exhausted') {
          console.warn('Hero slides sync notice:', error?.message);
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

// ================= Cloud Mutation Operations with Explicit Return =================

const STORAGE_SETUP_REQUIRED_MESSAGE =
  'تم اختيار الصورة ومعاينتها، لكن يلزم إعداد خدمة التخزين قبل الحفظ النهائي';

function hasUnuploadedLocalImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  return clean.startsWith('data:') || clean.startsWith('blob:');
}

export async function saveProductToCloud(product: Product): Promise<CloudOperationResult> {
  try {
    // Strict Guard: Never persist Base64 or local blob images to Firestore
    const hasUnuploadedImage =
      product.images?.some((img) => hasUnuploadedLocalImage(img.path)) ||
      product.variants?.some((v) => hasUnuploadedLocalImage(v.image_path));

    if (hasUnuploadedImage) {
      return {
        success: false,
        error: STORAGE_SETUP_REQUIRED_MESSAGE,
      };
    }

    const cleanProduct = JSON.parse(JSON.stringify(product));
    const prodDoc = doc(db, 'products', product.id);
    await setDoc(prodDoc, cleanProduct, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ المنتج في قاعدة البيانات') };
  }
}

export async function deleteProductFromCloud(productId: string): Promise<CloudOperationResult> {
  try {
    const prodDoc = doc(db, 'products', productId);
    await deleteDoc(prodDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حذف المنتج من قاعدة البيانات') };
  }
}

export async function saveCategoryToCloud(category: Category): Promise<CloudOperationResult> {
  try {
    if (hasUnuploadedLocalImage(category.image_path)) {
      return {
        success: false,
        error: STORAGE_SETUP_REQUIRED_MESSAGE,
      };
    }

    const cleanCat = JSON.parse(JSON.stringify(category));
    const catDoc = doc(db, 'categories', category.id);
    await setDoc(catDoc, cleanCat, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ التصنيف في قاعدة البيانات') };
  }
}

export async function deleteCategoryFromCloud(categoryId: string): Promise<CloudOperationResult> {
  try {
    const catDoc = doc(db, 'categories', categoryId);
    await deleteDoc(catDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حذف التصنيف من قاعدة البيانات') };
  }
}

export async function saveBrandToCloud(brand: Brand): Promise<CloudOperationResult> {
  try {
    if (hasUnuploadedLocalImage(brand.logo_path)) {
      return {
        success: false,
        error: STORAGE_SETUP_REQUIRED_MESSAGE,
      };
    }

    const cleanBrand = JSON.parse(JSON.stringify(brand));
    const brandDoc = doc(db, 'brands', brand.id);
    await setDoc(brandDoc, cleanBrand, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ الماركة في قاعدة البيانات') };
  }
}

export async function deleteBrandFromCloud(brandId: string): Promise<CloudOperationResult> {
  try {
    const brandDoc = doc(db, 'brands', brandId);
    await deleteDoc(brandDoc);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حذف الماركة من قاعدة البيانات') };
  }
}

export async function saveOrderToCloud(order: Order): Promise<CloudOperationResult> {
  try {
    const cleanOrder = JSON.parse(JSON.stringify(order));
    // Guard: Strip raw Base64 data from order payload before writing to Firestore
    if (hasUnuploadedLocalImage(cleanOrder.bank_receipt_url)) {
      delete cleanOrder.bank_receipt_url;
    }
    const orderDoc = doc(db, 'orders', order.id);
    await setDoc(orderDoc, cleanOrder, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل إرسال الطلب وحفظه في قاعدة البيانات') };
  }
}

export async function updateOrderInCloud(orderId: string, updates: Partial<Order>): Promise<CloudOperationResult> {
  try {
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    if (hasUnuploadedLocalImage(cleanUpdates.bank_receipt_url)) {
      delete cleanUpdates.bank_receipt_url;
    }
    const orderDoc = doc(db, 'orders', orderId);
    await updateDoc(orderDoc, cleanUpdates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل تحديث بيانات الطلب') };
  }
}

/**
 * Unify Hero Slides persistence exclusively in 'hero_slides' collection
 */
export async function saveHeroSlidesToCloud(heroSlides: HeroSlide[]): Promise<CloudOperationResult> {
  try {
    // Check if any slide has an un-uploaded local image
    const hasUnuploaded = heroSlides.some(
      (slide) =>
        hasUnuploadedLocalImage(slide.desktop_image) ||
        hasUnuploadedLocalImage(slide.mobile_image) ||
        hasUnuploadedLocalImage(slide.background_image)
    );

    if (hasUnuploaded) {
      return {
        success: false,
        error: STORAGE_SETUP_REQUIRED_MESSAGE,
      };
    }

    const cleanSlides: HeroSlide[] = JSON.parse(JSON.stringify(heroSlides));

    // 1. Write current slides
    const writePromises = cleanSlides.map((slide) => {
      const slideDoc = doc(db, 'hero_slides', slide.id);
      return setDoc(slideDoc, slide, { merge: true });
    });
    await Promise.all(writePromises);

    // 2. Clean up removed slides from Firestore
    try {
      const snap = await getDocs(collection(db, 'hero_slides'));
      const activeIds = new Set(heroSlides.map((s) => s.id));
      const deletePromises: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        if (!activeIds.has(docSnap.id)) {
          deletePromises.push(deleteDoc(docSnap.ref));
        }
      });
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }
    } catch (cleanErr) {
      // Ignore background delete errors
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ شرائح الهيرو في قاعدة البيانات') };
  }
}

export async function saveStoreSettingsToCloud(storeSettings: Partial<StoreSettings>): Promise<CloudOperationResult> {
  try {
    if (hasUnuploadedLocalImage(storeSettings.custom_logo_url)) {
      return {
        success: false,
        error: STORAGE_SETUP_REQUIRED_MESSAGE,
      };
    }

    const generalDoc = doc(db, 'store_settings', 'general');
    await setDoc(
      generalDoc,
      {
        storeSettings: JSON.parse(JSON.stringify(storeSettings)),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ إعدادات المتجر') };
  }
}

export async function saveThemeSettingsToCloud(themeSettings: Partial<ThemeSettings>): Promise<CloudOperationResult> {
  try {
    const themeDoc = doc(db, 'store_settings', 'theme');
    await setDoc(
      themeDoc,
      {
        themeSettings: JSON.parse(JSON.stringify(themeSettings)),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل حفظ تخصيص المظهر') };
  }
}

export async function publishSettingsToCloud(
  storeSettings: StoreSettings,
  themeSettings: ThemeSettings,
  heroSlides: HeroSlide[]
): Promise<CloudOperationResult> {
  try {
    const results = await Promise.all([
      saveStoreSettingsToCloud(storeSettings),
      saveThemeSettingsToCloud(themeSettings),
      saveHeroSlidesToCloud(heroSlides),
    ]);

    const failed = results.find((r) => !r.success);
    if (failed) {
      return failed;
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatFirestoreError(error, 'فشل نشر التعديلات سحابياً') };
  }
}
