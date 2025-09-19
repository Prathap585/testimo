import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Clock, Save, RotateCcw, Info, Plus, Trash2, Bell } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Project } from "@shared/schema";

interface ReminderSettingsFormProps {
  project: Project;
}

interface ReminderSchedule {
  offsetDays: number;
  sendTime: string;
  maxAttempts: number;
  cooldownDays: number;
}

interface ReminderSettings {
  enabled: boolean;
  channels: string[];
  schedule: ReminderSchedule[];
  quietHours: {
    start: string;
    end: string;
  };
  timezone: string;
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  channels: ["email"],
  schedule: [
    {
      offsetDays: 3,
      sendTime: "09:00",
      maxAttempts: 3,
      cooldownDays: 7
    }
  ],
  quietHours: {
    start: "22:00",
    end: "08:00"
  },
  timezone: "UTC"
};

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago", 
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney"
];

export default function ReminderSettingsForm({ project }: ReminderSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentSettings = (project.reminderSettings as ReminderSettings) || DEFAULT_REMINDER_SETTINGS;
  
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: currentSettings.enabled || false,
    channels: currentSettings.channels || ["email"],
    schedule: currentSettings.schedule || DEFAULT_REMINDER_SETTINGS.schedule,
    quietHours: currentSettings.quietHours || DEFAULT_REMINDER_SETTINGS.quietHours,
    timezone: currentSettings.timezone || "UTC"
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (reminderSettings: ReminderSettings) => {
      return await apiRequest("PATCH", `/api/projects/${project.id}`, { reminderSettings });
    },
    onSuccess: () => {
      toast({
        title: "Reminder settings updated!",
        description: "Your automated follow-up settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update reminder settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_REMINDER_SETTINGS);
  };

  const addScheduleRule = () => {
    setSettings(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          offsetDays: 7,
          sendTime: "09:00",
          maxAttempts: 2,
          cooldownDays: 5
        }
      ]
    }));
  };

  const removeScheduleRule = (index: number) => {
    setSettings(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const updateScheduleRule = (index: number, field: keyof ReminderSchedule, value: number | string) => {
    setSettings(prev => ({
      ...prev,
      schedule: prev.schedule.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const toggleChannel = (channel: string) => {
    setSettings(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(currentSettings);

  return (
    <Card data-testid="reminder-settings-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Automated Reminder Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasChanges && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Make sure to save your settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Enable/Disable Reminders */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable Automated Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Automatically send follow-up reminders to clients who haven't submitted testimonials
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            data-testid="switch-enable-reminders"
          />
        </div>

        {settings.enabled && (
          <>
            <Separator />

            {/* Reminder Channels */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Reminder Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="channel-email"
                    checked={settings.channels.includes("email")}
                    onChange={() => toggleChannel("email")}
                    className="rounded border-gray-300"
                    data-testid="checkbox-channel-email"
                  />
                  <Label htmlFor="channel-email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="channel-sms"
                    checked={settings.channels.includes("sms")}
                    onChange={() => toggleChannel("sms")}
                    className="rounded border-gray-300"
                    data-testid="checkbox-channel-sms"
                  />
                  <Label htmlFor="channel-sms">SMS</Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which communication channels to use for reminders
              </p>
            </div>

            <Separator />

            {/* Reminder Schedule Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Reminder Schedule</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure when and how often to send reminders
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addScheduleRule}
                  data-testid="button-add-schedule-rule"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              {settings.schedule.map((rule, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label htmlFor={`offset-${index}`} className="text-sm">
                        Days After Initial Request
                      </Label>
                      <Input
                        id={`offset-${index}`}
                        type="number"
                        min="1"
                        max="30"
                        value={rule.offsetDays}
                        onChange={(e) => updateScheduleRule(index, "offsetDays", parseInt(e.target.value) || 1)}
                        data-testid={`input-offset-days-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`time-${index}`} className="text-sm">
                        Send Time
                      </Label>
                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={rule.sendTime}
                        onChange={(e) => updateScheduleRule(index, "sendTime", e.target.value)}
                        data-testid={`input-send-time-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`attempts-${index}`} className="text-sm">
                        Max Attempts
                      </Label>
                      <Input
                        id={`attempts-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        value={rule.maxAttempts}
                        onChange={(e) => updateScheduleRule(index, "maxAttempts", parseInt(e.target.value) || 1)}
                        data-testid={`input-max-attempts-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cooldown-${index}`} className="text-sm">
                        Cooldown (Days)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`cooldown-${index}`}
                          type="number"
                          min="1"
                          max="30"
                          value={rule.cooldownDays}
                          onChange={(e) => updateScheduleRule(index, "cooldownDays", parseInt(e.target.value) || 1)}
                          data-testid={`input-cooldown-days-${index}`}
                        />
                        {settings.schedule.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeScheduleRule(index)}
                            data-testid={`button-remove-rule-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quiet Hours</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start" className="text-sm">
                    Start Time
                  </Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    data-testid="input-quiet-hours-start"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-sm">
                    End Time
                  </Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    data-testid="input-quiet-hours-end"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Reminders won't be sent during these hours
              </p>
            </div>

            {/* Timezone */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-reset-reminder-settings"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || !hasChanges}
            data-testid="button-save-reminder-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}