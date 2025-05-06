
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "@/components/ui/sonner";

const Settings = () => {
  const { user, logout } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { notificationDaysBefore } = useNotifications();
  
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.username || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !username) {
      toast.error("Email and username are required");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSavingProfile(true);
    
    // This would normally call an API to update the user profile
    setTimeout(() => {
      // Update the user in localStorage to simulate a real update
      if (user) {
        const updatedUser = {
          ...user,
          email,
          username
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Force a page reload to update the user context
        window.location.reload();
      }
      
      toast.success("Profile updated successfully");
      setIsSavingProfile(false);
    }, 1000);
  };
  
  const handleExportData = () => {
    // Prepare data to export
    const data = {
      user: {
        username: user?.username,
        email: user?.email
      },
      settings: {
        notificationDaysBefore
      },
      subscriptions
    };
    
    // Convert to JSON and create a downloadable file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscription-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Data exported successfully");
  };
  
  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // This would normally call an API to delete the user account
      
      // Clear all local storage data
      localStorage.clear();
      
      toast.success("Account deleted successfully");
      
      // Redirect to login page
      logout();
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <p className="text-gray-500">
        Manage your account settings and preferences.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account details and email preferences.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  This email will be used for subscription notifications and account updates.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Update Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>
              Manage your data and account settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Export Your Data</h3>
              <p className="text-sm text-gray-500">
                Download all your subscription data and account settings.
              </p>
              <Button variant="outline" onClick={handleExportData}>
                Export Data
              </Button>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
              <p className="text-sm text-gray-500">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
