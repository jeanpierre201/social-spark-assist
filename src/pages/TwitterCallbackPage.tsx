import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const TwitterCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const screenName = searchParams.get('screenName');
    const error = searchParams.get('error');

    if (success && screenName) {
      // Send postMessage to parent (same origin now!)
      if (window.opener) {
        try {
          window.opener.postMessage({
            type: 'TWITTER_AUTH_SUCCESS',
            screenName: screenName
          }, window.location.origin);
        } catch (e) {
          console.log('postMessage failed:', e);
        }
      }

      // Also set localStorage as backup
      try {
        localStorage.setItem('twitter_auth_result', JSON.stringify({
          success: true,
          screenName: screenName,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('localStorage failed:', e);
      }

      setStatus('success');
      setMessage(`@${screenName}`);

      // Close popup after brief success display
      setTimeout(() => {
        window.close();
      }, 800);
    } else {
      // Error case
      const errorMsg = error || 'Connection failed';
      
      if (window.opener) {
        try {
          window.opener.postMessage({
            type: 'TWITTER_AUTH_ERROR',
            error: errorMsg
          }, window.location.origin);
        } catch (e) {
          console.log('postMessage failed:', e);
        }
      }

      try {
        localStorage.setItem('twitter_auth_result', JSON.stringify({
          success: false,
          error: errorMsg,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('localStorage failed:', e);
      }

      setStatus('error');
      setMessage(errorMsg);

      setTimeout(() => {
        window.close();
      }, 1500);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: status === 'error' 
        ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
        : 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)'
    }}>
      <div className="text-center text-white p-10">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            <h1 className="text-2xl font-semibold mb-2">Connecting...</h1>
            <p className="opacity-90">Finishing up</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 bg-white/20 rounded-full flex items-center justify-center text-3xl animate-scale-in">
              ✓
            </div>
            <h1 className="text-2xl font-semibold mb-2 animate-fade-in">Connected!</h1>
            <p className="opacity-90 animate-fade-in">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-5">✕</div>
            <h1 className="text-2xl font-semibold mb-2">Connection Failed</h1>
            <p className="opacity-90">{message}</p>
            <p className="mt-5 text-sm opacity-75">This window will close automatically...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TwitterCallbackPage;
