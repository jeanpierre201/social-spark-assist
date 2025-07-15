import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const TestOpenAI = () => {
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const { toast } = useToast();

  const testOpenAI = async () => {
    setIsTestingOpenAI(true);
    try {
      console.log('Testing OpenAI API key...');
      
      const { data, error } = await supabase.functions.invoke('test-openai', {
        body: {}
      });

      if (error) {
        console.error('OpenAI test error:', error);
        throw error;
      }

      console.log('OpenAI test result:', data);
      
      if (data.success) {
        toast({
          title: "OpenAI API Key Working!",
          description: `Found ${data.modelsCount} models available.`,
        });
      } else {
        toast({
          title: "OpenAI API Key Issue",
          description: data.error || 'Unknown error',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test OpenAI error:', error);
      toast({
        title: "Test Failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Test OpenAI API Key</h3>
      <Button 
        onClick={testOpenAI} 
        disabled={isTestingOpenAI}
        variant="outline"
      >
        {isTestingOpenAI ? 'Testing...' : 'Test OpenAI Connection'}
      </Button>
    </div>
  );
};

export default TestOpenAI;