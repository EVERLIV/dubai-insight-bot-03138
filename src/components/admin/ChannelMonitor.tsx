import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Radio, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonitoredChannel {
  id: string;
  name: string;
  enabled: boolean;
}

export const ChannelMonitor = () => {
  const [newChannelId, setNewChannelId] = useState('');
  const { toast } = useToast();

  // Default monitored channel
  const [channels] = useState<MonitoredChannel[]>([
    { id: '-1003589064021', name: 'Main Group (@renthcm_bot)', enabled: true }
  ]);

  const handleAddChannel = () => {
    if (!newChannelId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a channel ID",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Channel ID noted",
      description: "To add this channel, update MONITORED_CHANNELS in vietnam-bot edge function"
    });
    setNewChannelId('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5" />
          Telegram Channel Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-primary" />
            Auto-Import Active
          </h4>
          <p className="text-sm text-muted-foreground">
            When the bot sees a property listing in a monitored channel, it automatically:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
            <li>• Detects listings by price, area, and location keywords</li>
            <li>• Parses with AI to extract property details</li>
            <li>• Saves to database (skips duplicates)</li>
            <li>• Adds ✅ reaction to show it was imported</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-3">Monitored Channels</h4>
          <div className="space-y-2">
            {channels.map((channel) => (
              <div 
                key={channel.id} 
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={channel.enabled ? "default" : "secondary"}>
                    {channel.enabled ? "Active" : "Paused"}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Add Channel to Monitor</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Channel ID (e.g., -1001234567890)"
              value={newChannelId}
              onChange={(e) => setNewChannelId(e.target.value)}
            />
            <Button onClick={handleAddChannel}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Get channel ID by forwarding a message from the channel to @userinfobot
          </p>
        </div>

        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">Important</p>
              <p className="text-muted-foreground">
                The bot must be added to the channel/group as admin to read messages.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};