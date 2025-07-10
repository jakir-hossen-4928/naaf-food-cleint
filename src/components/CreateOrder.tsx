
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Phone, Mail, MapPin, Package, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { useAuth } from "@/contexts/AuthContext"

export function CreateOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createOrder, isCreating } = useOrders()
  const { products } = useProducts()
  
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    address: "",
    product_id: "",
    quantity: 1,
    delivery_charge: 0,
    order_source: "",
    notes: "",
    status: "Pending-Moderator"
  })

  const selectedProduct = products.find(p => p.id === formData.product_id)
  const productPrice = selectedProduct ? (selectedProduct.discount_price || selectedProduct.sales_price) : 0
  const productTotal = productPrice * formData.quantity
  const grandTotal = productTotal + formData.delivery_charge

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const orderData = {
      customer_name: formData.name,
      mobile_number: formData.mobile_number,
      email: formData.email,
      address: formData.address,
      product_id: formData.product_id,
      quantity: formData.quantity,
      order_source: formData.order_source,
      delivery_charge: formData.delivery_charge,
      notes: formData.notes,
      moderator_id: user?.id,
      status: formData.status,
    }

    createOrder(orderData)
    
    // Reset form
    setFormData({
      name: "",
      mobile_number: "",
      email: "",
      address: "",
      product_id: "",
      quantity: 1,
      delivery_charge: 0,
      order_source: "",
      notes: "",
      status: "Pending-Moderator"
    })
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create New Order</h1>
            <p className="text-muted-foreground">Fill in the customer and order details</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          New Order
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) => handleChange('mobile_number', e.target.value)}
                  placeholder="+88 01XXXXXXXXX"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="customer@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter complete delivery address"
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_charge">Delivery Charge *</Label>
              <Input
                id="delivery_charge"
                type="number"
                step="0.01"
                value={formData.delivery_charge}
                onChange={(e) => handleChange('delivery_charge', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={formData.product_id} onValueChange={(value) => handleChange('product_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ৳{product.discount_price || product.sales_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  required
                />
              </div>
            </div>
            
            {/* Order Summary */}
            {selectedProduct && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Product ({selectedProduct.name}):</span>
                    <span>৳{productPrice} × {formData.quantity} = ৳{productTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>৳{formData.delivery_charge}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Grand Total:</span>
                    <span>৳{grandTotal}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order_source">Order Source *</Label>
              <Select value={formData.order_source} onValueChange={(value) => handleChange('order_source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Messenger">Messenger</SelectItem>
                  <SelectItem value="Call">Phone Call</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isCreating || !formData.product_id}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
