
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { assignAdminRole } from '@/utils/adminUtils';
import { Shield, Users, Database } from 'lucide-react';

const AdminSetupGuide = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAssignAdmin = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await assignAdminRole(email, 'admin');
    
    if (result.success) {
      setMessage(result.message || 'Admin role assigned successfully');
      setEmail('');
    } else {
      setError(result.error || 'Failed to assign admin role');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          CMS Admin Setup Guide
        </h1>
        <p className="text-gray-600">
          Set up administrators for your Content Management System
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Admin Role
            </CardTitle>
            <CardDescription>
              Grant admin access to users who need to manage the CMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  {message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-email">User Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={handleAssignAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Assigning...' : 'Assign Admin Role'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Access Information
            </CardTitle>
            <CardDescription>
              How to access the CMS after setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Admin Login URL:</h4>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  /admin/login
                </code>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Admin Dashboard:</h4>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  /admin/dashboard
                </code>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Available Roles:</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li><strong>Admin:</strong> Full access to all CMS features</li>
                  <li><strong>Developer:</strong> Technical access and analytics</li>
                  <li><strong>Viewer:</strong> Read-only access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Security Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Admin users can access sensitive analytics and user data</li>
            <li>• The CMS is completely separate from the regular user dashboard</li>
            <li>• Admin sessions are tracked and automatically expire after 24 hours</li>
            <li>• Only assign admin roles to trusted team members</li>
            <li>• Users must first create a regular account before being assigned admin roles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetupGuide;
