import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { HeroSeamlessCarousel } from './components/HeroSeamlessCarousel';
import { TrustBadges } from './components/TrustBadges';
import { CategoryBar } from './components/CategoryBar';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { OrderSuccessView } from './components/OrderSuccessView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { WishlistView } from './components/WishlistView';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { BottomNav } from './components/BottomNav';
import { CartNotificationToast } from './components/CartNotificationToast';
import { AboutUsModal } from './components/AboutUsModal';
import { PoliciesModal } from './components/PoliciesModal';

const MainLayout: React.FC = () => {
  const {
    activeView,
    isAboutUsModalOpen,
    closeAboutUsModal,
    isPoliciesModalOpen,
    closePoliciesModal,
    activePolicy,
  } = useStore();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeView]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F3] text-[#2F2B28] antialiased selection:bg-[#E7D4BC] selection:text-[#6F584A]">
      {/* Global Header with Single-Line Seamless Infinite Marquee & Burger Drawer */}
      <Header />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'store' && (
          <>
            <HeroSeamlessCarousel />
            <TrustBadges />
            <CategoryBar />
            <ProductGrid />
          </>
        )}

        {activeView === 'wishlist' && <WishlistView />}

        {activeView === 'checkout' && <CheckoutView />}

        {activeView === 'order-success' && <OrderSuccessView />}

        {activeView === 'track-order' && <OrderTrackingView />}

        {activeView === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Footer (Redesigned with Contact details, Links, Commitments, & Mobile-safe padding) */}
      <Footer />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Drawers, Modals & Floating WhatsApp */}
      <ErrorBoundary fallback={null}>
        <CartDrawer />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <ProductDetailModal />
      </ErrorBoundary>
      <AboutUsModal
        isOpen={isAboutUsModalOpen}
        onClose={closeAboutUsModal}
      />
      <PoliciesModal
        isOpen={isPoliciesModalOpen}
        onClose={closePoliciesModal}
        selectedPolicyKey={activePolicy}
      />
      <CartNotificationToast />
      <FloatingWhatsApp />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainLayout />
      </StoreProvider>
      <Analytics />
    </ErrorBoundary>
  );
}

