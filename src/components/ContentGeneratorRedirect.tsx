
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import ContentGenerator from './ContentGenerator';

const ContentGeneratorRedirect = () => {
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

  // Non-Pro users (including Starter users) can access the content generator
  return <ContentGenerator />;
};

export default ContentGeneratorRedirect;
