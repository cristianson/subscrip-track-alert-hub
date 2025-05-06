
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Subscription, useSubscriptions } from "@/contexts/SubscriptionContext";
import { format } from "date-fns";
import { ArrowUpDown, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const Subscriptions = () => {
  const { subscriptions, deleteSubscription, updateSubscription } = useSubscriptions();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "amount" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "inactive">("all");
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    let filtered = [...subscriptions];
    
    // Apply filter
    if (filterBy === "active") {
      filtered = filtered.filter((sub) => sub.active);
    } else if (filterBy === "inactive") {
      filtered = filtered.filter((sub) => !sub.active);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else {
        // date
        return sortDirection === "asc"
          ? new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()
          : new Date(b.nextBillingDate).getTime() - new Date(a.nextBillingDate).getTime();
      }
    });
    
    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, sortBy, sortDirection, filterBy]);

  const handleSort = (newSortBy: "name" | "amount" | "date") => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("asc");
    }
  };

  const toggleSubscriptionStatus = (subscription: Subscription) => {
    updateSubscription(subscription.id, { active: !subscription.active });
    toast.success(
      `${subscription.name} ${!subscription.active ? "activated" : "deactivated"}`
    );
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

  const getBillingCycleText = (cycle: string, amount: number) => {
    switch (cycle) {
      case "weekly":
        return `${amount.toFixed(2)} / week`;
      case "monthly":
        return `${amount.toFixed(2)} / month`;
      case "quarterly":
        return `${amount.toFixed(2)} / quarter`;
      case "yearly":
        return `${amount.toFixed(2)} / year`;
      default:
        return `${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
        <Button onClick={() => navigate("/subscriptions/add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Subscription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Manage Subscriptions</CardTitle>
              <CardDescription>
                View and manage all your subscriptions in one place.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as any)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 py-2 px-4 font-medium text-sm text-gray-600">
                <div className="col-span-5 sm:col-span-4 flex items-center">
                  <button 
                    className="flex items-center" 
                    onClick={() => handleSort("name")}
                  >
                    Subscription
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </button>
                </div>
                <div className="col-span-3 hidden sm:block">Category</div>
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end">
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </button>
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                  <button
                    className="flex items-center"
                    onClick={() => handleSort("date")}
                  >
                    Next Payment
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </button>
                </div>
                <div className="hidden sm:block sm:col-span-1"></div>
              </div>
              
              {filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className={`grid grid-cols-12 gap-4 p-4 rounded-lg border ${
                    subscription.active ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className="col-span-5 sm:col-span-4 flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white`}
                      style={{ backgroundColor: subscription.color }}
                    >
                      {getCategoryEmoji(subscription.category)}
                    </div>
                    <div className="ml-3 truncate">
                      <div className="font-medium">{subscription.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {subscription.description || "No description"}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 hidden sm:flex sm:items-center">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {subscription.category}
                    </span>
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col items-end justify-center">
                    <div className="font-medium">
                      {subscription.currency} {subscription.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {subscription.billingCycle}
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                    <div className="text-sm">
                      {format(new Date(subscription.nextBillingDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="hidden sm:flex sm:col-span-1 sm:items-center sm:justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/subscriptions/edit/${subscription.id}`)
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleSubscriptionStatus(subscription)}
                        >
                          {subscription.active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this subscription?"
                              )
                            ) {
                              deleteSubscription(subscription.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
              {searchTerm || filterBy !== "all" ? (
                <p className="text-gray-500 mb-6">Try adjusting your search or filter.</p>
              ) : (
                <p className="text-gray-500 mb-6">Get started by adding your first subscription.</p>
              )}
              <Button onClick={() => navigate("/subscriptions/add")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
