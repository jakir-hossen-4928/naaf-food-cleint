
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, User, MapPin, Phone } from 'lucide-react';
import { orderValidationSchema, OrderFormData, sanitizeInput, formatCurrency } from '@/lib/validation';
import { useProducts } from '@/hooks/useProducts';
import { Loading } from '@/components/ui/loading';

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  title?: string;
}

export const OrderForm = React.memo(({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Create Order',
  title = 'Order Information'
}: OrderFormProps) => {
  const { products, isLoading: productsLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderValidationSchema),
    defaultValues: {
      customer_name: initialData?.customer_name || '',
      mobile_number: initialData?.mobile_number || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      product_id: initialData?.product_id || '',
      quantity: initialData?.quantity || 1,
      delivery_charge: initialData?.delivery_charge || 0,
      order_source: initialData?.order_source || undefined,
      notes: initialData?.notes || '',
      status: initialData?.status || 'Pending Moderator'
    }
  });

  const watchedProductId = form.watch('product_id');
  const watchedQuantity = form.watch('quantity');

  // Update selected product when product_id changes
  React.useEffect(() => {
    if (watchedProductId && products) {
      const product = products.find(p => p.id === watchedProductId);
      setSelectedProduct(product);
    }
  }, [watchedProductId, products]);

  const calculateTotal = useCallback(() => {
    if (!selectedProduct || !watchedQuantity) return 0;
    const price = selectedProduct.discount_price || selectedProduct.sales_price;
    return price * watchedQuantity;
  }, [selectedProduct, watchedQuantity]);

  const handleSubmit = useCallback((data: OrderFormData) => {
    // Sanitize all string inputs
    const sanitizedData = {
      ...data,
      customer_name: sanitizeInput(data.customer_name),
      address: sanitizeInput(data.address),
      notes: data.notes ? sanitizeInput(data.notes) : '',
      email: data.email ? sanitizeInput(data.email) : ''
    };
    
    onSubmit(sanitizedData);
  }, [onSubmit]);

  if (productsLoading) {
    return <Loading text="Loading products..." />;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Customer Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Customer Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter customer name"
                          aria-describedby="customer_name_error"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage id="customer_name_error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="01XXXXXXXXX"
                          type="tel"
                          aria-describedby="mobile_number_error"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage id="mobile_number_error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="customer@email.com"
                          type="email"
                          aria-describedby="email_error"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage id="email_error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Order Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-describedby="order_source_error">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Messenger">Messenger</SelectItem>
                          <SelectItem value="Call">Phone Call</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage id="order_source_error" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter complete delivery address with area, city, and postal code"
                        rows={3}
                        aria-describedby="address_error"
                        className="focus:ring-2 focus:ring-primary resize-none"
                      />
                    </FormControl>
                    <FormMessage id="address_error" />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Product Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="required">Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-describedby="product_id_error">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{product.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {formatCurrency(product.discount_price || product.sales_price)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage id="product_id_error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="999"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          aria-describedby="quantity_error"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage id="quantity_error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_charge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Delivery Charge</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          aria-describedby="delivery_charge_error"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage id="delivery_charge_error" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Order Summary */}
              {selectedProduct && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Product Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>{formatCurrency(form.watch('delivery_charge') || 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-2">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(calculateTotal() + (form.watch('delivery_charge') || 0))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any special instructions or notes..."
                        rows={3}
                        className="focus:ring-2 focus:ring-primary resize-none"
                        maxLength={1000}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">
                      {field.value?.length || 0}/1000 characters
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-32"
                size="lg"
              >
                {isSubmitting ? (
                  <Loading size="sm" text="Saving..." />
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

OrderForm.displayName = 'OrderForm';
