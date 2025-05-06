
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Subscription, useSubscriptions } from "@/contexts/SubscriptionContext";
import { format, subMonths, isAfter } from "date-fns";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  color: string;
}

const Transactions = () => {
  const { subscriptions } = useSubscriptions();
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Generate mock transaction history based on subscriptions and their billing cycles
  useEffect(() => {
    const mockTransactions: Transaction[] = [];
    
    subscriptions.forEach(subscription => {
      // Only show transactions for active subscriptions
      if (!subscription.active) return;
      
      const startDate = new Date(subscription.startDate);
      const now = new Date();
      
      // Calculate billing interval in milliseconds based on billing cycle
      let billingInterval: number;
      switch (subscription.billingCycle) {
        case "weekly":
          billingInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
          break;
        case "monthly":
          billingInterval = 30 * 24 * 60 * 60 * 1000; // ~1 month
          break;
        case "quarterly":
          billingInterval = 90 * 24 * 60 * 60 * 1000; // ~3 months
          break;
        case "yearly":
          billingInterval = 365 * 24 * 60 * 60 * 1000; // ~1 year
          break;
        default:
          billingInterval = 30 * 24 * 60 * 60 * 1000; // Default to monthly
      }
      
      // Generate past transactions based on start date and billing cycle
      let currentDate = new Date(startDate);
      
      while (currentDate <= now) {
        mockTransactions.push({
          id: Math.random().toString(36).substring(2, 15),
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          date: currentDate.toISOString(),
          amount: subscription.amount,
          currency: subscription.currency,
          category: subscription.category,
          color: subscription.color
        });
        
        // Move to next billing date
        currentDate = new Date(currentDate.getTime() + billingInterval);
      }
    });
    
    // Sort by date descending (newest first)
    mockTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setTransactions(mockTransactions);
  }, [subscriptions]);
  
  // Filter transactions based on search and time filter
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply time filter
    if (timeFilter !== "all") {
      const cutoffDate = new Date();
      switch (timeFilter) {
        case "month":
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
        case "year":
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(tx => 
        isAfter(new Date(tx.date), cutoffDate)
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.subscriptionName.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term)
      );
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, timeFilter]);
  
  // Calculate total amount for the filtered transactions
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Group transactions by month for better organization
  const groupTransactionsByMonth = () => {
    const grouped: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = format(date, "MMMM yyyy");
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(tx);
    });
    
    return grouped;
  };
  
  const groupedTransactions = groupTransactionsByMonth();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
      <p className="text-gray-500">
        View all your past subscription payments.
      </p>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                A history of your subscription payments.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={timeFilter}
                onValueChange={setTimeFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Spent</div>
            <div className="text-2xl font-bold">
              ${totalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {filteredTransactions.length} transactions
            </div>
          </div>
          
          {Object.keys(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([month, txs]) => (
              <div key={month} className="mb-8">
                <h3 className="font-medium text-gray-500 mb-2">{month}</h3>
                <div className="space-y-3">
                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: tx.color }}
                        >
                          <span className="text-xs">{tx.subscriptionName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{tx.subscriptionName}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(tx.date), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {tx.currency} {tx.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{tx.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              {searchTerm ? (
                <p className="text-gray-500">Try adjusting your search terms.</p>
              ) : (
                <p className="text-gray-500">Add active subscriptions to see transaction history.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
