
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle } from 'lucide-react';

const DataDeletionPage = () => {
  const handleDeleteRequest = () => {
    // In a real implementation, this would trigger a data deletion process
    window.location.href = 'mailto:privacy@socialassistanceai.com?subject=Data Deletion Request&body=I would like to request deletion of my account and all associated data.';
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Deletion</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete Your Data</span>
            </CardTitle>
            <CardDescription>
              Request complete deletion of your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Important Information</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      This action cannot be undone. All your data, including social media connections, 
                      generated content, and analytics will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900">What will be deleted:</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Your account information and profile</li>
                  <li>All connected social media accounts</li>
                  <li>Generated content and templates</li>
                  <li>Analytics and performance data</li>
                  <li>Billing and subscription information</li>
                  <li>Any stored preferences or settings</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Processing time:</h3>
                <p className="text-gray-700">
                  Data deletion requests are typically processed within 30 days. You will receive 
                  confirmation once the deletion is complete.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Alternative options:</h3>
                <p className="text-gray-700">
                  If you only want to disconnect specific social media accounts or delete certain 
                  content, you can do so from your dashboard settings instead of deleting everything.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleDeleteRequest}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Data Deletion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you have questions about data deletion or need assistance with your account, 
              please contact our support team.
            </p>
            <p className="text-gray-700">
              Email: <a href="mailto:privacy@socialassistanceai.com" className="text-blue-600 hover:underline">
                privacy@socialassistanceai.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default DataDeletionPage;
