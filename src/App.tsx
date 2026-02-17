
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
import DashboardContentPage from "./pages/DashboardContentPage";
import DashboardAnalyticsPage from "./pages/DashboardAnalyticsPage";
import DashboardTeamPage from "./pages/DashboardTeamPage";
import DashboardBrandPage from "./pages/DashboardBrandPage";
import DashboardCampaignsPage from "./pages/DashboardCampaignsPage";
import DashboardSocialPage from "./pages/DashboardSocialPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminResetPasswordPage from "./pages/AdminResetPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ContentGeneratorPage from "./pages/ContentGeneratorPage";
import StarterContentGeneratorPage from "./pages/StarterContentGeneratorPage";
import ProContentGeneratorPage from "./pages/ProContentGeneratorPage";
import PostsStarterPage from "./pages/PostsStarterPage";
import PostsProPage from "./pages/PostsProPage";
import SupportPage from "./pages/SupportPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import DataDeletionPage from "./pages/DataDeletionPage";
import NotFound from "./pages/NotFound";
import UpgradeProPage from "./pages/UpgradeProPage";
import UpgradeStarterPage from "./pages/UpgradeStarterPage";
import TestUtilityPage from "./pages/TestUtilityPage";
import StarterPlanTestPage from "./pages/StarterPlanTestPage";
import LogoPreviewPage from "./pages/LogoPreviewPage";
import TwitterCallbackPage from "./pages/TwitterCallbackPage";
import MastodonCallbackPage from "./pages/MastodonCallbackPage";
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
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/data-deletion" element={<DataDeletionPage />} />
                  <Route path="/logo-preview" element={<LogoPreviewPage />} />
                  <Route path="/auth/twitter/callback" element={<TwitterCallbackPage />} />
                  <Route path="/auth/mastodon/callback" element={<MastodonCallbackPage />} />
                  
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
                  <Route path="/upgrade-starter" element={
                    <ProtectedRoute>
                      <UpgradeStarterPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/content" element={
                    <ProtectedRoute>
                      <DashboardContentPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/analytics" element={
                    <ProtectedRoute>
                      <DashboardAnalyticsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/team" element={
                    <ProtectedRoute>
                      <DashboardTeamPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/brand" element={
                    <ProtectedRoute>
                      <DashboardBrandPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/campaigns" element={
                    <ProtectedRoute>
                      <DashboardCampaignsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/social" element={
                    <ProtectedRoute>
                      <DashboardSocialPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/content-generator" element={
                    <ProtectedRoute>
                      <ContentGeneratorPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/content-generator-starter" element={
                    <ProtectedRoute>
                      <StarterContentGeneratorPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/content-generator-pro" element={
                    <ProtectedRoute>
                      <ProContentGeneratorPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/posts-starter" element={
                    <ProtectedRoute>
                      <PostsStarterPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/posts-pro" element={
                    <ProtectedRoute>
                      <PostsProPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/test-utility" element={
                    <ProtectedRoute>
                      <TestUtilityPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/test" element={
                    <ProtectedRoute>
                      <TestUtilityPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/test-starter-plan" element={
                    <ProtectedRoute>
                      <StarterPlanTestPage />
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
