import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const MastodonCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const username = searchParams.get('username');
    const error = searchParams.get('error');

    if (success && username) {
      setStatus('success');
      setMessage(`Connected as @${username}`);
      
      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'MASTODON_AUTH_SUCCESS', 
          username 
        }, '*');
      }
      
      // Store in localStorage as fallback
      localStorage.setItem('mastodon_auth_result', JSON.stringify({ 
        success: true, 
        username,
        timestamp: Date.now()
      }));
      
      // Close popup after short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      setStatus('error');
      setMessage(error || 'Failed to connect Mastodon account');
      
      // Notify parent window of error
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'MASTODON_AUTH_ERROR', 
          error: error || 'Unknown error'
        }, '*');
      }
      
      localStorage.setItem('mastodon_auth_result', JSON.stringify({ 
        success: false, 
        error: error || 'Unknown error',
        timestamp: Date.now()
      }));
      
      // Close popup after delay
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Mastodon Connected!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">This window will close automatically...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MastodonCallbackPage;
