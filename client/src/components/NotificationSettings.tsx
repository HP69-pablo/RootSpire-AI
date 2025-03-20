import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  onSave: (settings: NotificationSettingsValues) => void;
}

export interface NotificationSettingsValues {
  enableNotifications: boolean;
  lowMoistureAlerts: boolean;
  temperatureAlerts: boolean;
  humidityAlerts: boolean;
  email: string;
}

export function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettingsValues>({
    enableNotifications: true,
    lowMoistureAlerts: true,
    temperatureAlerts: false,
    humidityAlerts: false,
    email: ''
  });
  
  const handleToggle = (field: keyof NotificationSettingsValues) => {
    setSettings({
      ...settings,
      [field]: !settings[field as keyof NotificationSettingsValues]
    });
  };
  
  const handleEmailChange = (email: string) => {
    setSettings({
      ...settings,
      email
    });
  };
  
  const handleSave = () => {
    onSave(settings);
    toast({
      title: "Settings saved",
      description: "Your notification settings have been updated successfully.",
    });
  };
  
  return (
    <section>
      <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="notifications-toggle" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <span className="material-icons text-sm text-gray-500">notifications</span>
                <span>Enable Notifications</span>
              </Label>
              <Switch 
                id="notifications-toggle" 
                checked={settings.enableNotifications}
                onCheckedChange={() => handleToggle('enableNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="moisture-toggle" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <span className="material-icons text-sm text-gray-500">water</span>
                <span>Low Moisture Alerts</span>
              </Label>
              <Switch 
                id="moisture-toggle" 
                checked={settings.lowMoistureAlerts}
                onCheckedChange={() => handleToggle('lowMoistureAlerts')}
                disabled={!settings.enableNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="temperature-toggle" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <span className="material-icons text-sm text-gray-500">thermostat</span>
                <span>Temperature Alerts</span>
              </Label>
              <Switch 
                id="temperature-toggle" 
                checked={settings.temperatureAlerts}
                onCheckedChange={() => handleToggle('temperatureAlerts')}
                disabled={!settings.enableNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="humidity-toggle" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <span className="material-icons text-sm text-gray-500">water_drop</span>
                <span>Humidity Alerts</span>
              </Label>
              <Switch 
                id="humidity-toggle" 
                checked={settings.humidityAlerts}
                onCheckedChange={() => handleToggle('humidityAlerts')}
                disabled={!settings.enableNotifications}
              />
            </div>
            
            <div>
              <Label 
                htmlFor="email-input" 
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 mb-2"
              >
                <span className="material-icons text-sm text-gray-500">mail</span>
                <span>Email for Notifications</span>
              </Label>
              <Input 
                id="email-input"
                type="email" 
                placeholder="your@email.com" 
                value={settings.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={!settings.enableNotifications}
              />
            </div>
            
            <Button 
              className="w-full"
              onClick={handleSave}
            >
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
