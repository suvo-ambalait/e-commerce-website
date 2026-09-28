import { Routes, Route } from 'react-router-dom'
import { StorefrontLayout } from '@/shared/layout'
import { RequireRole } from '@/features/auth/components/RequireRole'

import { HomePage } from '@/features/marketing/pages/HomePage'
import { AboutPage } from '@/features/marketing/pages/AboutPage'
import { NotFoundPage } from '@/features/marketing/pages/NotFoundPage'

import { ShopPage } from '@/features/catalog/pages/ShopPage'
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage'
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage'
import { DealsPage } from '@/features/catalog/pages/DealsPage'
import { SearchPage } from '@/features/catalog/pages/SearchPage'

import { VendorDirectoryPage } from '@/features/vendor/pages/VendorDirectoryPage'
import { VendorStorefrontPage } from '@/features/vendor/pages/VendorStorefrontPage'
import { VendorSignupPage } from '@/features/vendor/pages/VendorSignupPage'

import { CartPage } from '@/features/cart/pages/CartPage'
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage'
import { OrderConfirmationPage } from '@/features/checkout/pages/OrderConfirmationPage'

import { AccountPage } from '@/features/account/pages/AccountPage'
import { WishlistPage } from '@/features/account/pages/WishlistPage'
import { AccountLayout } from '@/features/account/components/AccountLayout'
import { AccountOrdersPage } from '@/features/account/pages/AccountOrdersPage'
import { AccountOrderDetailPage } from '@/features/account/pages/AccountOrderDetailPage'
import { AccountProfilePage } from '@/features/account/pages/AccountProfilePage'
import { AccountReturnsPage } from '@/features/account/pages/AccountReturnsPage'
import { AccountAddressesPage } from '@/features/account/pages/AccountAddressesPage'
import { TrackOrderPage } from '@/features/orders/pages/TrackOrderPage'
import { ContactPage } from '@/features/marketing/pages/ContactPage'
import { PolicyPage } from '@/features/marketing/pages/PolicyPage'
import { AccessDeniedPage } from '@/features/marketing/pages/AccessDeniedPage'
import { LogoutPage } from '@/features/auth/pages/LogoutPage'
import { VendorApplicationPage } from '@/features/vendor/pages/VendorApplicationPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

import { VendorDashboardLayout } from '@/features/vendor/dashboard/VendorDashboardLayout'
import { VendorOverview } from '@/features/vendor/dashboard/pages/VendorOverview'
import { VendorProducts } from '@/features/vendor/dashboard/pages/VendorProducts'
import { VendorProductForm } from '@/features/vendor/dashboard/pages/VendorProductForm'
import { VendorOrders } from '@/features/vendor/dashboard/pages/VendorOrders'
import { VendorOrderDetail } from '@/features/vendor/dashboard/pages/VendorOrderDetail'
import { VendorPayouts } from '@/features/vendor/dashboard/pages/VendorPayouts'
import { VendorReviews } from '@/features/vendor/dashboard/pages/VendorReviews'
import { VendorProfile } from '@/features/vendor/dashboard/pages/VendorProfile'
import { VendorAccount } from '@/features/vendor/dashboard/pages/VendorAccount'
import { VendorNotifications } from '@/features/vendor/dashboard/pages/VendorNotifications'
import { VendorDiscounts } from '@/features/vendor/dashboard/pages/VendorDiscounts'
import { VendorReturns } from '@/features/vendor/dashboard/pages/VendorReturns'
import { VendorSettings } from '@/features/vendor/dashboard/pages/VendorSettings'
import { VendorCustomers } from '@/features/vendor/dashboard/pages/VendorCustomers'
import { VendorCustomerDetail } from '@/features/vendor/dashboard/pages/VendorCustomerDetail'

