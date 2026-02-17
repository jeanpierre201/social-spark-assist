import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SocialMediaSettings from '@/components/SocialMediaSettings';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import UpgradePrompt from '@/components/dashboard/UpgradePrompt';

const DashboardSocialPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const navigate = useNavigate();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Both Starter and Pro users can access social accounts
  if (!subscribed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Social Media" showLogout={false} />
          <UpgradePrompt />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader isProUser={isProUser} isStarterUser={isStarterUser} title="Social Media" showLogout={false} />

        {/* Navigation tabs - only show for Pro users */}
        {isProUser && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Overview
                </button>
                <button
                  onClick={() => navigate('/dashboard/content')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Content Generator
                </button>
                <button
                  onClick={() => navigate('/dashboard/posts-pro')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Your Posts
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Advanced Analytics
                </button>
                <button
                  onClick={() => navigate('/dashboard/team')}
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Team Collaboration
                </button>
                <button
                  className="border-purple-500 text-purple-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Social Accounts
                </button>
              </nav>
            </div>
          </div>
        )}


        {/* Social Media Settings Content */}
        <SocialMediaSettings />
      </div>
    </div>
  );
};

export default DashboardSocialPage;