
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useUserRole } from '@/hooks/useUserRole';
import AdminDashboard from '@/components/cms/AdminDashboard';
import { Button } from '@/components/ui/button';
import { LogOut, Home, User, Shield } from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, adminLogout } = useAdminAuth();
  const { userRole } = useUserRole();

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/admin/login';
  };

  const handleBackToSite = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">
                CMS Administration
              </h1>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 rounded-full">
              <User className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {userRole} - {user?.email}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleBackToSite}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Back to Site</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Admin Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Dashboard Content */}
      <AdminDashboard />
    </div>
  );
};

export default AdminDashboardPage;
