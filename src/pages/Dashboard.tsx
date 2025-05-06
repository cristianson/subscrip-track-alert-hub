
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { ArrowRight, Plus, CreditCard, Calendar, AlertCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const { subscriptions, totalMonthlyExpense, getUpcomingPayments } = useSubscriptions();
  const navigate = useNavigate();
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState(getUpcomingPayments(7));
  const [billingSummary, setBillingSummary] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    setUpcomingSubscriptions(getUpcomingPayments(7));
    generateCategoryData();
    generateBillingSummary();
  }, [subscriptions]);

  const generateCategoryData = () => {
    const categoryTotals: Record<string, number> = {};
    
    subscriptions.forEach(sub => {
      if (!sub.active) return;
      
      if (!categoryTotals[sub.category]) {
        categoryTotals[sub.category] = 0;
      }
      
      let monthlyAmount = sub.amount;
      switch (sub.billingCycle) {
        case "yearly":
          monthlyAmount /= 12;
          break;
        case "quarterly":
          monthlyAmount /= 3;
          break;
        case "weekly":
          monthlyAmount *= 4.33;
          break;
      }
      
      categoryTotals[sub.category] += monthlyAmount;
    });
    
    const data = Object.keys(categoryTotals).map(category => ({
      name: category,
      value: Math.round(categoryTotals[category] * 100) / 100
    }));
    
    setCategoryData(data);
  };
  
  const generateBillingSummary = () => {
    const today = new Date();
    const months: Record<string, number> = {};
    
    // Initialize next 6 months
    for (let i = 0; i < 6; i++) {
      const month = addDays(today, i * 30);
      months[format(month, "MMM")] = 0;
    }
    
    subscriptions.forEach(sub => {
      if (!sub.active) return;
      
      const nextBillingDate = new Date(sub.nextBillingDate);
      const billingCycle = sub.billingCycle;
      let cycleInDays = 30; // Default monthly
      
      switch (billingCycle) {
        case "weekly":
          cycleInDays = 7;
          break;
        case "monthly":
          cycleInDays = 30;
          break;
        case "quarterly":
          cycleInDays = 90;
          break;
        case "yearly":
          cycleInDays = 365;
          break;
      }
      
      // Project next 6 payments
      let currentDate = nextBillingDate;
      for (let i = 0; i < 6; i++) {
        if (isBefore(currentDate, addDays(today, 180))) {
          const month = format(currentDate, "MMM");
          if (months[month] !== undefined) {
            months[month] += sub.amount;
          }
          currentDate = addDays(currentDate, cycleInDays);
        }
      }
    });
    
    const data = Object.keys(months).map(month => ({
      month,
      amount: Math.round(months[month] * 100) / 100,
    }));
    
    setBillingSummary(data);
  };

  // Helper function to get the emoji for a category
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      "Entertainment": "🎬",
      "Music": "🎵",
      "Video": "📺",
      "Gaming": "🎮",
      "Software": "💻",
      "Cloud": "☁️",
      "News": "📰",
      "Fitness": "💪",
      "Food": "🍔",
      "Shopping": "🛍️",
      "Other": "📦",
    };
    
    return emojis[category] || "📦";
  };
  
  // Colors for pie chart
  const COLORS = ['#4F46E5', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {user?.username}!</h2>
              <p className="text-gray-500">
                Here's an overview of your subscription expenses.
              </p>
            </div>
            <Button onClick={() => navigate("/subscriptions/add")}>
              <Plus className="mr-2 h-4 w-4" /> Add Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalMonthlyExpense.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-2">/ month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From {subscriptions.filter(s => s.active).length} active subscriptions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Yearly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalMonthlyExpense * 12).toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-2">/ year</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on current subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Next Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSubscriptions.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  ${upcomingSubscriptions[0]?.amount.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {upcomingSubscriptions[0]?.name} on{" "}
                  {format(new Date(upcomingSubscriptions[0]?.nextBillingDate), "MMM dd, yyyy")}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-gray-500 mt-1">No upcoming payments</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and upcoming payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Monthly breakdown of your subscription expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500">
                <p>No data available</p>
                <p className="text-sm">Add subscriptions to see your spending by category</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming billing */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Billing</CardTitle>
            <CardDescription>Projected expenses for the next 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {billingSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingSummary}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Bar dataKey="amount" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500">
                <div>
                  <p>No upcoming billing data</p>
                  <p className="text-sm">Add subscriptions to see future expenses</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming payments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
          <CardDescription>
            Subscriptions due in the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSubscriptions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white`}
                      style={{ backgroundColor: sub.color }}
                    >
                      {getCategoryEmoji(sub.category)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">{sub.name}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(sub.nextBillingDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {sub.currency} {sub.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{sub.billingCycle}</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate("/subscriptions")}
              >
                View All Subscriptions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No upcoming payments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any subscriptions due in the next 7 days.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate("/subscriptions/add")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscription
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
