import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Info, ExternalLink } from 'lucide-react';

interface TelegramConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (credentials: { botToken: string; channelId: string; channelName?: string }) => Promise<{ success: boolean }>;
  isConnecting: boolean;
}

const TelegramConnectDialog = ({ open, onClose, onConnect, isConnecting }: TelegramConnectDialogProps) => {
  const [botToken, setBotToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!botToken.trim()) {
      setError('Bot Token is required');
      return;
    }

    if (!channelId.trim()) {
      setError('Channel ID is required');
      return;
    }

    const result = await onConnect({
      botToken: botToken.trim(),
      channelId: channelId.trim(),
      channelName: channelName.trim() || undefined
    });

    if (result.success) {
      setBotToken('');
      setChannelId('');
      setChannelName('');
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setBotToken('');
      setChannelId('');
      setChannelName('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-400 rounded-lg">
              <Send className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>Connect Telegram Channel</DialogTitle>
          </div>
          <DialogDescription>
            Connect your Telegram bot to publish posts to your channel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>How to set up:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">@BotFather <ExternalLink className="h-3 w-3" /></a></li>
                <li>Copy your Bot Token from BotFather</li>
                <li>Add your bot as admin to your channel</li>
                <li>Get your Channel ID (e.g., @yourchannel or -1001234567890)</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token *</Label>
            <Input
              id="botToken"
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              Get this from @BotFather when you create your bot
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID *</Label>
            <Input
              id="channelId"
              placeholder="@yourchannel or -1001234567890"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              disabled={isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              For public channels: @channelname<br />
              For private channels: numeric ID (e.g., -1001234567890)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelName">Channel Name (optional)</Label>
            <Input
              id="channelName"
              placeholder="My Awesome Channel"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              disabled={isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this channel
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isConnecting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramConnectDialog;
