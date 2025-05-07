import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions, Subscription } from "@/contexts/SubscriptionContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { format, addDays } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { Bell, Mail } from "lucide-react";

const Notifications = () => {
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { notificationDaysBefore, updateNotificationSettings, sendNotificationEmail } = useNotifications();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [days, setDays] = useState(notificationDaysBefore);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  
  const getUpcomingNotifications = () => {
    const today = new Date();
    
    return subscriptions
      .filter((sub) => sub.active)
      .map((sub) => ({
        ...sub,
        daysUntilBilling: Math.floor(
          (new Date(sub.nextBillingDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .filter((sub) => sub.daysUntilBilling >= 0 && sub.daysUntilBilling <= days)
      .sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
  };
  
  const upcomingNotifications = getUpcomingNotifications();
  
  const handleDaysChange = (value: number[]) => {
    setDays(value[0]);
  };
  
  const handleSaveSettings = () => {
    updateNotificationSettings(days);
  };
  
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setSendingTest(true);
    
    try {
      await sendNotificationEmail(
        testEmailAddress,
        "SubscripTrack: Test Notification Email",
        `This is a test email from SubscripTrack. You will receive notifications about your subscriptions ${days} days before they're due.`
      );
      
      toast.success("Test notification sent successfully!");
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email. Please try again.");
    } finally {
      setSendingTest(false);
    }
  };
  
  const formatNotificationDate = (subscription: Subscription & { daysUntilBilling: number }) => {
    const notifyDate = addDays(
      new Date(),
      subscription.daysUntilBilling - subscription.notifyDaysBefore
    );
    
    if (subscription.notifyDaysBefore > subscription.daysUntilBilling) {
      return "Today";
    }
    
    return format(notifyDate, "MMM dd, yyyy");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
      <p className="text-gray-500">
        Manage how and when you receive notifications about your subscriptions.
      </p>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure when you want to be notified about upcoming payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications" className="text-base">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive email alerts before your subscriptions renew.
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyDays" className="text-base">
                    Notification Days
                  </Label>
                  <span className="text-sm font-medium">{days} days before</span>
                </div>
                <Slider
                  id="notifyDays"
                  min={1}
                  max={14}
                  step={1}
                  value={[days]}
                  onValueChange={handleDaysChange}
                />
                <p className="text-sm text-gray-500">
                  You will be notified {days} days before your subscriptions are due.
                </p>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Test Notifications</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSendTestEmail} 
                  disabled={sendingTest}
                >
                  {sendingTest ? "Sending..." : "Send Test Notification"}
                </Button>
                <p className="text-xs text-gray-500">
                  This will send a test notification to the specified email address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Notifications</CardTitle>
            <CardDescription>
              Notifications that will be sent in the next {days} days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingNotifications.length > 0 ? (
              <div className="space-y-4">
                {upcomingNotifications.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white`}
                        style={{ backgroundColor: sub.color }}
                      >
                        <Bell className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{sub.name}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-500">
                        <span>Due in {sub.daysUntilBilling} days</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Notify on {formatNotificationDate(sub)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-medium">
                        {sub.currency} {sub.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No upcoming notifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any subscriptions due in the next {days} days.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
