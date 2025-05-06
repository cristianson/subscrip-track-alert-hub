
import React, { createContext, useContext, useEffect } from "react";
import { useSubscriptions } from "./SubscriptionContext";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/sonner";

interface NotificationContextType {
  sendNotificationEmail: (email: string, subject: string, message: string) => Promise<void>;
  updateNotificationSettings: (daysBefore: number) => void;
  notificationDaysBefore: number;
}

const NotificationContext = createContext<NotificationContextType>({
  sendNotificationEmail: async () => {},
  updateNotificationSettings: () => {},
  notificationDaysBefore: 3,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { subscriptions, updateSubscription } = useSubscriptions();
  const { user } = useAuth();
  const [notificationDaysBefore, setNotificationDaysBefore] = React.useState(3);

  useEffect(() => {
    // Load notification preferences
    if (user) {
      const savedDaysBefore = localStorage.getItem(`notificationDaysBefore-${user.id}`);
      if (savedDaysBefore) {
        setNotificationDaysBefore(parseInt(savedDaysBefore));
      }
    }
  }, [user]);

  useEffect(() => {
    // Simulate checking for subscriptions that need notifications
    if (user && subscriptions.length > 0) {
      checkUpcomingSubscriptions();
    }
  }, [subscriptions, notificationDaysBefore, user]);

  const checkUpcomingSubscriptions = () => {
    const today = new Date();
    
    subscriptions.forEach(subscription => {
      if (!subscription.active) return;
      
      const nextBillingDate = new Date(subscription.nextBillingDate);
      const daysUntilBilling = Math.floor((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilBilling >= 0 && daysUntilBilling <= notificationDaysBefore) {
        // In a real app, this would send an actual email
        console.log(`Would send email for ${subscription.name} due in ${daysUntilBilling} days`);
      }
    });
  };
  
  // This would connect to a backend service in a real app
  const sendNotificationEmail = async (email: string, subject: string, message: string) => {
    // Simulating email sending
    console.log(`Sending email to ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    // In a real app, this would be an API call to your email service
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Email notification would be sent in a real app");
        resolve();
      }, 1000);
    });
  };
  
  const updateNotificationSettings = (daysBefore: number) => {
    if (user) {
      setNotificationDaysBefore(daysBefore);
      localStorage.setItem(`notificationDaysBefore-${user.id}`, daysBefore.toString());
      toast.success(`Notification preference updated to ${daysBefore} days before billing`);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        sendNotificationEmail,
        updateNotificationSettings,
        notificationDaysBefore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
