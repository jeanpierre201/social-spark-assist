
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentVariation {
  caption: string;
  hashtags: string[];
  variation: string;
}

interface ContentVariationsProps {
  variations: ContentVariation[];
  onSelectVariation: (variation: ContentVariation) => void;
  onDownloadVariation: (variation: ContentVariation) => void;
}

const ContentVariations = ({ variations, onSelectVariation, onDownloadVariation }: ContentVariationsProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyToClipboard = async (variation: ContentVariation, index: number) => {
    const contentText = `${variation.caption}\n\n${variation.hashtags.map(tag => `#${tag}`).join(' ')}`;
    
    try {
      await navigator.clipboard.writeText(contentText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!variations || variations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="h-5 w-5 text-purple-600 mr-2" />
          Content Variations ({variations.length})
        </CardTitle>
        <CardDescription>
          Multiple AI-generated versions to choose from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            {variations.map((variation, index) => (
              <TabsTrigger 
                key={index} 
                value={index.toString()}
                className="text-xs"
              >
                {variation.variation}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {variations.map((variation, index) => (
            <TabsContent key={index} value={index.toString()} className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-xs">
                    {variation.variation}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToClipboard(variation, index)}
                      className="h-8"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadVariation(variation)}
                      className="h-8"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Caption</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    {variation.caption}
                  </p>
                  
                  <h4 className="text-sm font-medium mb-2">Hashtags</h4>
                  <p className="text-sm text-blue-600">
                    {variation.hashtags.map(tag => `#${tag}`).join(' ')}
                  </p>
                </div>
                
                <Button
                  onClick={() => onSelectVariation(variation)}
                  className="w-full"
                  variant="outline"
                >
                  Use This Variation
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentVariations;
