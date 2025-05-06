
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "./AuthContext";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly" | "quarterly";
  startDate: string;
  nextBillingDate: string;
  category: string;
  color: string;
  notifyDaysBefore: number;
  active: boolean;
  website?: string;
}

interface SubscriptionContextType {
  subscriptions: Subscription[];
  addSubscription: (subscription: Omit<Subscription, "id" | "userId">) => void;
  updateSubscription: (id: string, subscription: Partial<Omit<Subscription, "id" | "userId">>) => void;
  deleteSubscription: (id: string) => void;
  getUpcomingPayments: (days: number) => Subscription[];
  totalMonthlyExpense: number;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscriptions: [],
  addSubscription: () => {},
  updateSubscription: () => {},
  deleteSubscription: () => {},
  getUpcomingPayments: () => [],
  totalMonthlyExpense: 0,
});

const SUBSCRIPTION_COLORS = [
  "subscription-blue",
  "subscription-indigo",
  "subscription-purple",
  "subscription-pink",
  "subscription-teal",
  "subscription-green",
];

export const useSubscriptions = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalMonthlyExpense, setTotalMonthlyExpense] = useState(0);

  useEffect(() => {
    // Load subscriptions from localStorage when user changes
    if (user) {
      const savedSubscriptions = localStorage.getItem(`subscriptions-${user.id}`);
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      }
    } else {
      setSubscriptions([]);
    }
  }, [user]);

  // Calculate total monthly expense whenever subscriptions change
  useEffect(() => {
    if (subscriptions.length > 0) {
      const total = subscriptions.reduce((sum, sub) => {
        let monthlyAmount = sub.amount;
        
        // Convert different billing cycles to monthly equivalent
        switch (sub.billingCycle) {
          case "yearly":
            monthlyAmount /= 12;
            break;
          case "quarterly":
            monthlyAmount /= 3;
            break;
          case "weekly":
            monthlyAmount *= 4.33; // Average weeks in a month
            break;
        }
        
        return sum + (sub.active ? monthlyAmount : 0);
      }, 0);
      
      setTotalMonthlyExpense(total);
      
      // Save subscriptions to localStorage
      if (user) {
        localStorage.setItem(`subscriptions-${user.id}`, JSON.stringify(subscriptions));
      }
    } else {
      setTotalMonthlyExpense(0);
    }
  }, [subscriptions, user]);

  const addSubscription = (subscription: Omit<Subscription, "id" | "userId">) => {
    if (!user) {
      toast.error("You must be logged in to add subscriptions");
      return;
    }
    
    const newSubscription: Subscription = {
      ...subscription,
      id: Math.random().toString(36).substring(2, 15),
      userId: user.id,
      color: subscription.color || SUBSCRIPTION_COLORS[Math.floor(Math.random() * SUBSCRIPTION_COLORS.length)]
    };
    
    setSubscriptions((prev) => [...prev, newSubscription]);
    toast.success(`Added ${subscription.name} subscription`);
  };

  const updateSubscription = (id: string, subscription: Partial<Omit<Subscription, "id" | "userId">>) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...subscription } : sub))
    );
    toast.success("Subscription updated");
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    toast.success("Subscription deleted");
  };

  const getUpcomingPayments = (days: number = 7): Subscription[] => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return subscriptions.filter((sub) => {
      if (!sub.active) return false;
      const nextBilling = new Date(sub.nextBillingDate);
      return nextBilling >= now && nextBilling <= futureDate;
    }).sort((a, b) => {
      return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
    });
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        getUpcomingPayments,
        totalMonthlyExpense,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
