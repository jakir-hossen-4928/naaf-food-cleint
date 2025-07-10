
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Upload, Send, Users, Wallet, Download, Trash2, Plus } from 'lucide-react';
import { api } from '@/services/apiClient';

interface Order {
  mobile_number: string;
  moderator_id: string;
  [key: string]: any;
}

export function SMS() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [customNumbers, setCustomNumbers] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Get unique customer numbers from orders with proper typing
  const customerNumbers = React.useMemo(() => {
    const typedOrders = (orders as Order[]) || [];
    const filteredOrders = user?.role === 'Admin' ? typedOrders : typedOrders.filter((o: Order) => o.moderator_id === user?.id);
    const uniqueNumbers = Array.from(new Set(filteredOrders.map((order: Order) => order.mobile_number).filter(Boolean)));
    return uniqueNumbers as string[];
  }, [orders, user]);

  const fetchBalance = async () => {
    try {
      const response = await api.getBalance();
      setBalance(response.balance);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SMS balance",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchBalance();
  }, []);

  const handleNumberToggle = (number: string) => {
    setSelectedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const handleSelectAll = () => {
    const allNumbers = [...customerNumbers, ...customNumbers];
    setSelectedNumbers(allNumbers);
  };

  const handleClearSelection = () => {
    setSelectedNumbers([]);
  };

  const handleAddCustomNumber = () => {
    if (newNumber.trim() && !customNumbers.includes(newNumber.trim())) {
      setCustomNumbers(prev => [...prev, newNumber.trim()]);
      setNewNumber('');
    }
  };

  const handleRemoveCustomNumber = (number: string) => {
    setCustomNumbers(prev => prev.filter(n => n !== number));
    setSelectedNumbers(prev => prev.filter(n => n !== number));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const numbers: string[] = [];

      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine && /^\d+$/.test(cleanLine)) {
          numbers.push(cleanLine);
        }
      });

      const newNumbers = numbers.filter(num => !customNumbers.includes(num));
      setCustomNumbers(prev => [...prev, ...newNumbers]);
      
      toast({
        title: "Success",
        description: `Imported ${newNumbers.length} new numbers`,
      });
    };

    reader.readAsText(file);
  };

  const handleSendSMS = async () => {
    if (!message.trim() || selectedNumbers.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a message and select at least one number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const numbersString = selectedNumbers.join(',');
      await api.sendSMS({
        number: numbersString,
        message: message.trim()
      });

      toast({
        title: "Success",
        description: `SMS sent to ${selectedNumbers.length} numbers`,
      });

      setMessage('');
      setSelectedNumbers([]);
      fetchBalance(); // Refresh balance after sending
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportNumbers = () => {
    const allNumbers = [...customerNumbers, ...customNumbers];
    const csvContent = allNumbers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phone-numbers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">SMS Management</h1>
          <p className="text-muted-foreground">Send SMS to customers and manage phone numbers</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Balance: {balance !== null ? `৳${balance}` : 'Loading...'}
              </span>
            </div>
          </Card>
          <Button onClick={fetchBalance} variant="outline" size="sm">
            Refresh Balance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phone Numbers Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Phone Numbers
            </CardTitle>
            <CardDescription>
              Select numbers to send SMS. Total available: {customerNumbers.length + customNumbers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="customers" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customers">Customer Numbers ({customerNumbers.length})</TabsTrigger>
                <TabsTrigger value="custom">Custom Numbers ({customNumbers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="customers" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {customerNumbers.map((number: string) => (
                    <Badge
                      key={number}
                      variant={selectedNumbers.includes(number) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleNumberToggle(number)}
                    >
                      {number}
                    </Badge>
                  ))}
                  {customerNumbers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No customer numbers available</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter phone number"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomNumber()}
                  />
                  <Button onClick={handleAddCustomNumber} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportNumbers}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {customNumbers.map((number: string) => (
                    <Badge
                      key={number}
                      variant={selectedNumbers.includes(number) ? "default" : "outline"}
                      className="cursor-pointer group"
                      onClick={() => handleNumberToggle(number)}
                    >
                      {number}
                      <Trash2
                        className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomNumber(number);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                Select All ({customerNumbers.length + customNumbers.length})
              </Button>
              <Button onClick={handleClearSelection} variant="outline" size="sm">
                Clear Selection
              </Button>
              <Badge variant="secondary">
                Selected: {selectedNumbers.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* SMS Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Compose SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your SMS message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Characters: {message.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="p-2 border rounded-md bg-muted/50 max-h-32 overflow-y-auto">
                {selectedNumbers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedNumbers.slice(0, 5).map((number: string) => (
                      <Badge key={number} variant="secondary" className="text-xs">
                        {number}
                      </Badge>
                    ))}
                    {selectedNumbers.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedNumbers.length - 5} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recipients selected</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleSendSMS}
              disabled={loading || !message.trim() || selectedNumbers.length === 0}
              className="w-full"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS ({selectedNumbers.length})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
