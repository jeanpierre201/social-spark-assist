
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { adminLogin, isAuthenticated, isAuthorized } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already authenticated and authorized
  if (isAuthenticated && isAuthorized) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await adminLogin(email, password);
    
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to main site link */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main Site
          </Link>
        </div>

        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 rounded-full bg-red-600/20 w-fit">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              CMS Admin Login
            </CardTitle>
            <CardDescription className="text-gray-400">
              Access restricted to administrators and developers only
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
                <Label htmlFor="email" className="text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Signing In...' : 'Sign In to CMS'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                This is a restricted area. Only authorized personnel with admin or developer roles can access the CMS.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;
