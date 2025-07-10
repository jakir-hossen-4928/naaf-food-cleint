import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { OrderForm, OrderFormData } from '@/components/forms/OrderForm';
import { toast } from '@/components/ui/use-toast';

export function CreateOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrder, isCreating } = useOrders();

  const handleSubmit = useCallback(
    (data: OrderFormData) => {
      if (!user?.id) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      createOrder({
        ...data,
        moderator_id: user.id,
      });
    },
    [createOrder, user?.id]
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto" role="main" aria-label="Create Order">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create New Order</h1>
            <p className="text-muted-foreground">Fill in the customer and order details</p>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Order</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
            submitButtonText={
              isCreating ? (
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </span>
              )
            }
            title="New Order Information"
          />
        </CardContent>
      </Card>
    </div>
  );
}