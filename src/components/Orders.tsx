import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Edit, Trash2, Plus, Truck, Filter, Download, MoreHorizontal, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { OrderForm, OrderFormData } from '@/components/forms/OrderForm';
import { Loading, OrderSkeleton } from '@/components/ui/loading';
import { formatCurrency, formatPhoneNumber } from '@/lib/validation';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from '@/lib/InvoiceTemplate';

export function Orders() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moderatorFilter, setModeratorFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { orders, isLoading, createOrder, updateOrder, deleteOrder, dispatchOrder, bulkDispatchOrders, isCreating, isUpdating, isDeleting, isDispatching } = useOrders();
  const { products } = useProducts();
  const { users } = useUsers();

  // Memoized filtered orders
  const displayedOrders = useMemo(() => {
    return user?.role === 'Admin' ? orders : orders.filter((order) => order.moderator_id === user?.id);
  }, [orders, user]);

  const filteredOrders = useMemo(() => {
    return displayedOrders.filter((order) => {
      const matchesSearch =
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mobile_number?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesModerator = moderatorFilter === 'all' || order.moderator_id === moderatorFilter;
      return matchesSearch && matchesStatus && matchesModerator;
    });
  }, [displayedOrders, searchTerm, statusFilter, moderatorFilter]);

  const orderStatuses = [
    'Pending-Moderator',
    'Package to Confirmation',
    'In-Review',
    'Pending',
    'Delivered',
    'Cancelled',
    'Office Received',
  ];

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Delivered':
        return 'default';
      case 'Pending-Moderator':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      case 'In-Review':
        return 'outline';
      case 'Package to Confirmation':
        return 'secondary';
      case 'Pending':
        return 'outline';
      case 'Office Received':
        return 'default';
      default:
        return 'outline';
    }
  }, []);

  const handleCreateOrder = useCallback(
    (data: OrderFormData) => {
      createOrder({
        ...data,
        moderator_id: user?.id,
      });
      setIsCreateDialogOpen(false);
    },
    [createOrder, user?.id]
  );

  const handleEdit = useCallback((order: any) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateOrder = useCallback(
    (data: OrderFormData) => {
      if (editingOrder) {
        updateOrder({ id: editingOrder.id, data });
        setIsEditDialogOpen(false);
        setEditingOrder(null);
      }
    },
    [updateOrder, editingOrder]
  );

  const handleDelete = useCallback(
    async (orderId: string, orderNumber: string) => {
      if (user?.role !== 'Admin') {
        toast({
          title: 'Error',
          description: 'Only admins can delete orders',
          variant: 'destructive',
        });
        return;
      }
      try {
        await deleteOrder(orderId);
        toast({
          title: 'Success',
          description: `Order ${orderNumber} deleted successfully`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete order',
          variant: 'destructive',
        });
      }
    },
    [deleteOrder, user?.role]
  );

  const handleSendToSteadfast = useCallback(
    async (orderId: string, orderNumber: string) => {
      try {
        await dispatchOrder(orderId);
        toast({
          title: 'Success',
          description: `Order ${orderNumber} dispatched to Steadfast`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to dispatch order to Steadfast',
          variant: 'destructive',
        });
      }
    },
    [dispatchOrder]
  );

  const handleBulkDispatch = useCallback(async () => {
    if (user?.role !== 'Admin') {
      toast({
        title: 'Error',
        description: 'Only admins can dispatch orders in bulk',
        variant: 'destructive',
      });
      return;
    }
    if (selectedOrders.length === 0) {
      toast({
        title: 'Error',
        description: 'No orders selected for dispatch',
        variant: 'destructive',
      });
      return;
    }
    try {
      await bulkDispatchOrders(selectedOrders);
      setSelectedOrders([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dispatch some orders',
        variant: 'destructive',
      });
    }
  }, [bulkDispatchOrders, selectedOrders, user?.role]);

  const handleGenerateInvoice = useCallback((order: any) => {
    const product = products.find((p) => p.id === order.product_id);
    const element = document.createElement('div');
    document.body.appendChild(element);

    import('react-dom').then((ReactDOM) => {
      ReactDOM.render(<InvoiceTemplate order={order} product={product} />, element);
      html2pdf()
        .from(element)
        .set({
          margin: 10,
          filename: `invoice-${order.order_id}.pdf`,
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save()
        .then(() => {
          document.body.removeChild(element);
        });
    });
  }, [products]);

  const exportOrders = useCallback(() => {
    const csvContent = [
      ['Order ID', 'Customer Name', 'Mobile', 'Product', 'Quantity', 'Total Amount', 'Status', 'Date'].join(','),
      ...filteredOrders.map((order) => {
        const product = products.find((p) => p.id === order.product_id);
        return [
          order.order_id,
          order.customer_name,
          order.mobile_number,
          product?.name || 'N/A',
          order.quantity || 1,
          (Number(order.total_amount) || 0) + (Number(order.delivery_charge) || 0),
          order.status,
          new Date(order.created_at).toLocaleDateString(),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredOrders, products]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  }, [filteredOrders, selectedOrders]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
        <OrderSkeleton />
      </div>
    );
  }

  // Mobile Card View Component
  const MobileOrderCard = ({ order }: { order: any }) => {
    const product = products.find((p) => p.id === order.product_id);
    const totalAmount = Number(order.total_amount) || 0;
    const deliveryCharge = Number(order.delivery_charge) || 0;
    const grandTotal = totalAmount + deliveryCharge;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{order.order_id}</p>
                <Badge variant={getStatusColor(order.status)} className="text-xs mt-1">
                  {order.status}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(order)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {user?.role === 'Admin' && (
                    <>
                      <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(order.id, order.order_id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      {!order.steadfast_tracking_id && order.status !== 'Cancelled' && (
                        <DropdownMenuItem onClick={() => handleSendToSteadfast(order.id, order.order_id)}>
                          <Truck className="h-4 w-4 mr-2" />
                          Dispatch to Steadfast
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-sm">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">{formatPhoneNumber(order.mobile_number)}</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm">{product?.name || 'Product not found'}</p>
                  <p className="text-xs text-muted-foreground">Qty: {order.quantity || 1}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(grandTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" role="main" aria-label="Orders Management">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user?.role === 'Admin' && selectedOrders.length > 0 && (
            <Button onClick={handleBulkDispatch} disabled={isDispatching} className="w-full sm:w-auto">
              <Truck className="h-4 w-4 mr-2" />
              Dispatch {selectedOrders.length} Orders
            </Button>
          )}
          <Button
            variant="outline"
            onClick={exportOrders}
            className="w-full sm:w-auto"
            disabled={filteredOrders.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <OrderForm
                onSubmit={handleCreateOrder}
                isSubmitting={isCreating}
                submitButtonText="Create Order"
                title="New Order Information"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search by customer name, order ID, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search orders"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === 'Admin' && (
                <Select value={moderatorFilter} onValueChange={setModeratorFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by moderator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moderators</SelectItem>
                    {users.filter((u) => u.role === 'Moderator').map((moderator) => (
                      <SelectItem key={moderator.id} value={moderator.id}>
                        {moderator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List - Mobile vs Desktop */}
      {isMobile ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <MobileOrderCard key={order.id} order={order} />
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || moderatorFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first order'}
              </p>
              {(!searchTerm && statusFilter === 'all' && moderatorFilter === 'all') && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Order
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order List</span>
              <Badge variant="secondary" className="text-sm">
                {filteredOrders.length} orders
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user?.role === 'Admin' && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={handleSelectAll}
                          aria-label="Select all orders"
                        />
                      </TableHead>
                    )}
                    <TableHead className="min-w-32">Order ID</TableHead>
                    <TableHead className="min-w-48">Customer</TableHead>
                    <TableHead className="min-w-32">Product</TableHead>
                    <TableHead className="min-w-20">Qty</TableHead>
                    <TableHead className="min-w-32">Status</TableHead>
                    <TableHead className="min-w-32">Total Amount</TableHead>
                    <TableHead className="min-w-24">Date</TableHead>
                    <TableHead className="min-w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const product = products.find((p) => p.id === order.product_id);
                    const totalAmount = Number(order.total_amount) || 0;
                    const deliveryCharge = Number(order.delivery_charge) || 0;
                    const grandTotal = totalAmount + deliveryCharge;

                    return (
                      <TableRow key={order.id}>
                        {user?.role === 'Admin' && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              aria-label={`Select order ${order.order_id}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-mono">{order.order_id}</span>
                            {order.steadfast_tracking_id && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{formatPhoneNumber(order.mobile_number)}</p>
                            {order.email && (
                              <p className="text-xs text-muted-foreground truncate max-w-32">{order.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product?.name || 'Product not found'}</p>
                            {product && (
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(product.discount_price || product.sales_price)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{order.quantity || 1}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(order.status)} className="whitespace-nowrap">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{formatCurrency(grandTotal)}</p>
                            <p className="text-xs text-muted-foreground">Product: {formatCurrency(totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">Delivery: {formatCurrency(deliveryCharge)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(order)}
                              aria-label={`Edit order ${order.order_id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user?.role === 'Admin' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateInvoice(order)}
                                  aria-label={`Generate invoice for order ${order.order_id}`}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isDeleting}
                                      aria-label={`Delete order ${order.order_id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete order {order.order_id}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(order.id, order.order_id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                {!order.steadfast_tracking_id && order.status !== 'Cancelled' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendToSteadfast(order.id, order.order_id)}
                                    disabled={isDispatching}
                                    aria-label={`Dispatch order ${order.order_id} to Steadfast`}
                                  >
                                    <Truck className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || moderatorFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first order'}
                </p>
                {(!searchTerm && statusFilter === 'all' && moderatorFilter === 'all') && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Order
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order {editingOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              initialData={{
                customer_name: editingOrder.customer_name,
                mobile_number: editingOrder.mobile_number,
                email: editingOrder.email || '',
                address: editingOrder.address,
                product_id: editingOrder.product_id,
                quantity: editingOrder.quantity || 1,
                delivery_charge: editingOrder.delivery_charge || 0,
                order_source: editingOrder.order_source,
                notes: editingOrder.notes || '',
                status: editingOrder.status,
              }}
              onSubmit={handleUpdateOrder}
              isSubmitting={isUpdating}
              submitButtonText="Update Order"
              title="Edit Order Information"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}