import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard'
import { AdminVendors } from '@/features/admin/pages/AdminVendors'
import { AdminVendorDetail } from '@/features/admin/pages/AdminVendorDetail'
import { AdminProducts } from '@/features/admin/pages/AdminProducts'
import { AdminProductForm } from '@/features/admin/pages/AdminProductForm'
import { AdminCategories } from '@/features/admin/pages/AdminCategories'
import { AdminCategoryForm } from '@/features/admin/pages/AdminCategoryForm'
import { AdminOrders } from '@/features/admin/pages/AdminOrders'
import { AdminOrderDetail } from '@/features/admin/pages/AdminOrderDetail'
import { AdminInventoryPage } from '@/features/inventory/pages/AdminInventoryPage'
import { AdminInventoryDetail } from '@/features/inventory/pages/AdminInventoryDetail'
import { VendorInventoryPage } from '@/features/inventory/pages/VendorInventoryPage'
import { VendorInventoryDetail } from '@/features/inventory/pages/VendorInventoryDetail'
import { AdminCustomers } from '@/features/admin/pages/AdminCustomers'
import { AdminCustomerDetail } from '@/features/admin/pages/AdminCustomerDetail'
import { AdminSettings } from '@/features/admin/pages/AdminSettings'
import { AdminDiscounts } from '@/features/admin/pages/AdminDiscounts'
import { AdminReviews } from '@/features/admin/pages/AdminReviews'
import { DashboardAccount } from '@/features/admin/pages/DashboardAccount'
import { AdminNotifications } from '@/features/admin/pages/AdminNotifications'
import { AdminReturns } from '@/features/admin/pages/AdminReturns'
import { AdminPayouts } from '@/features/admin/pages/AdminPayouts'
import { AdminReports } from '@/features/admin/pages/AdminReports'
import { AdminStaff } from '@/features/admin/pages/AdminStaff'
import { AdminShipping } from '@/features/admin/pages/AdminShipping'
import { AdminContent } from '@/features/admin/pages/AdminContent'

export function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/vendors" element={<VendorDirectoryPage />} />
        <Route path="/vendor/signup" element={<VendorSignupPage />} />
        <Route path="/vendor/:slug" element={<VendorStorefrontPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route element={<AccountLayout />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/orders" element={<AccountOrdersPage />} />
          <Route path="/account/orders/:orderNumber" element={<AccountOrderDetailPage />} />
          <Route path="/account/profile" element={<AccountProfilePage />} />
          <Route path="/account/returns" element={<AccountReturnsPage />} />
          <Route path="/account/addresses" element={<AccountAddressesPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shipping-returns" element={<PolicyPage slug="shipping-returns" />} />
        <Route path="/faq" element={<PolicyPage slug="faq" />} />
        <Route path="/terms" element={<PolicyPage slug="terms" />} />
        <Route path="/privacy" element={<PolicyPage slug="privacy" />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/403" element={<AccessDeniedPage />} />
        <Route path="/vendor/application" element={<VendorApplicationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/vendor/dashboard"
        element={
          <RequireRole role="vendor">
            <VendorDashboardLayout />
          </RequireRole>
        }
      >
        <Route index element={<VendorOverview />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/new" element={<VendorProductForm />} />
        <Route path="products/:id/edit" element={<VendorProductForm />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="inventory" element={<VendorInventoryPage />} />
        <Route path="inventory/:id" element={<VendorInventoryDetail />} />
        <Route path="reviews" element={<VendorReviews />} />
        <Route path="notifications" element={<VendorNotifications />} />
        <Route path="discounts" element={<VendorDiscounts />} />
        <Route path="returns" element={<VendorReturns />} />
        <Route path="settings" element={<VendorSettings />} />
        <Route path="customers" element={<VendorCustomers />} />
        <Route path="customers/:email" element={<VendorCustomerDetail />} />
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="account" element={<VendorAccount />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="vendors/:id" element={<AdminVendorDetail />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="categories/new" element={<AdminCategoryForm />} />
        <Route path="categories/:id/edit" element={<AdminCategoryForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="inventory/:id" element={<AdminInventoryDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:email" element={<AdminCustomerDetail />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="returns" element={<AdminReturns />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="account" element={<DashboardAccount />} />
      </Route>
    </Routes>
  )
}
