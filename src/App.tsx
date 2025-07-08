
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { SocialAccountsProvider } from "@/hooks/useSocialAccounts";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminResetPasswordPage from "./pages/AdminResetPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ContentGeneratorPage from "./pages/ContentGeneratorPage";
import ContentGeneratorStarterPage from "./pages/ContentGeneratorStarterPage";
import SupportPage from "./pages/SupportPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import DataDeletionPage from "./pages/DataDeletionPage";
import NotFound from "./pages/NotFound";
import UpgradeProPage from "./pages/UpgradeProPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <SubscriptionProvider>
          <SocialAccountsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/data-deletion" element={<DataDeletionPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
                  <Route path="/admin/dashboard" element={
                    <AdminProtectedRoute>
                      <AdminDashboardPage />
                    </AdminProtectedRoute>
                  } />
                  
                  {/* User Protected Routes */}
                  <Route path="/upgrade-pro" element={
                    <ProtectedRoute>
                      <UpgradeProPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/support" element={
                    <ProtectedRoute>
                      <SupportPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/content-generator" element={
                    <ProtectedRoute>
                      <ContentGeneratorPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/content-generator-starter" element={
                    <ProtectedRoute>
                      <ContentGeneratorStarterPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SocialAccountsProvider>
        </SubscriptionProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
