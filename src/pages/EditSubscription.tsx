
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Subscription, useSubscriptions } from "@/contexts/SubscriptionContext";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EditSubscription = () => {
  const { subscriptions, updateSubscription } = useSubscriptions();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | "weekly" | "quarterly">("monthly");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [nextBillingDate, setNextBillingDate] = useState<Date>(new Date());
  const [website, setWebsite] = useState("");
  const [notifyDaysBefore, setNotifyDaysBefore] = useState("3");
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const sub = subscriptions.find((s) => s.id === id);
      if (sub) {
        setSubscription(sub);
        setName(sub.name);
        setDescription(sub.description || "");
        setAmount(sub.amount.toString());
        setCurrency(sub.currency);
        setBillingCycle(sub.billingCycle);
        setCategory(sub.category);
        setStartDate(new Date(sub.startDate));
        setNextBillingDate(new Date(sub.nextBillingDate));
        setWebsite(sub.website || "");
        setNotifyDaysBefore(sub.notifyDaysBefore.toString());
        setActive(sub.active);
      } else {
        toast.error("Subscription not found");
        navigate("/subscriptions");
      }
    }
  }, [id, subscriptions, navigate]);

  const categories = [
    "Entertainment", 
    "Music", 
    "Video", 
    "Gaming", 
    "Software", 
    "Cloud", 
    "News", 
    "Fitness", 
    "Food", 
    "Shopping", 
    "Other"
  ];
  
  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !subscription) {
      toast.error("Subscription not found");
      return;
    }
    
    if (!name || !amount || !category || !startDate || !nextBillingDate || !notifyDaysBefore) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const notifyDaysBeforeValue = parseInt(notifyDaysBefore);
    if (isNaN(notifyDaysBeforeValue) || notifyDaysBeforeValue < 0) {
      toast.error("Please enter a valid number for notification days");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      updateSubscription(id, {
        name,
        description,
        amount: amountValue,
        currency,
        billingCycle,
        startDate: startDate.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        category,
        notifyDaysBefore: notifyDaysBeforeValue,
        active,
        website,
      });
      
      toast.success("Subscription updated successfully");
      navigate("/subscriptions");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading subscription...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Edit Subscription</h2>
        <p className="text-gray-500">
          Update the details of your subscription below.
        </p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>
              Modify the information about this subscription service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Subscription Status</Label>
                <p className="text-sm text-muted-foreground">
                  {active ? "This subscription is active" : "This subscription is inactive"}
                </p>
              </div>
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Subscription Name *</Label>
                <Input
                  id="name"
                  placeholder="Netflix, Spotify, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="flex">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="ml-2 flex-1"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle *</Label>
                <Select 
                  value={billingCycle} 
                  onValueChange={(value) => setBillingCycle(value as any)} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextBillingDate">Next Billing Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nextBillingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextBillingDate ? format(nextBillingDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={nextBillingDate}
                      onSelect={(date) => date && setNextBillingDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notifyDaysBefore">Notify Days Before *</Label>
                <Input
                  id="notifyDaysBefore"
                  type="number"
                  min="0"
                  placeholder="3"
                  value={notifyDaysBefore}
                  onChange={(e) => setNotifyDaysBefore(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Number of days before the billing date to receive notifications.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this subscription..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/subscriptions")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Subscription"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditSubscription;
