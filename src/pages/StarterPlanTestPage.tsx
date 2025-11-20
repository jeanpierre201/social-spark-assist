import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  generateTestUsers, 
  createTestUser, 
  createStarterSubscription,
  loginTestUser,
  generateTestContent,
  logoutTestUser
} from '@/utils/testUtils';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface TestResult {
  email: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

const StarterPlanTestPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [userCount, setUserCount] = useState(3);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runStarterPlanTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setCurrentStep('Generating test users...');

    try {
      // Step 1: Generate test user data
      const testUsers = generateTestUsers(userCount).map((user, index) => ({
        ...user,
        email: `starter_test_${Date.now()}_${index + 1}@socialnova.test`
      }));
      
      setProgress(10);
      addResult({
        email: 'System',
        status: 'success',
        message: `Generated ${userCount} test users`,
        timestamp: new Date()
      });

      // Step 2: Create accounts with Starter subscriptions
      const totalSteps = testUsers.length;
      let currentStepNum = 0;

      for (const testUser of testUsers) {
        currentStepNum++;
        setCurrentStep(`Creating account ${currentStepNum}/${totalSteps}: ${testUser.email}`);
        
        // Create the user
        const userResult = await createTestUser(
          testUser.email,
          testUser.password,
          testUser.fullName
        );

        if (!userResult.success || !userResult.user) {
          addResult({
            email: testUser.email,
            status: 'error',
            message: `Failed to create user: ${userResult.error}`,
            timestamp: new Date()
          });
          continue;
        }

        addResult({
          email: testUser.email,
          status: 'success',
          message: 'User account created',
          timestamp: new Date()
        });

        // Create Starter subscription
        const subResult = await createStarterSubscription(
          userResult.user.id,
          testUser.email
        );

        if (!subResult.success) {
          addResult({
            email: testUser.email,
            status: 'error',
            message: `Failed to create subscription: ${subResult.error}`,
            timestamp: new Date()
          });
          continue;
        }

        addResult({
          email: testUser.email,
          status: 'success',
          message: 'Starter subscription created',
          timestamp: new Date()
        });

        // Generate test content
        const contentResult = await generateTestContent(userResult.user.id);
        
        if (contentResult.success) {
          addResult({
            email: testUser.email,
            status: 'success',
            message: 'Test content generated',
            timestamp: new Date()
          });
        } else {
          addResult({
            email: testUser.email,
            status: 'error',
            message: `Failed to generate content: ${contentResult.error}`,
            timestamp: new Date()
          });
        }

        // Logout to prepare for next user
        await logoutTestUser();

        setProgress(10 + (currentStepNum / totalSteps) * 80);
        
        // Wait between users to avoid rate limiting
        if (currentStepNum < totalSteps) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setProgress(100);
      setCurrentStep('Test completed!');
      
      toast({
        title: "Starter Plan Test Complete",
        description: `Successfully created ${userCount} test accounts with Starter subscriptions.`,
      });

    } catch (error: any) {
      console.error('Test failed:', error);
      addResult({
        email: 'System',
        status: 'error',
        message: `Test failed: ${error.message}`,
        timestamp: new Date()
      });
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Starter Plan Test Suite</CardTitle>
          <CardDescription>
            Create test accounts with Starter plan subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Before running tests:</strong> Make sure to disable email confirmation in Supabase:
              <br />
              1. Go to Supabase Dashboard → Authentication → Providers
              <br />
              2. Click on Email provider
              <br />
              3. Disable "Confirm email"
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userCount">Number of Test Accounts</Label>
              <Input
                id="userCount"
                type="number"
                min="1"
                max="10"
                value={userCount}
                onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
                disabled={isRunning}
              />
            </div>

            <Button 
              onClick={runStarterPlanTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                'Run Starter Plan Test'
              )}
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Successful</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{successCount}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-2xl font-bold">{errorCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Test Log</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                    >
                      {result.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{result.email}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Test Credentials:</strong> All test accounts use the pattern starter_test_[timestamp]_[number]@socialnova.test with passwords TestPass[number]123!
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StarterPlanTestPage;
