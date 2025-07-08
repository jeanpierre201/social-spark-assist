import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle } from 'lucide-react';

const AdminResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the necessary tokens for password reset
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-600/20 w-fit">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Password Reset Successful
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your password has been updated successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 rounded-full bg-red-600/20 w-fit">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Reset Admin Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your new password for admin access
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-600 bg-red-900/20">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Remember your password?{' '}
                <Button
                  variant="link"
                  className="text-red-400 hover:text-red-300 p-0 h-auto"
                  onClick={() => navigate('/admin/login')}
                >
                  Back to Login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminResetPasswordPage;