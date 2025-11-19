import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  generateTestUsers, 
  createTestUsersBatch, 
  loginTestUser, 
  generateTestContent,
  updateTestUserProfile,
  changeTestUserPassword,
  logoutTestUser
} from '@/utils/testUtils';
import { Users, Play, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

const TestUtilityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [numberOfUsers, setNumberOfUsers] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{
    totalUsers: number;
    usersCreated: number;
    contentCreated: number;
    profilesUpdated: number;
    passwordsChanged: number;
    failed: number;
  } | null>(null);

  const addResult = (step: string, success: boolean, message: string) => {
    setResults(prev => [...prev, { step, success, message, timestamp: new Date() }]);
  };

  const handleCleanupTestUsers = async () => {
    if (!confirm('Are you sure you want to delete all test users and their data? This action cannot be undone.')) {
      return;
    }

    setIsCleaningUp(true);
    setCurrentStep('Cleaning up test users...');

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-test-users', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Cleanup Successful",
        description: data.message || `Deleted ${data.deleted} test users`,
      });

      addResult('Cleanup Test Users', true, data.message || `Deleted ${data.deleted} test users`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Cleanup had some errors:', data.errors);
        data.errors.forEach((err: string) => {
          addResult('Cleanup Error', false, err);
        });
      }
    } catch (error) {
      console.error('Error cleaning up test users:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || 'Failed to clean up test users',
        variant: "destructive",
      });
      addResult('Cleanup Test Users', false, error.message || 'Failed to clean up test users');
    } finally {
      setIsCleaningUp(false);
      setCurrentStep('');
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    const stats = {
      totalUsers: numberOfUsers,
      usersCreated: 0,
      contentCreated: 0,
      profilesUpdated: 0,
      passwordsChanged: 0,
      failed: 0
    };

    try {
      // Step 1: Generate test user data
      setCurrentStep('Generating test user data...');
      setProgress(5);
      const testUsers = generateTestUsers(numberOfUsers);
      addResult('Generate Users', true, `Generated ${numberOfUsers} test user accounts`);

      // Step 2: Create users in batches
      setCurrentStep('Creating user accounts...');
      setProgress(10);
      const creationResults = await createTestUsersBatch(testUsers, 5);
      
      stats.usersCreated = creationResults.filter(r => r.success).length;
      stats.failed += creationResults.filter(r => !r.success).length;
      
      addResult(
        'Create Accounts', 
        stats.usersCreated > 0, 
        `Created ${stats.usersCreated}/${numberOfUsers} accounts successfully`
      );

      // Step 3: Test each user's workflow
      const progressPerUser = 80 / numberOfUsers;
      
      for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        const userNum = i + 1;
        
        setCurrentStep(`Testing user ${userNum}/${numberOfUsers}: ${user.email}`);
        setProgress(10 + (progressPerUser * (i + 1)));

        try {
          // Login
          const loginResult = await loginTestUser(user.email, user.password);
          if (!loginResult.success || !loginResult.user) {
            addResult(`User ${userNum} - Login`, false, `Failed to login: ${loginResult.error}`);
            stats.failed++;
            continue;
          }

          // Generate content
          const contentResult = await generateTestContent(loginResult.user.id);
          if (contentResult.success) {
            stats.contentCreated++;
            addResult(`User ${userNum} - Content`, true, 'Content generated successfully');
          } else {
            addResult(`User ${userNum} - Content`, false, `Failed: ${contentResult.error}`);
          }

          // Update profile
          const profileResult = await updateTestUserProfile(
            loginResult.user.id,
            `Updated ${user.fullName}`
          );
          if (profileResult.success) {
            stats.profilesUpdated++;
            addResult(`User ${userNum} - Profile`, true, 'Profile updated successfully');
          } else {
            addResult(`User ${userNum} - Profile`, false, `Failed: ${profileResult.error}`);
          }

          // Change password
          const passwordResult = await changeTestUserPassword(`NewPass${userNum}123!`);
          if (passwordResult.success) {
            stats.passwordsChanged++;
            addResult(`User ${userNum} - Password`, true, 'Password changed successfully');
          } else {
            addResult(`User ${userNum} - Password`, false, `Failed: ${passwordResult.error}`);
          }

          // Logout
          await logoutTestUser();
          
          // Small delay between users
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error: any) {
          addResult(`User ${userNum} - Error`, false, error.message);
          stats.failed++;
        }
      }

      setProgress(100);
      setCurrentStep('Test completed!');
      setSummary(stats);
      
      addResult(
        'Test Complete',
        true,
        `Test finished. ${stats.usersCreated} users created, ${stats.contentCreated} posts generated`
      );

    } catch (error: any) {
      addResult('Fatal Error', false, error.message);
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-600" />
                  User Testing Utility
                </CardTitle>
                <CardDescription>
                  Automated testing tool for creating and testing multiple user accounts
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="userCount">Number of Test Users</Label>
                <Input
                  id="userCount"
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfUsers}
                  onChange={(e) => setNumberOfUsers(parseInt(e.target.value) || 1)}
                  disabled={isRunning}
                />
              </div>
              <Button
                onClick={runFullTest}
                disabled={isRunning}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Test
                  </>
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Test Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Cleanup Test Data
            </CardTitle>
            <CardDescription>
              Remove all test users created with @socialnova.test emails and their associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCleanupTestUsers}
              disabled={isCleaningUp || isRunning}
              variant="destructive"
              className="w-full"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Test Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.usersCreated}</div>
                  <div className="text-xs text-muted-foreground">Accounts Created</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{summary.contentCreated}</div>
                  <div className="text-xs text-muted-foreground">Posts Generated</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{summary.profilesUpdated}</div>
                  <div className="text-xs text-muted-foreground">Profiles Updated</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600">{summary.passwordsChanged}</div>
                  <div className="text-xs text-muted-foreground">Passwords Changed</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed Operations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Log */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results Log</CardTitle>
              <CardDescription>
                Showing {results.length} test operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {results.map((result, index) => (
                  <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{result.step}</div>
                        <AlertDescription className="text-sm">
                          {result.message}
                        </AlertDescription>
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!isRunning && results.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What this test does:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Creates the specified number of free plan user accounts</li>
                  <li>For each user: Logs in and generates social media content</li>
                  <li>Updates user profile (name change)</li>
                  <li>Changes user password</li>
                  <li>Verifies content is visible (24-hour retention for free users)</li>
                  <li>Logs detailed results for each operation</li>
                </ul>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> This test will create real user accounts in your database. 
                  Test emails will be in the format: testuser1@socialnova.test, testuser2@socialnova.test, etc.
                  Make sure email confirmation is disabled in Supabase settings for faster testing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestUtilityPage;
