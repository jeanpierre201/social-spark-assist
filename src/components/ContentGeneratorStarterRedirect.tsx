
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import ContentGeneratorStarter from './ContentGeneratorStarter';

const ContentGeneratorStarterRedirect = () => {
  const { subscribed, subscriptionTier, loading } = useSubscription();

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

  // Pro users should be redirected to dashboard
  if (subscribed && subscriptionTier === 'Pro') {
    return <Navigate to="/dashboard" replace />;
  }

  // Only Starter users or non-subscribed users can access this
  return <ContentGeneratorStarter />;
};

export default ContentGeneratorStarterRedirect;
