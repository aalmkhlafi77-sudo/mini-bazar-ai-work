import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Sliders,
  Sparkles,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  FileText,
  Printer,
  Eye,
  RotateCcw,
  Save,
  MessageCircle,
  ChevronDown,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  Layers,
  X,
  ShieldCheck,
  LogOut,
  User,
  KeyRound,
  Award,
  Download,
  Camera,
  FileCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Filter,
  Calendar,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Product, HeroSlide } from '../types';
import { OrderProgressTimeline } from './OrderProgressTimeline';
import { CategoryManager } from './admin/CategoryManager';
import { BrandManager } from './admin/BrandManager';
import { ProductModal } from './admin/ProductModal';
import { LogoCustomizer } from './admin/LogoCustomizer';
import { AnnouncementSettingsManager } from './admin/AnnouncementSettingsManager';
import { FooterSettingsManager } from './admin/FooterSettingsManager';
import { HeroSlideModal } from './admin/HeroSlideModal';
import { CategoryCarouselManager } from './admin/CategoryCarouselManager';
import { ImageUploader } from './ImageUploader';
import { AdminLoginView } from './admin/AdminLoginView';
import { AdminSecuritySettings } from './admin/AdminSecuritySettings';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminUser,
    adminCredentials,
    logoutAdmin,
    orders,
    products,
    categories,
    brands,
    updateOrderStatus,
    verifyBankTransferReceipt,
    addManualOrder,
    saveProduct,
    deleteProduct,
    heroSlides,
    updateHeroSlides,
    storeSettings,
    updateStoreSettings,
    themeSettings,
    updateThemeSettings,
    publishCustomization,
    hasUnpublishedChanges,
    restoreDefaultCustomization,
    setActiveView,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'brands' | 'customize' | 'security'>('overview');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState('all');
  const [orderCityFilter, setOrderCityFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'last7days' | 'thisMonth'>('all');
  const [showOrderReportsModal, setShowOrderReportsModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [newStatusToApply, setNewStatusToApply] = useState<OrderStatus>('confirmed');

  // Bank Transfer Receipt verification states
  const [adminReceiptPreviewModal, setAdminReceiptPreviewModal] = useState<string | null>(null);
  const [adminVerificationNote, setAdminVerificationNote] = useState('');
  const [adminReceiptZoom, setAdminReceiptZoom] = useState(1);
  const [adminReceiptRotation, setAdminReceiptRotation] = useState(0);

  // Manual WhatsApp Order Modal
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCity, setManualCity] = useState('الرياض');
  const [manualDistrict, setManualDistrict] = useState('');
  const [manualSelectedProductId, setManualSelectedProductId] = useState(products[0]?.id || '');
  const [manualPrice, setManualPrice] = useState(products[0]?.price || 350);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Edit Slide Modal
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);

  // Success toast
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Stats calculation
  const totalRevenue = orders.reduce((acc, o) => acc + o.grand_total, 0);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const activeProductsCount = products.filter((p) => p.is_active).length;

  const handleUpdateStatus = () => {
    if (!selectedOrderForDetail) return;
    updateOrderStatus(selectedOrderForDetail.id, newStatusToApply, statusChangeNote);
    setStatusChangeNote('');
    setSelectedOrderForDetail((prev) => (prev ? { ...prev, status: newStatusToApply } : null));
    triggerToast();
  };

  const handleVerifyBankTransfer = (orderId: string, verified: boolean) => {
    verifyBankTransferReceipt(orderId, verified, adminVerificationNote);
    if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
      setSelectedOrderForDetail((prev) =>
        prev
          ? {
              ...prev,
              bank_transfer_verified: verified,
              bank_transfer_verified_at: verified ? new Date().toISOString() : undefined,
              bank_transfer_notes: adminVerificationNote || prev.bank_transfer_notes,
              status: verified && prev.status === 'new' ? 'confirmed' : prev.status,
            }
          : null
      );
    }
    setAdminVerificationNote('');
    triggerToast();
  };

  const handleDownloadReceipt = (receiptBase64: string, orderNumber: string) => {
    const link = document.createElement('a');
    link.href = receiptBase64;
    link.download = `Receipt-${orderNumber}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintOrderReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = order.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: right;">${it.product_name_snapshot} ${it.variant_name_snapshot ? `(${it.variant_name_snapshot})` : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: left;" dir="ltr">${it.unit_price} ر.س</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: left; font-weight: bold;" dir="ltr">${it.line_total} ر.س</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال طلب رقم ${order.order_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body {
            font-family: 'Cairo', Tahoma, Arial, sans-serif;
            color: #2F2B28;
            background: #fff;
            padding: 30px;
            margin: 0;
            direction: rtl;
            text-align: right;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #E5D8C9;
            border-radius: 16px;
            padding: 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E5D8C9;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2F2B28;
          }
          .order-badge {
            background: #F7F1E8;
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #F4ECE2;
            padding: 10px;
            text-align: right;
            font-size: 13px;
          }
          .totals {
            margin-top: 20px;
            border-top: 1px solid #E5D8C9;
            padding-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #6F584A;
            border-top: 2px solid #2F2B28;
            padding-top: 10px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #7C736D;
            border-top: 1px dashed #E5D8C9;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div>
              <div class="logo">ميني بازار | Mini Bazaar</div>
              <div style="font-size: 12px; color: #7C736D; margin-top: 4px;">متجرك الأول للأزياء والإكسسوارات الفاخرة</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 14px; font-weight: bold; color: #607866;">حالة الطلب: ${order.status}</div>
              <div style="font-size: 12px; color: #7C736D; margin-top: 4px;">التاريخ: ${new Date(order.placed_at).toLocaleDateString('ar-SA')}</div>
            </div>
          </div>

          <div class="order-badge">
            <div>
              <span style="font-size: 11px; color: #8A7465; display: block; margin-bottom: 2px;">رقم الطلب المرجعي:</span>
              <span style="font-size: 22px; font-weight: bold; font-family: monospace;" dir="ltr">${order.order_number}</span>
            </div>
            <div style="text-align: left; font-size: 12px; color: #5F5751;">
              <div>طريقة الدفع: <strong>${order.payment_method_snapshot.name_ar}</strong></div>
              <div>طريقة التوصيل: <strong>${order.delivery_method_snapshot.name_ar}</strong></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; font-size: 13px; background: #FBF8F3; padding: 15px; border-radius: 12px;">
            <div>
              <strong>بيانات العميل:</strong><br>
              ${order.customer_name_snapshot}<br>
              <span dir="ltr">${order.customer_phone_snapshot}</span>
            </div>
            <div>
              <strong>عنوان التسليم:</strong><br>
              ${order.address_snapshot.city}، ${order.address_snapshot.district}<br>
              ${order.address_snapshot.street || ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج / الصنف</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">السعر الفردي</th>
                <th style="text-align: left;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>مجموع المنتجات:</span>
              <span dir="ltr">${order.subtotal} ر.س</span>
            </div>
            <div class="total-row">
              <span>رسوم التوصيل:</span>
              <span dir="ltr">${order.delivery_fee} ر.س</span>
            </div>
            ${
              order.discount_total > 0
                ? `<div class="total-row" style="color: #607866;">
                     <span>الخصم المطبق:</span>
                     <span dir="ltr">-${order.discount_total} ر.س</span>
                   </div>`
                : ''
            }
            <div class="total-row grand-total">
              <span>المجموع الإجمالي:</span>
              <span dir="ltr">${order.grand_total} ر.س</span>
            </div>
          </div>

          <div class="footer">
            <p>مؤسسة ميني بازار التجارية | إيصال رسمي للإدارة والعميل</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleRequestReceiptWhatsApp = (order: Order) => {
    const cleanPhone = order.customer_phone_snapshot.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `مرحباً ${order.customer_name_snapshot}، نرجو التكرم بإرسال صورة إشعار الحوالة البنكية للطلب رقم (${order.order_number}) بمبلغ ${order.grand_total} ر.س لاعتماد الشحن والمطابقة البنكية فوراً.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const triggerToast = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenProduct = products.find((p) => p.id === manualSelectedProductId) || products[0];

    addManualOrder({
      customer_name_snapshot: manualCustomerName,
      customer_phone_snapshot: manualCustomerPhone,
      address_snapshot: {
        country: 'المملكة العربية السعودية',
        city: manualCity,
        district: manualDistrict || 'وسط المدينة',
        street: 'شارع عام',
      },
      subtotal: Number(manualPrice),
      delivery_fee: 35,
      items: [
        {
          product_id: chosenProduct.id,
          product_name_snapshot: chosenProduct.name_ar,
          sku_snapshot: chosenProduct.sku,
          unit_price: Number(manualPrice),
          quantity: 1,
          line_total: Number(manualPrice),
          image_snapshot: chosenProduct.images[0]?.path,
        },
      ],
    });

    setIsManualOrderModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    triggerToast();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">جديد</span>;
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">مؤكد</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">قيد التجهيز</span>;
      case 'out_for_delivery':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">خرج للتوصيل</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">تم التسليم</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">ملغي</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Derived unique options for multi-filters
  const availableCities = Array.from(
    new Set(orders.map((o) => o.address_snapshot?.city).filter(Boolean))
  );

  const availablePaymentTypes = Array.from(
    new Set(orders.map((o) => o.payment_method_snapshot?.name_ar).filter(Boolean))
  );

  const availableDeliveryMethods = Array.from(
    new Set(orders.map((o) => o.delivery_method_snapshot?.name_ar).filter(Boolean))
  );

  const outForDeliveryCount = orders.filter((o) => o.status === 'out_for_delivery').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const filteredOrders = orders.filter((o) => {
    // 1. Status Filter
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
      return false;
    }

    // 2. Payment Method Filter
    if (orderPaymentFilter !== 'all' && o.payment_method_snapshot.name_ar !== orderPaymentFilter) {
      return false;
    }

    // 3. Delivery Method Filter
    if (orderDeliveryFilter !== 'all' && o.delivery_method_snapshot.name_ar !== orderDeliveryFilter) {
      return false;
    }

    // 4. City Filter
    if (orderCityFilter !== 'all' && o.address_snapshot.city !== orderCityFilter) {
      return false;
    }

    // 5. Date Filter
    if (orderDateFilter !== 'all') {
      const dateVal = new Date(o.created_at || o.placed_at);
      const now = new Date();
      if (orderDateFilter === 'today') {
        if (dateVal.toDateString() !== now.toDateString()) return false;
      } else if (orderDateFilter === 'last7days') {
        const diffTime = now.getTime() - dateVal.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (orderDateFilter === 'thisMonth') {
        if (dateVal.getMonth() !== now.getMonth() || dateVal.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
    }

    // 6. Search Query
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchOrderNum = o.order_number.toLowerCase().includes(q);
      const matchName = o.customer_name_snapshot.toLowerCase().includes(q);
      const matchPhone = o.customer_phone_snapshot.includes(q);
      const matchCity = o.address_snapshot.city.toLowerCase().includes(q);
      if (!matchOrderNum && !matchName && !matchPhone && !matchCity) {
        return false;
      }
    }

    return true;
  });

  const filteredTotalRevenue = filteredOrders.reduce((acc, o) => acc + o.grand_total, 0);

  // 1. Download single order receipt as a structured file
  const handleDownloadOrderReceipt = (order: Order) => {
    const itemsText = order.items
      .map(
        (it) =>
          `• ${it.product_name_snapshot} ${it.variant_name_snapshot ? `[${it.variant_name_snapshot}]` : ''} | الكمية: ${it.quantity} | السعر: ${it.unit_price} ر.س | المجموع: ${it.line_total} ر.س`
      )
      .join('\r\n');

    const content = `========================================================
ميني بازار | MINI BAZAAR - إيصال وتفاصيل طلب رسمي
========================================================
رقم الطلب: ${order.order_number}
تاريخ الإنشاء: ${new Date(order.created_at || order.placed_at).toLocaleString('ar-SA')}
حالة الطلب: ${
      order.status === 'new'
        ? 'جديد'
        : order.status === 'confirmed'
        ? 'مؤكد'
        : order.status === 'preparing'
        ? 'قيد التجهيز'
        : order.status === 'out_for_delivery'
        ? 'خرج للتوصيل'
        : order.status === 'delivered'
        ? 'تم التسليم'
        : 'ملغي'
    }
--------------------------------------------------------
بيانات العميل:
الاسم: ${order.customer_name_snapshot}
رقم الجوال: ${order.customer_phone_snapshot}
${order.customer_email_snapshot ? `البريد الإلكتروني: ${order.customer_email_snapshot}\r\n` : ''}
عنوان التوصيل:
المدينة: ${order.address_snapshot.city}
الحي: ${order.address_snapshot.district}
الشارع: ${order.address_snapshot.street || ''}
${order.customer_notes ? `ملاحظات العميل: ${order.customer_notes}\r\n` : ''}
--------------------------------------------------------
المنتجات والمقتنيات المشمولة:
${itemsText}
--------------------------------------------------------
المجموع الفرعي: ${order.subtotal} ر.س
رسوم التوصيل: ${order.delivery_fee} ر.س
${order.discount_total ? `الخصم المطبق: -${order.discount_total} ر.س\r\n` : ''}المجموع الإجمالي: ${order.grand_total} ر.س

طريقة الدفع: ${order.payment_method_snapshot.name_ar}
طريقة التوصيل: ${order.delivery_method_snapshot.name_ar}
========================================================
تم استخراج هذا الإشعار من لوحة إدارة ميني بازار
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MiniBazaar_Order_${order.order_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export filtered orders to CSV for Excel/Sheets
  const handleExportOrdersCSV = (ordersToExport: Order[] = filteredOrders) => {
    const headers = [
      'رقم الطلب',
      'تاريخ الإنشاء والطلب',
      'اسم العميل',
      'رقم الجوال',
      'المدينة',
      'الحي',
      'عدد المنتجات',
      'طريقة الدفع',
      'طريقة التوصيل',
      'حالة الطلب',
      'المجموع الإجمالي (ر.س)',
    ];

    const getStatusText = (st: OrderStatus) => {
      switch (st) {
        case 'new': return 'جديد';
        case 'confirmed': return 'مؤكد';
        case 'preparing': return 'قيد التجهيز';
        case 'out_for_delivery': return 'خرج للتوصيل';
        case 'delivered': return 'تم التسليم';
        case 'cancelled': return 'ملغي';
        default: return st;
      }
    };

    const rows = ordersToExport.map((ord) => [
      `"${ord.order_number}"`,
      `"${new Date(ord.created_at || ord.placed_at).toLocaleString('ar-SA')}"`,
      `"${ord.customer_name_snapshot.replace(/"/g, '""')}"`,
      `"${ord.customer_phone_snapshot}"`,
      `"${ord.address_snapshot.city}"`,
      `"${ord.address_snapshot.district || ''}"`,
      ord.items.length,
      `"${ord.payment_method_snapshot.name_ar}"`,
      `"${ord.delivery_method_snapshot.name_ar}"`,
      `"${getStatusText(ord.status)}"`,
      ord.grand_total,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MiniBazaar_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Print Comprehensive Orders Report
  const handlePrintOrdersReport = (ordersToExport: Order[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const totalSum = ordersToExport.reduce((acc, o) => acc + o.grand_total, 0);
    const countNew = ordersToExport.filter((o) => o.status === 'new').length;
    const countConfirmed = ordersToExport.filter((o) => o.status === 'confirmed').length;
    const countPreparing = ordersToExport.filter((o) => o.status === 'preparing').length;
    const countOutForDelivery = ordersToExport.filter((o) => o.status === 'out_for_delivery').length;
    const countDelivered = ordersToExport.filter((o) => o.status === 'delivered').length;

    const rowsHtml = ordersToExport
      .map(
        (o, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; font-family: monospace; font-weight: bold; color: #6F584A;">${o.order_number}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; white-space: nowrap;">${new Date(o.created_at || o.placed_at).toLocaleDateString('ar-SA')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9;">
            <div style="font-weight: bold;">${o.customer_name_snapshot}</div>
            <div style="font-size: 11px; color: #7C736D;" dir="ltr">${o.customer_phone_snapshot}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9;">${o.address_snapshot.city}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9;">${o.payment_method_snapshot.name_ar}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9;">
            <span style="font-weight: bold; color: ${
              o.status === 'out_for_delivery' ? '#4F46E5' : o.status === 'delivered' ? '#16A34A' : '#2F2B28'
            };">
              ${
                o.status === 'new'
                  ? 'جديد'
                  : o.status === 'confirmed'
                  ? 'مؤكد'
                  : o.status === 'preparing'
                  ? 'قيد التجهيز'
                  : o.status === 'out_for_delivery'
                  ? 'خرج للتوصيل'
                  : o.status === 'delivered'
                  ? 'تم التسليم'
                  : 'ملغي'
              }
            </span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: left; font-weight: bold;" dir="ltr">${o.grand_total} ر.س</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير مبيعات وطلبات ميني بازار</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', Tahoma, Arial, sans-serif; padding: 30px; color: #2F2B28; background: #fff; direction: rtl; text-align: right; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #C6A36A; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #2F2B28; }
          .stats-bar { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-box { background: #FBF8F3; border: 1px solid #E5D8C9; border-radius: 12px; padding: 12px; text-align: center; }
          .stat-title { font-size: 11px; color: #7C736D; display: block; margin-bottom: 4px; }
          .stat-number { font-size: 16px; font-weight: bold; color: #6F584A; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          th { background: #F4ECE2; padding: 10px; border-bottom: 2px solid #D9C1A7; text-align: right; font-weight: bold; }
          .grand-box { display: flex; justify-content: space-between; padding: 16px 20px; background: #2F2B28; color: #fff; border-radius: 12px; font-size: 16px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #8A7465; border-top: 1px dashed #E5D8C9; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">ميني بازار | Mini Bazaar</div>
            <div style="font-size: 12px; color: #7C736D; margin-top: 4px;">تقرير الطلبات والمبيعات الإداري</div>
          </div>
          <div style="text-align: left; font-size: 12px; color: #5F5751;">
            <div>تاريخ التقرير: <strong>${new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' })}</strong></div>
            <div>الطلبات المفلترة: <strong>${ordersToExport.length} طلب</strong></div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-box">
            <span class="stat-title">إجمالي المبيعات</span>
            <span class="stat-number" dir="ltr">${totalSum.toLocaleString()} ر.س</span>
          </div>
          <div class="stat-box">
            <span class="stat-title">طلبات جديدة</span>
            <span class="stat-number">${countNew}</span>
          </div>
          <div class="stat-box">
            <span class="stat-title">مؤكدة</span>
            <span class="stat-number">${countConfirmed}</span>
          </div>
          <div class="stat-box">
            <span class="stat-title">قيد التجهيز</span>
            <span class="stat-number">${countPreparing}</span>
          </div>
          <div class="stat-box">
            <span class="stat-title" style="color: #4F46E5;">خرج للتوصيل</span>
            <span class="stat-number" style="color: #4F46E5;">${countOutForDelivery}</span>
          </div>
          <div class="stat-box">
            <span class="stat-title" style="color: #16A34A;">تم التسليم</span>
            <span class="stat-number" style="color: #16A34A;">${countDelivered}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th>رقم الطلب</th>
              <th>تاريخ الإنشاء</th>
              <th>العميل والجوال</th>
              <th>المدينة</th>
              <th>طريقة الدفع</th>
              <th>الحالة</th>
              <th style="text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="grand-box">
          <span>إجمالي مبيعات الطلبات المحددة:</span>
          <span dir="ltr">${totalSum.toLocaleString()} ر.س</span>
        </div>

        <div class="footer">
          تقرير رسمي صادر عن نظام لوحة إدارة ميني بازار — جميع الحقوق محفوظة
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Guard: if not authenticated, show the secure login & password recovery view
  if (!isAdminAuthenticated) {
    return <AdminLoginView />;
  }

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto text-right">
      {/* Save Notification Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#607866] text-white px-5 py-3 rounded-[16px] shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>تم حفظ التعديلات واعتماد البيانات بنجاح</span>
        </div>
      )}

      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E5D8C9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C6A36A] animate-pulse" />
            <span className="text-xs font-bold text-[#C6A36A]">نظام الإدارة الفاخر المعتمد</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#6F584A] font-heading">
            لوحة إدارة وتخصيص ميني بازار
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {hasUnpublishedChanges && (
            <span className="text-xs font-semibold text-[#B68A45] bg-[#FFF8EE] px-3 py-1.5 rounded-full border border-[#B68A45]/30">
              يوجد مسودات غير منشورة
            </span>
          )}

          {/* Logged in admin pill */}
          <div className="px-3 py-2 rounded-[12px] bg-[#FBF8F3] border border-[#D9C1A7] text-xs font-semibold text-[#2F2B28] flex items-center gap-1.5 shadow-2xs">
            <User className="w-3.5 h-3.5 text-[#8A7465]" />
            <span>المشرف: <strong className="text-[#6F584A] font-mono">{adminUser?.email || adminCredentials.email || 'مشرف معتمد'}</strong></span>
          </div>

          <button
            onClick={() => {
              publishCustomization();
              triggerToast();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-bold shadow-xs transition-all active:scale-95 border border-[#4A3E37]"
          >
            <Save className="w-4 h-4 text-[#C6A36A]" />
            <span>نشر التغييرات</span>
          </button>

          <button
            onClick={() => setActiveView('store')}
            className="px-3.5 py-2.5 rounded-[14px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] text-xs font-semibold"
          >
            معاينة المتجر
          </button>

          {/* Secure Logout Button */}
          <button
            onClick={() => {
              logoutAdmin();
            }}
            title="تسجيل الخروج من لوحة التحكم"
            className="px-3.5 py-2.5 rounded-[14px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-[#E5D8C9]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>نظرة عامة ومؤشرات</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'orders'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>إدارة الطلبات ({orders.length})</span>
          {newOrdersCount > 0 && (
            <span className="bg-[#C6A36A] text-[#2F2B28] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {newOrdersCount} جديد
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'products'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>الكتالوج والمنتجات ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'categories'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>إدارة التصنيفات ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'brands'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <Award className="w-4 h-4 text-[#C6A36A]" />
          <span>العلامات التجارية ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customize')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'customize'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تخصيص الهوية والواجهة</span>
        </button>

        {/* 6. Security & Admin Account Tab */}
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-[#2F2B28] text-white shadow-2xs'
              : 'bg-[#F4ECE2] text-[#5F5751] hover:bg-[#E7D4BC]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C6A36A]" />
          <span>الأمان والحساب وكلمة المرور</span>
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-[22px] border border-[#E5D8C9] shadow-2xs">
              <span className="text-xs text-[#7C736D] block mb-1">إجمالي المبيعات المعتمدة</span>
              <span className="text-2xl font-bold text-[#6F584A] font-heading" dir="ltr">
                {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-[#8A7465]">ر.س</span>
              </span>
            </div>

            <div className="bg-white p-5 rounded-[22px] border border-[#E5D8C9] shadow-2xs">
              <span className="text-xs text-[#7C736D] block mb-1">عدد الطلبات المسجلة</span>
              <span className="text-2xl font-bold text-[#2F2B28] font-heading">
                {orders.length} <span className="text-xs text-[#7C736D]">طلب</span>
              </span>
            </div>

            <div className="bg-white p-5 rounded-[22px] border border-[#E5D8C9] shadow-2xs">
              <span className="text-xs text-[#7C736D] block mb-1">الطلبات الجديدة غير المعالجة</span>
              <span className="text-2xl font-bold text-[#B4574A] font-heading">
                {newOrdersCount} <span className="text-xs text-[#7C736D]">طلب</span>
              </span>
            </div>

            <div className="bg-white p-5 rounded-[22px] border border-[#E5D8C9] shadow-2xs">
              <span className="text-xs text-[#7C736D] block mb-1">المنتجات النشطة في الكتالوج</span>
              <span className="text-2xl font-bold text-[#607866] font-heading">
                {activeProductsCount} <span className="text-xs text-[#7C736D]">منتج</span>
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-[#F7F1E8] p-6 rounded-[24px] border border-[#E7D4BC] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#6F584A] font-heading mb-1">
                الإجراءات السريعة
              </h3>
              <p className="text-xs text-[#7C736D]">
                إدخال طلب واتساب يدوي أو إضافة قطع جديدة للكتالوج.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsManualOrderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#25D366] text-white text-xs font-bold shadow-xs hover:bg-[#1EBE5D]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إدخال طلب يدوي من واتساب</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct({
                    id: `prod-${Date.now()}`,
                    category_id: categories[0]?.id || 'cat-bags',
                    name_ar: '',
                    name_en: '',
                    slug: '',
                    sku: `MB-NEW-${Math.floor(100 + Math.random() * 900)}`,
                    short_description_ar: '',
                    short_description_en: '',
                    description_ar: '',
                    description_en: '',
                    price: 299,
                    compare_at_price: 399,
                    availability_status: 'available',
                    is_featured: true,
                    is_new: true,
                    is_best_seller: false,
                    is_active: true,
                    sort_order: products.length + 1,
                    rating: 5.0,
                    reviews_count: 1,
                    images: [
                      {
                        id: `img-${Date.now()}`,
                        product_id: '',
                        path: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
                        alt_text_ar: 'صورة المنتج',
                        alt_text_en: 'Product image',
                        sort_order: 1,
                        is_primary: true,
                      },
                    ],
                    variants: [],
                  });
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-bold shadow-xs border border-[#4A3E37]"
              >
                <Plus className="w-4 h-4 text-[#C6A36A]" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-[24px] border border-[#E5D8C9] p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-[#2F2B28] font-heading mb-4">
              أحدث طلبات الزبائن
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4ECE2] text-[#2F2B28] font-bold">
                  <tr>
                    <th className="p-3">رقم الطلب</th>
                    <th className="p-3">تاريخ الإنشاء</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">المدينة</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">المصدر</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8C9]">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FBF8F3]">
                      <td className="p-3 font-mono font-bold text-[#2F2B28]">{order.order_number}</td>
                      <td className="p-3 text-[11px] text-[#7C736D] whitespace-nowrap">
                        {new Date(order.created_at || order.placed_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-3 font-semibold text-[#2F2B28]">{order.customer_name_snapshot}</td>
                      <td className="p-3 text-[#5F5751]">{order.address_snapshot.city}</td>
                      <td className="p-3 font-bold text-[#2F2B28]" dir="ltr">{order.grand_total} ر.س</td>
                      <td className="p-3 text-[#8A7465]">
                        {order.source === 'whatsapp' ? 'واتساب' : 'المتجر'}
                      </td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3 text-left">
                        <button
                          onClick={() => {
                            setSelectedOrderForDetail(order);
                            setNewStatusToApply(order.status);
                            setActiveTab('orders');
                          }}
                          className="px-3 py-1 bg-[#F4ECE2] text-[#2F2B28] rounded-[8px] font-semibold hover:bg-[#E7D4BC]"
                        >
                          عرض وتعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Top Actions & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#E5D8C9] shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A7465] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الجوال..."
                  className="w-full pr-10 pl-4 py-2.5 bg-[#FAF6F0] border border-[#E5D8C9] rounded-xl text-xs text-[#2F2B28] placeholder-[#A6998E] focus:outline-none focus:border-[#C6A36A] focus:bg-white transition-all"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    showAdvancedFilters || orderPaymentFilter !== 'all' || orderDeliveryFilter !== 'all' || orderCityFilter !== 'all' || orderDateFilter !== 'all'
                      ? 'bg-[#6F584A] text-white border-[#6F584A]'
                      : 'bg-[#FAF6F0] hover:bg-[#F4ECE2] text-[#6F584A] border-[#E5D8C9]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>تصفية متقدمة</span>
                  {(orderPaymentFilter !== 'all' || orderDeliveryFilter !== 'all' || orderCityFilter !== 'all' || orderDateFilter !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-[#C6A36A]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOrderReportsModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF6F0] hover:bg-[#F4ECE2] text-[#6F584A] border border-[#E5D8C9] transition-all"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#C6A36A]" />
                  <span>ملخص التقارير</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportOrdersCSV(filteredOrders)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FBF8F3] hover:bg-[#F4ECE2] text-[#2F2B28] border border-[#E5D8C9] transition-all"
                  title="تصدير بيانات الطلبات كملف Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#C6A36A]" />
                  <span>تصدير CSV</span>
                </button>

                <button
                  onClick={() => setIsManualOrderModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إدخال طلب واتساب</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-[#E5D8C9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-[#8A7465] mb-1">طريقة الدفع:</label>
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E5D8C9] rounded-lg text-xs"
                  >
                    <option value="all">كل طرق الدفع</option>
                    {availablePaymentTypes.map((pt, idx) => (
                      <option key={idx} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8A7465] mb-1">طريقة التوصيل:</label>
                  <select
                    value={orderDeliveryFilter}
                    onChange={(e) => setOrderDeliveryFilter(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E5D8C9] rounded-lg text-xs"
                  >
                    <option value="all">كل طرق التوصيل</option>
                    {availableDeliveryMethods.map((dm, idx) => (
                      <option key={idx} value={dm}>{dm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8A7465] mb-1">المدينة:</label>
                  <select
                    value={orderCityFilter}
                    onChange={(e) => setOrderCityFilter(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E5D8C9] rounded-lg text-xs"
                  >
                    <option value="all">كل المدن</option>
                    {availableCities.map((city, idx) => (
                      <option key={idx} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8A7465] mb-1">الفترة الزمنية:</label>
                  <select
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF6F0] border border-[#E5D8C9] rounded-lg text-xs"
                  >
                    <option value="all">كل الفترات</option>
                    <option value="today">اليوم فقط</option>
                    <option value="last7days">آخر 7 أيام</option>
                    <option value="thisMonth">هذا الشهر</option>
                  </select>
                </div>
              </div>
            )}

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5D8C9]/60">
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'all'
                    ? 'bg-[#2F2B28] text-white'
                    : 'bg-[#FAF6F0] hover:bg-[#F4ECE2] text-[#5F5751]'
                }`}
              >
                الكل ({orders.length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('new')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                جديد ({orders.filter((o) => o.status === 'new').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('confirmed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'confirmed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                مؤكد ({confirmedCount})
              </button>
              <button
                onClick={() => setOrderStatusFilter('preparing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'preparing'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                قيد التجهيز ({preparingCount})
              </button>
              <button
                onClick={() => setOrderStatusFilter('out_for_delivery')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'out_for_delivery'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                جاري التوصيل ({outForDeliveryCount})
              </button>
              <button
                onClick={() => setOrderStatusFilter('delivered')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'delivered'
                    ? 'bg-[#607866] text-white'
                    : 'bg-[#607866]/15 text-[#3e5243] hover:bg-[#607866]/25'
                }`}
              >
                تم التسليم ({deliveredCount})
              </button>
              <button
                onClick={() => setOrderStatusFilter('cancelled')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderStatusFilter === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
              >
                ملغي ({cancelledCount})
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-[24px] border border-[#E5D8C9] overflow-hidden shadow-2xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4ECE2] text-[#6F584A] font-bold">
                <tr>
                  <th className="p-3.5">رقم الطلب</th>
                  <th className="p-3.5">العميل والجوال</th>
                  <th className="p-3.5">المدينة والتوصيل</th>
                  <th className="p-3.5">المنتجات</th>
                  <th className="p-3.5">المجموع</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D8C9]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FBF8F3]">
                    <td className="p-3.5 font-mono font-bold text-[#6F584A]">{ord.order_number}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-[#2F2B28] block">{ord.customer_name_snapshot}</span>
                      <span className="text-[11px] text-[#7C736D]" dir="ltr">{ord.customer_phone_snapshot}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[#2F2B28] block">{ord.address_snapshot.city}</span>
                      <span className="text-[11px] text-[#7C736D]">{ord.delivery_method_snapshot.name_ar}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[#2F2B28] font-medium">{ord.items.length} قطع</span>
                    </td>
                    <td className="p-3.5 font-bold text-[#6F584A]" dir="ltr">{ord.grand_total} ر.س</td>
                    <td className="p-3.5">
                      <span className="font-medium text-[#2F2B28] block">{ord.payment_method_snapshot.name_ar}</span>
                      {ord.payment_method_snapshot.type === 'bank_transfer' && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {ord.bank_transfer_receipt ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminReceiptPreviewModal(ord.bank_transfer_receipt!);
                                setAdminReceiptRotation(0);
                                setAdminReceiptZoom(1);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF6F0] text-[#6F584A] border border-[#D9C1A7] hover:bg-[#F4ECE2]"
                              title="عرض إشعار الحوالة المرفق"
                            >
                              <Camera className="w-3 h-3 text-[#C6A36A]" />
                              <span>إشعار مرفق</span>
                            </button>
                          ) : ord.bank_transfer_confirmed ? (
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              أكد العميل
                            </span>
                          ) : null}

                          {ord.bank_transfer_verified ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#607866] bg-[#607866]/10 px-1.5 py-0.5 rounded border border-[#607866]/30">
                              ✓ مطابقة بنكياً
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              بانتظار المطابقة
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">{getStatusBadge(ord.status)}</td>
                    <td className="p-3.5 text-left">
                      <button
                        onClick={() => {
                          setSelectedOrderForDetail(ord);
                          setNewStatusToApply(ord.status);
                        }}
                        className="px-3 py-1.5 bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#6F584A] rounded-[8px] font-bold"
                      >
                        إدارة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Order Detail Drawer / Card */}
          {selectedOrderForDetail && (
            <div className="bg-white rounded-[24px] border-2 border-[#C6A36A] p-6 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5D8C9] mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-[#6F584A]">
                    {selectedOrderForDetail.order_number}
                  </span>
                  {getStatusBadge(selectedOrderForDetail.status)}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePrintOrderReceipt(selectedOrderForDetail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FAF6F0] hover:bg-[#F4ECE2] text-[#6F584A] text-xs font-bold border border-[#D9C1A7]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة الإيصال</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrderForDetail(null)}
                    className="text-xs text-[#8A7465] hover:text-[#2F2B28]"
                  >
                    إغلاق التفاصيل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#FBF8F3] p-4 rounded-[16px] text-xs space-y-1">
                  <span className="font-bold text-[#6F584A] block mb-2">المستلم والعنوان:</span>
                  <p className="font-semibold">{selectedOrderForDetail.customer_name_snapshot}</p>
                  <p dir="ltr" className="text-[#5F5751]">{selectedOrderForDetail.customer_phone_snapshot}</p>
                  <p className="text-[#7C736D]">
                    {selectedOrderForDetail.address_snapshot.city}، {selectedOrderForDetail.address_snapshot.district}، {selectedOrderForDetail.address_snapshot.street}
                  </p>
                  {selectedOrderForDetail.customer_notes && (
                    <p className="text-[#C6A36A] font-semibold mt-2">
                      ملاحظة العميل: {selectedOrderForDetail.customer_notes}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="bg-[#FBF8F3] p-4 rounded-[16px] text-xs space-y-2">
                  <span className="font-bold text-[#6F584A] block mb-2">الأصناف المعتمدة:</span>
                  {selectedOrderForDetail.items.map((it, i) => (
                    <div key={i} className="flex justify-between border-b border-[#E5D8C9] pb-1 last:border-none">
                      <span>{it.product_name_snapshot} × {it.quantity}</span>
                      <span className="font-bold" dir="ltr">{it.line_total} ر.س</span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-[#6F584A]">
                    <span>المجموع:</span>
                    <span dir="ltr">{selectedOrderForDetail.grand_total} ر.س</span>
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="bg-[#F4ECE2]/80 p-4 rounded-[16px] text-xs space-y-3">
                  <span className="font-bold text-[#6F584A] block">تغيير حالة الطلب:</span>
                  <select
                    value={newStatusToApply}
                    onChange={(e) => setNewStatusToApply(e.target.value as OrderStatus)}
                    className="w-full bg-white border border-[#D9C1A7] rounded-[10px] p-2 text-xs"
                  >
                    <option value="new">جديد</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="preparing">قيد التجهيز</option>
                    <option value="out_for_delivery">خرج للتوصيل</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>

                  <input
                    type="text"
                    placeholder="ملاحظة التغيير (تسجل في السجل)..."
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    className="w-full bg-white border border-[#D9C1A7] rounded-[10px] p-2 text-xs"
                  />

                  <button
                    onClick={handleUpdateStatus}
                    className="w-full py-2 bg-[#2F2B28] hover:bg-[#231F1D] text-white rounded-[10px] font-bold text-xs border border-[#4A3E37]"
                  >
                    اعتماد الحالة وتسجيلها
                  </button>
                </div>
              </div>

              {/* Bank Transfer Receipt & Verification Management Section */}
              {selectedOrderForDetail.payment_method_snapshot.type === 'bank_transfer' && (
                <div className="mb-6 p-5 rounded-[20px] bg-[#FAF6F0] border-2 border-[#D9C1A7] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5D8C9]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#C6A36A]/20 flex items-center justify-center text-[#6F584A]">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#2F2B28] font-heading">
                          فحص وتدقيق الحوالة البنكية المباشرة
                        </h4>
                        <span className="text-[11px] text-[#7C736D]">
                          طريقة الدفع: {selectedOrderForDetail.payment_method_snapshot.name_ar} (المبلغ المطلوب: {selectedOrderForDetail.grand_total} ر.س)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedOrderForDetail.bank_transfer_verified ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#607866]/15 text-[#607866] border border-[#607866]/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تمت المطابقة والتحقق مع البنك بنجاح</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>بانتظار المطابقة مع كشف حساب البنك</span>
                        </span>
                      )}

                      {selectedOrderForDetail.bank_transfer_confirmed && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          العميل أقر بالتحويل ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Left: Attached Receipt Preview & Actions */}
                    <div className="bg-white p-4 rounded-[16px] border border-[#E5D8C9] space-y-3">
                      <span className="font-bold text-xs text-[#2F2B28] block">
                        صورة إشعار / إيصال الحوالة المرفقة:
                      </span>

                      {selectedOrderForDetail.bank_transfer_receipt ? (
                        <div className="space-y-3">
                          <div
                            onClick={() => {
                              setAdminReceiptPreviewModal(selectedOrderForDetail.bank_transfer_receipt!);
                              setAdminReceiptRotation(0);
                              setAdminReceiptZoom(1);
                            }}
                            className="relative group cursor-pointer overflow-hidden rounded-[12px] border border-[#D9C1A7] bg-[#FBF8F3] max-h-56 flex items-center justify-center"
                          >
                            <img
                              src={selectedOrderForDetail.bank_transfer_receipt}
                              alt="إشعار الحوالة البنكية"
                              className="w-full max-h-56 object-contain group-hover:scale-102 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2F2B28] text-xs font-bold shadow-md">
                                <Eye className="w-4 h-4 text-[#C6A36A]" />
                                <span>تكبير وعرض بالحجم الكامل</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReceiptPreviewModal(selectedOrderForDetail.bank_transfer_receipt!);
                                setAdminReceiptRotation(0);
                                setAdminReceiptZoom(1);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] font-bold text-xs transition-colors"
                            >
                              <Eye className="w-4 h-4 text-[#6F584A]" />
                              <span>معاينة وتكبير</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(selectedOrderForDetail.bank_transfer_receipt!, selectedOrderForDetail.order_number)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#2F2B28] hover:bg-[#231F1D] text-white font-bold text-xs transition-colors shadow-2xs"
                            >
                              <Download className="w-4 h-4 text-[#C6A36A]" />
                              <span>تنزيل الإيصال (JPG)</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-[12px] bg-[#FBF8F3] border border-dashed border-[#D9C1A7] text-center space-y-2">
                          <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                          <p className="text-xs text-[#5F5751] font-semibold">
                            لم يقم العميل برفع صورة الإشعار أثناء تقديم الطلب.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRequestReceiptWhatsApp(selectedOrderForDetail)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>طلب الإشعار من العميل عبر واتساب</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Bank Matching & Confirmation Action */}
                    <div className="bg-white p-4 rounded-[16px] border border-[#E5D8C9] space-y-3.5">
                      <span className="font-bold text-xs text-[#2F2B28] block">
                        إجراء المطابقة مع كشف حساب البنك:
                      </span>

                      <div className="text-xs text-[#5F5751] bg-[#FBF8F3] p-3 rounded-[10px] space-y-1 border border-[#F4ECE2]">
                        <div className="flex justify-between">
                          <span>المبلغ المتوقع:</span>
                          <strong className="text-[#2F2B28]" dir="ltr">{selectedOrderForDetail.grand_total} ر.س</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>رقم هاتف العميل المحول:</span>
                          <strong className="text-[#2F2B28]" dir="ltr">{selectedOrderForDetail.customer_phone_snapshot}</strong>
                        </div>
                        {selectedOrderForDetail.bank_transfer_verified_at && (
                          <div className="flex justify-between pt-1 border-t border-[#E5D8C9] text-[11px] text-[#607866]">
                            <span>تاريخ المطابقة:</span>
                            <span>{new Date(selectedOrderForDetail.bank_transfer_verified_at).toLocaleString('ar-SA')}</span>
                          </div>
                        )}
                        {selectedOrderForDetail.bank_transfer_notes && (
                          <div className="pt-1 text-[11px] text-[#8A7465]">
                            <span>ملاحظة المطابقة المسجلة: </span>
                            <span className="font-semibold text-[#2F2B28]">{selectedOrderForDetail.bank_transfer_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#6F584A] block">
                          ملاحظة مسؤول التدقيق المالي (رقم المرجع البنكي / وقت القيد):
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: تمت المطابقة مع عملية الراجحي رقم #84930..."
                          value={adminVerificationNote}
                          onChange={(e) => setAdminVerificationNote(e.target.value)}
                          className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] p-2.5 text-xs text-[#2F2B28]"
                        />
                      </div>

                      <div className="pt-1">
                        {!selectedOrderForDetail.bank_transfer_verified ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyBankTransfer(selectedOrderForDetail.id, true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] bg-[#607866] hover:bg-[#4E6253] text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>تأكيد ومطابقة الحوالة مع البنك واعتماد الطلب</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerifyBankTransfer(selectedOrderForDetail.id, false)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-[12px] bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إلغاء اعتماد المطابقة البنكية (إعادة للفحص)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Change Audit Logs */}
              <div className="border-t border-[#E5D8C9] pt-4">
                <span className="text-xs font-bold text-[#8A7465] block mb-2">
                  سجل التغييرات والتدقيق للطلب (Audit Log):
                </span>
                <div className="space-y-1.5 text-xs text-[#7C736D]">
                  {selectedOrderForDetail.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 bg-[#FBF8F3] p-2 rounded-[8px]">
                      <Clock className="w-3.5 h-3.5 text-[#C6A36A] shrink-0" />
                      <span className="font-semibold text-[#2F2B28]">{log.note}</span>
                      <span className="text-[10px] text-[#8A7465] mr-auto">
                        بواسطة: {log.changed_by} ({new Date(log.created_at).toLocaleTimeString('ar-SA')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PRODUCTS CATALOG TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#6F584A] font-heading">
              قائمة المنتجات بالكتالوج ({products.length})
            </h3>

            <button
              onClick={() => {
                setEditingProduct({
                  id: `prod-${Date.now()}`,
                  category_id: categories[0]?.id || 'cat-bags',
                  name_ar: '',
                  name_en: '',
                  slug: '',
                  sku: `MB-NEW-${Math.floor(100 + Math.random() * 900)}`,
                  short_description_ar: '',
                  short_description_en: '',
                  description_ar: '',
                  description_en: '',
                  price: 299,
                  compare_at_price: 399,
                  availability_status: 'available',
                  is_featured: true,
                  is_new: true,
                  is_best_seller: false,
                  is_active: true,
                  sort_order: products.length + 1,
                  rating: 5.0,
                  reviews_count: 1,
                  images: [
                    {
                      id: `img-${Date.now()}`,
                      product_id: '',
                      path: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
                      alt_text_ar: 'صورة المنتج',
                      alt_text_en: 'Product image',
                      sort_order: 1,
                      is_primary: true,
                    },
                  ],
                  variants: [],
                });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-bold shadow-xs border border-[#4A3E37]"
            >
              <Plus className="w-4 h-4 text-[#C6A36A]" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-[24px] border border-[#E5D8C9] overflow-hidden shadow-2xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4ECE2] text-[#2F2B28] font-bold">
                <tr>
                  <th className="p-3.5">المنتج</th>
                  <th className="p-3.5">البراند</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">الرمز (SKU)</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5">حالة التوفر</th>
                  <th className="p-3.5 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D8C9]">
                {products.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const brand = brands.find((b) => b.id === p.brand_id);
                  return (
                    <tr key={p.id} className="hover:bg-[#FBF8F3]">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={p.images[0]?.path}
                          alt={p.name_ar}
                          className="w-12 h-12 rounded-[10px] object-cover bg-[#F7F1E8] border border-[#E7D4BC] shrink-0"
                        />
                        <div>
                          <span className="font-bold text-[#2F2B28] block line-clamp-1">{p.name_ar}</span>
                          <span className="text-[10px] text-[#7C736D]">{p.variants.length} خيارات متغيرات</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {brand ? (
                          <span className="px-2 py-0.5 rounded-[8px] bg-[#F4ECE2] text-[#6F584A] text-[11px] font-bold border border-[#E7D4BC] inline-block">
                            {brand.name_ar}
                          </span>
                        ) : (
                          <span className="text-[#A49A90] text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#5F5751]">{cat?.name_ar || '-'}</td>
                      <td className="p-3.5 font-mono text-[#7C736D]">{p.sku}</td>
                      <td className="p-3.5 font-bold text-[#6F584A]" dir="ltr">{p.price} ر.س</td>
                      <td className="p-3.5">
                        {p.availability_status === 'available' ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">متوفر</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">نافد</span>
                        )}
                      </td>
                      <td className="p-3.5 text-left space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded bg-[#F4ECE2] text-[#6F584A] hover:bg-[#E7D4BC]"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف ${p.name_ar}؟`)) {
                              deleteProduct(p.id);
                              triggerToast();
                            }
                          }}
                          className="p-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES MANAGEMENT TAB */}
      {activeTab === 'categories' && (
        <CategoryManager onSuccess={triggerToast} />
      )}

      {/* 5. BRANDS MANAGEMENT TAB */}
      {activeTab === 'brands' && (
        <BrandManager onSuccess={triggerToast} />
      )}

      {/* 5. CUSTOMIZATION & THEME STUDIO TAB */}
      {activeTab === 'customize' && (
        <div className="space-y-8">
          {/* Custom Logo Uploader & Emblem Settings */}
          <LogoCustomizer onSuccess={triggerToast} />

          {/* Announcement Bar Manager */}
          <AnnouncementSettingsManager onSuccess={triggerToast} />

          {/* Store Info & Direct Contact */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4">
              بيانات المتجر الأساسية ورقم الواتساب
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#5F5751] mb-1">اسم المتجر (بالعربية)</label>
                <input
                  type="text"
                  value={storeSettings.store_name_ar}
                  onChange={(e) => updateStoreSettings({ store_name_ar: e.target.value })}
                  placeholder="ميني بازار"
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5F5751] mb-1">اسم المتجر (بالإنجليزية)</label>
                <input
                  type="text"
                  value={storeSettings.store_name_en}
                  onChange={(e) => updateStoreSettings({ store_name_en: e.target.value })}
                  placeholder="Mini Bazaar"
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5F5751] mb-1">العبارة التعريفية (الشعار اللفظي)</label>
                <input
                  type="text"
                  value={storeSettings.tagline_ar}
                  onChange={(e) => updateStoreSettings({ tagline_ar: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5F5751] mb-1">رقم واتساب المبيعات</label>
                <input
                  type="text"
                  value={storeSettings.whatsapp_number}
                  onChange={(e) => updateStoreSettings({ whatsapp_number: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Hero Seamless Carousel Slides Manager */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#6F584A] font-heading">
                  إدارة شرائح الهيرو الدائري المتصل (Seamless Carousel)
                </h3>
                <p className="text-xs text-[#7C736D]">
                  التحكم في الصور والعناوين والأزرار مع خاصية الدوران المستمر دون قفزات.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSlide({
                    id: `slide-${Date.now()}`,
                    title_ar: 'عنوان الشريحة الجديدة',
                    title_en: 'New Slide Title',
                    description_ar: 'وصف مختصر للأناقة والمقتنيات الفاخرة.',
                    description_en: 'Luxury curated description.',
                    badge_ar: 'مختارات حصرية',
                    desktop_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
                    mobile_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
                    primary_button_text: 'تسوّقي الآن',
                    primary_button_url: '#products-section',
                    text_alignment: 'right',
                    background_type: 'color',
                    background_value: '#FBF8F3',
                    is_visible: true,
                    image_fit: 'contain',
                    sort_order: heroSlides.length + 1,
                  });
                  setIsSlideModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-bold border border-[#4A3E37]"
              >
                <Plus className="w-3.5 h-3.5 text-[#C6A36A]" />
                <span>إضافة شريحة</span>
              </button>
            </div>

            {/* Carousel Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-[16px] bg-[#FBF8F3] border border-[#E7D4BC] mb-6 text-xs">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoplayToggle"
                  checked={themeSettings.carousel_autoplay}
                  onChange={(e) => updateThemeSettings({ carousel_autoplay: e.target.checked })}
                  className="w-4 h-4 accent-[#2F2B28]"
                />
                <label htmlFor="autoplayToggle" className="font-semibold text-[#2F2B28]">
                  تفعيل التشغيل التلقائي للدوران (Autoplay)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="heroPulseToggle"
                  checked={themeSettings.hero_pulse_animation !== false}
                  onChange={(e) => updateThemeSettings({ hero_pulse_animation: e.target.checked })}
                  className="w-4 h-4 accent-[#2F2B28]"
                />
                <label htmlFor="heroPulseToggle" className="font-semibold text-[#2F2B28]">
                  حركة الهيرو النابضة وإزاحة كامل العرض
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[#5F5751]">سرعة الانتقال:</span>
                <input
                  type="range"
                  min="2500"
                  max="8000"
                  step="500"
                  value={themeSettings.carousel_interval}
                  onChange={(e) => updateThemeSettings({ carousel_interval: Number(e.target.value) })}
                  className="accent-[#2F2B28]"
                />
                <span className="font-bold text-[#6F584A]">{themeSettings.carousel_interval / 1000} ثانية</span>
              </div>
            </div>

            {/* Slides List */}
            <div className="space-y-3">
              {heroSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[16px] border border-[#E7D4BC] bg-[#FBF8F3]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={slide.desktop_image}
                      alt={slide.title_ar}
                      className="w-16 h-16 rounded-[12px] object-cover border border-[#E5D8C9]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2F2B28]">{slide.title_ar}</span>
                        {slide.badge_ar && (
                          <span className="text-[10px] font-semibold bg-[#F4ECE2] text-[#8A7465] px-2 py-0.5 rounded-full border border-[#D9C1A7]">
                            {slide.badge_ar}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7C736D] line-clamp-1 mt-0.5">
                        {slide.description_ar}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = heroSlides.map((s) =>
                          s.id === slide.id ? { ...s, is_visible: !s.is_visible } : s
                        );
                        updateHeroSlides(updated);
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${
                        slide.is_visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {slide.is_visible ? 'ظاهرة' : 'مخفية'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingSlide(slide);
                        setIsSlideModalOpen(true);
                      }}
                      className="p-2 rounded-[10px] bg-[#F4ECE2] text-[#6F584A] hover:bg-[#E7D4BC]"
                      title="تعديل الشريحة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {heroSlides.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = heroSlides.filter((s) => s.id !== slide.id);
                          updateHeroSlides(updated);
                        }}
                        className="p-2 rounded-[10px] bg-red-50 text-red-700 hover:bg-red-100"
                        title="حذف الشريحة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Continuous Carousel Tools & Customizer */}
          <CategoryCarouselManager onSuccess={triggerToast} />

          {/* Footer Settings & Social Media Manager */}
          <FooterSettingsManager onSuccess={triggerToast} />

          {/* Admin Security & Account Credentials Manager */}
          <AdminSecuritySettings onSuccess={triggerToast} />

          {/* Publishing & Restore Defaults Actions */}
          <div className="flex items-center justify-between p-6 rounded-[20px] bg-[#F7F1E8] border border-[#E7D4BC]">
            <button
              onClick={() => {
                if (confirm('هل ترغبين في استعادة القيم الافتراضية الأصلية لنظام الهوية؟')) {
                  restoreDefaultCustomization();
                  triggerToast();
                }
              }}
              className="flex items-center gap-2 text-xs font-bold text-[#8A7465] hover:text-[#6F584A]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة الإعدادات الافتراضية للهوية</span>
            </button>

            <button
              onClick={() => {
                publishCustomization();
                triggerToast();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-bold shadow-md active:scale-98 transition-all border border-[#4A3E37]"
            >
              <Save className="w-4 h-4 text-[#C6A36A]" />
              <span>نشر المسودة المعتمدة للواجهة</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. DEDICATED SECURITY & ADMIN ACCOUNT TAB */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <AdminSecuritySettings onSuccess={triggerToast} />
        </div>
      )}

      {/* MODAL: MANUAL WHATSAPP ORDER */}
      {isManualOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 text-right border border-[#E5D8C9] shadow-2xl">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4">
              إدخال وتثبيت طلب واتساب يدوي
            </h3>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">اسم العميل</label>
                <input
                  type="text"
                  required
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  placeholder="مثال: منيرة الصالح"
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">رقم هاتف الواتساب</label>
                <input
                  type="tel"
                  required
                  value={manualCustomerPhone}
                  onChange={(e) => setManualCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">المدينة</label>
                  <input
                    type="text"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">الحي</label>
                  <input
                    type="text"
                    value={manualDistrict}
                    onChange={(e) => setManualDistrict(e.target.value)}
                    placeholder="مثال: النخيل"
                    className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">المنتج المتفق عليه عبر واتساب</label>
                <select
                  value={manualSelectedProductId}
                  onChange={(e) => {
                    setManualSelectedProductId(e.target.value);
                    const pr = products.find((p) => p.id === e.target.value);
                    if (pr) setManualPrice(pr.price);
                  }}
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar} ({p.price} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">السعر المعتمد (ر.س)</label>
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px]"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5D8C9]">
                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(false)}
                  className="px-4 py-2 text-[#7C736D]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#25D366] text-white font-bold rounded-[12px]"
                >
                  تثبيت الطلب وحفظه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT (WITH VARIANTS & ATTRIBUTES & IMAGE UPLOADER) */}
      {isProductModalOpen && editingProduct && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={(p) => {
            saveProduct(p);
            setIsProductModalOpen(false);
            setEditingProduct(null);
            triggerToast();
          }}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* MODAL: EDIT HERO SLIDE */}
      {isSlideModalOpen && editingSlide && (
        <HeroSlideModal
          slide={editingSlide}
          onSave={(updatedSlide) => {
            const existingIndex = heroSlides.findIndex((s) => s.id === updatedSlide.id);
            let updated: HeroSlide[];
            if (existingIndex > -1) {
              updated = [...heroSlides];
              updated[existingIndex] = updatedSlide;
            } else {
              updated = [...heroSlides, updatedSlide];
            }
            updateHeroSlides(updated);
            setIsSlideModalOpen(false);
            setEditingSlide(null);
            triggerToast();
          }}
          onClose={() => {
            setIsSlideModalOpen(false);
            setEditingSlide(null);
          }}
        />
      )}

      {/* MODAL: ORDER REPORTS & ANALYTICS SUMMARY */}
      {showOrderReportsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowOrderReportsModal(false)}
        >
          <div
            className="bg-white rounded-[24px] max-w-2xl w-full p-6 text-right overflow-hidden shadow-2xl border border-[#E5D8C9] max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E5D8C9]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F4ECE2] text-[#6F584A] flex items-center justify-center border border-[#E7D4BC]">
                  <BarChart3 className="w-5 h-5 text-[#C6A36A]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2F2B28]">ملخص تقارير وإحصائيات المبيعات</h3>
                  <p className="text-xs text-[#7C736D]">نظرة سريعة على أداء المتجر والطلبات الجارية</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderReportsModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E5D8C9]">
                <span className="text-[11px] text-[#7C736D] block mb-1">إجمالي المبيعات</span>
                <span className="text-base font-bold text-[#6F584A]" dir="ltr">{totalRevenue} ر.س</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E5D8C9]">
                <span className="text-[11px] text-[#7C736D] block mb-1">عدد الطلبات الكلي</span>
                <span className="text-base font-bold text-[#2F2B28]">{orders.length} طلب</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] text-blue-800 block mb-1">طلبات جديدة</span>
                <span className="text-base font-bold text-blue-900">{newOrdersCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 block mb-1">تم تسليمها</span>
                <span className="text-base font-bold text-emerald-900">{deliveredCount}</span>
              </div>
            </div>

            {/* City Distribution */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#6F584A]">توزيع الطلبات حسب المدن:</h4>
              <div className="flex flex-wrap gap-2">
                {availableCities.map((city) => {
                  const count = orders.filter((o) => o.address_snapshot?.city === city).length;
                  return (
                    <div key={city} className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E5D8C9] text-xs flex items-center gap-2">
                      <span className="font-bold text-[#2F2B28]">{city}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#C6A36A]/20 text-[#6F584A]">{count} طلب</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#6F584A]">توزيع طرق الدفع:</h4>
              <div className="flex flex-wrap gap-2">
                {availablePaymentTypes.map((pt) => {
                  const count = orders.filter((o) => o.payment_method_snapshot?.name_ar === pt).length;
                  return (
                    <div key={pt} className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#E5D8C9] text-xs flex items-center gap-2">
                      <span className="font-bold text-[#2F2B28]">{pt}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#6F584A] text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5D8C9]">
              <button
                type="button"
                onClick={() => handleExportOrdersCSV(filteredOrders)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F2B28] text-white text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 text-[#C6A36A]" />
                <span>تصدير تقرير CSV شامل</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOrderReportsModal(false)}
                className="px-4 py-2 bg-[#F4ECE2] text-[#2F2B28] rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL PREVIEW & INSPECTION FOR BANK RECEIPT */}
      {adminReceiptPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => {
            setAdminReceiptPreviewModal(null);
            setAdminReceiptZoom(1);
            setAdminReceiptRotation(0);
          }}
        >
          <div
            className="bg-white rounded-[24px] max-w-3xl w-full p-5 text-right overflow-hidden shadow-2xl border border-[#D9C1A7] max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C9]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#C6A36A]" />
                <h3 className="font-bold text-[#2F2B28] text-base">
                  معاينة وتدقيق إشعار الحوالة البنكية
                </h3>
              </div>

              {/* Inspection Controls toolbar */}
              <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-[12px] border border-[#E5D8C9]">
                <button
                  type="button"
                  onClick={() => setAdminReceiptZoom((prev) => Math.min(prev + 0.25, 2.5))}
                  className="p-1.5 rounded-lg hover:bg-[#F4ECE2] text-[#6F584A]"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAdminReceiptZoom((prev) => Math.max(prev - 0.25, 0.75))}
                  className="p-1.5 rounded-lg hover:bg-[#F4ECE2] text-[#6F584A]"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAdminReceiptRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg hover:bg-[#F4ECE2] text-[#6F584A]"
                  title="تدوير 90 درجة"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-[#D9C1A7] mx-1" />
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadReceipt(
                      adminReceiptPreviewModal,
                      selectedOrderForDetail?.order_number || 'transfer'
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-bold"
                  title="تنزيل الصورة لجهازك"
                >
                  <Download className="w-3.5 h-3.5 text-[#C6A36A]" />
                  <span>تنزيل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminReceiptPreviewModal(null);
                    setAdminReceiptZoom(1);
                    setAdminReceiptRotation(0);
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-200"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Body with Zoom & Rotation */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#FBF8F3] rounded-[16px] border border-[#E5D8C9] my-4 min-h-[350px]">
              <img
                src={adminReceiptPreviewModal}
                alt="إشعار الحوالة"
                className="max-h-[65vh] object-contain transition-transform duration-200 rounded-[8px] shadow-xs"
                style={{
                  transform: `scale(${adminReceiptZoom}) rotate(${adminReceiptRotation}deg)`,
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5D8C9] text-xs text-[#7C736D]">
              <span>
                التكبير: {Math.round(adminReceiptZoom * 100)}% | التدوير: {adminReceiptRotation}°
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdminReceiptPreviewModal(null);
                  setAdminReceiptZoom(1);
                  setAdminReceiptRotation(0);
                }}
                className="px-4 py-2 bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] rounded-[12px] font-bold"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
