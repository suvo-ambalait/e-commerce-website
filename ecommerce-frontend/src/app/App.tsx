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
        <Route path="/account" element={<AccountPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
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
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="account" element={<DashboardAccount />} />
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
        <Route path="account" element={<DashboardAccount />} />
      </Route>
    </Routes>
  )
}
