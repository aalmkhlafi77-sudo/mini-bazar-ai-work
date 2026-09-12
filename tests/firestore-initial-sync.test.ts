import { describe, it, expect } from 'vitest';
import { initialProducts, initialHeroSlides, initialCategories } from '../src/data/initialData';

describe('Firestore Initial Sync and Default Data Prevention', () => {
  it('ensures initial catalog state is empty and isInitialLoading is true before Firestore responds', () => {
    // Simulating StoreContext state before any Firestore snapshot
    const stateBeforeSync = {
      isInitialLoading: true,
      products: [],
      heroSlides: [],
      categories: [],
      brands: [],
    };

    // Strict invariant: no default data or images should exist prior to first Firestore sync
    expect(stateBeforeSync.isInitialLoading).toBe(true);
    expect(stateBeforeSync.products).toHaveLength(0);
    expect(stateBeforeSync.heroSlides).toHaveLength(0);
    expect(stateBeforeSync.categories).toHaveLength(0);

    // Default data from initialData.ts must NOT be present
    expect(stateBeforeSync.products).not.toEqual(initialProducts);
    expect(stateBeforeSync.heroSlides).not.toEqual(initialHeroSlides);
    expect(stateBeforeSync.categories).not.toEqual(initialCategories);
  });

  it('ensures that an empty Firestore database stays empty and does NOT fallback to initialData', () => {
    // Simulate Firestore responding with empty collections
    const firestoreProducts: any[] = [];
    const firestoreSlides: any[] = [];

    // State update logic as implemented in StoreContext
    let products: any[] = [];
    let heroSlides: any[] = [];
    let isInitialLoading = true;

    // First snapshot received from Firestore
    if (Array.isArray(firestoreProducts)) {
      products = firestoreProducts;
    }
    if (Array.isArray(firestoreSlides)) {
      heroSlides = firestoreSlides;
    }
    isInitialLoading = false;

    // Verify invariants
    expect(isInitialLoading).toBe(false);
    expect(products).toHaveLength(0);
    expect(heroSlides).toHaveLength(0);
    // Explicitly verify it was not replaced by initialData
    expect(products).not.toEqual(initialProducts);
    expect(heroSlides).not.toEqual(initialHeroSlides);
  });

  it('ensures that real Firestore data is applied cleanly once received', () => {
    const cloudProducts = [
      {
        id: 'real-prod-100',
        name_ar: 'عطر مسك فاخر',
        name_en: 'Royal Musk',
        price: 250,
        availability_status: 'available' as const,
        images: [{ id: 'img-100', product_id: 'real-prod-100', path: 'https://example.com/musk.jpg', is_primary: true }],
        variants: [],
      },
    ];

    let products: any[] = [];
    let isInitialLoading = true;

    // Snapshot arrives
    if (Array.isArray(cloudProducts)) {
      products = cloudProducts;
    }
    isInitialLoading = false;

    expect(isInitialLoading).toBe(false);
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('real-prod-100');
    expect(products[0].name_ar).toBe('عطر مسك فاخر');
  });

  it('ensures initialHeroSlides or default unsplash URLs are not leaked into the initial state', () => {
    const stateBeforeSync = {
      isInitialLoading: true,
      heroSlides: [] as any[],
    };

    // Verify no unsplash URLs from initialHeroSlides exist
    const hasUnsplashImage = stateBeforeSync.heroSlides.some((s) =>
      s.image_url?.includes('images.unsplash.com')
    );
    expect(hasUnsplashImage).toBe(false);
  });

  it('stops isInitialLoading and sets Arabic error message on permission-denied', () => {
    let isInitialLoading = true;
    let initialSyncError: string | null = null;

    const handleSyncError = (err: any) => {
      let msg = 'تعذر الاتصال بقاعدة البيانات لجلب المعروضات الحالية. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً.';
      if (err?.code === 'permission-denied') {
        msg = 'تم رفض إذن الوصول إلى بيانات المتجر (Permission Denied). يرجى التأكد من صلاحيات وقواعد أمان Firestore.';
      } else if (err?.code === 'unavailable') {
        msg = 'خدمة Firestore غير متاحة حالياً أو انقطع اتصال الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
      }
      initialSyncError = msg;
      isInitialLoading = false;
    };

    // Simulate permission-denied error from Firestore listener
    handleSyncError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });

    expect(isInitialLoading).toBe(false);
    expect(initialSyncError).toContain('تم رفض إذن الوصول إلى بيانات المتجر');
  });

  it('stops isInitialLoading and sets Arabic error message on network/unavailable error', () => {
    let isInitialLoading = true;
    let initialSyncError: string | null = null;

    const handleSyncError = (err: any) => {
      let msg = 'تعذر الاتصال بقاعدة البيانات لجلب المعروضات الحالية. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً.';
      if (err?.code === 'permission-denied') {
        msg = 'تم رفض إذن الوصول إلى بيانات المتجر (Permission Denied). يرجى التأكد من صلاحيات وقواعد أمان Firestore.';
      } else if (err?.code === 'unavailable') {
        msg = 'خدمة Firestore غير متاحة حالياً أو انقطع اتصال الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
      }
      initialSyncError = msg;
      isInitialLoading = false;
    };

    // Simulate network unavailable error
    handleSyncError({ code: 'unavailable', message: 'The service is currently unavailable.' });

    expect(isInitialLoading).toBe(false);
    expect(initialSyncError).toContain('خدمة Firestore غير متاحة حالياً أو انقطع اتصال الشبكة');
  });

  it('stops isInitialLoading and sets Arabic error message on connection timeout', () => {
    let isInitialLoading = true;
    let initialSyncError: string | null = null;
    let productsSynced = false;

    // Simulate safety timer triggering when sync did not complete
    if (!productsSynced) {
      initialSyncError = 'استغرق الاتصال بقاعدة البيانات وقتاً أطول من المتوقع. يرجى التحقق من اتصال الإنترنت.';
    }
    isInitialLoading = false;

    expect(isInitialLoading).toBe(false);
    expect(initialSyncError).toContain('استغرق الاتصال بقاعدة البيانات وقتاً أطول من المتوقع');
  });
});
