
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingCart, TrendingUp, CheckSquare, DollarSign, Package, Plus, AlertTriangle, Clock } from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedModerator, setSelectedModerator] = useState("all");
  
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { users, isLoading: usersLoading } = useUsers();
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps();

  if (ordersLoading || productsLoading || tasksLoading || usersLoading || followUpsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Filter data by selected moderator
  const moderators = users.filter(u => u.role === 'Moderator');
  const filteredOrders = selectedModerator === "all" ? orders : orders.filter(o => o.moderator_id === selectedModerator);
  const filteredTasks = selectedModerator === "all" ? tasks : tasks.filter(t => t.assigned_to === selectedModerator);
  const filteredFollowUps = selectedModerator === "all" ? followUps : followUps.filter(f => f.moderator_id === selectedModerator);

  // Calculate comprehensive statistics
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered').length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending Moderator').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
  const shippedOrders = filteredOrders.filter(o => o.status === 'Shipped').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending').length;
  const highPriorityTasks = filteredTasks.filter(t => t.priority === 'High' && t.status === 'Pending').length;
  
  // Calculate revenue from delivered orders
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => {
      const product = products.find(p => p.id === order.product_id);
      const salesPrice = product ? parseFloat(product.sales_price) || 0 : 0;
      const deliveryCharge = parseFloat(order.delivery_charge) || 0;
      return sum + salesPrice + deliveryCharge;
    }, 0);

  // Calculate fraud detection stats
  const ordersWithFraudCheck = filteredOrders.filter(o => o.fraud_result && o.fraud_result !== '{}').length;
  const ordersNeedingTracking = filteredOrders.filter(o => !o.steadfast_tracking_id && o.status !== 'Cancelled' && o.status !== 'Delivered').length;

  const statusCounts = {
    'Pending Moderator': pendingOrders,
    'Delivered': deliveredOrders,
    'Cancelled': cancelledOrders,
    'Shipped': shippedOrders,
  };

  // Get recent activities
  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentTasks = filteredTasks
    .filter(t => t.status === 'Pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete system overview and management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedModerator} onValueChange={setSelectedModerator}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by moderator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moderators</SelectItem>
              {moderators.map(moderator => (
                <SelectItem key={moderator.id} value={moderator.id}>
                  {moderator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="w-fit">Administrator</Badge>
          <Button 
            size="sm" 
            onClick={() => navigate('/create-order')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {selectedModerator === "all" ? "All orders" : "Filtered orders"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedModerator === "all" ? "Total revenue" : "Filtered revenue"} (BDT)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Active: {products.filter(p => p.status === 'Active').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              High priority: {highPriorityTasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders ? Math.round((deliveredOrders/totalOrders)*100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {deliveredOrders}/{totalOrders} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Tracking</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersNeedingTracking}</div>
            <p className="text-xs text-muted-foreground">Orders without tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    status === 'Delivered' ? 'default' : 
                    status === 'Cancelled' ? 'destructive' :
                    status === 'Shipped' ? 'secondary' : 'outline'
                  }>
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({totalOrders ? Math.round((count/totalOrders)*100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Operational metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fraud Checked Orders:</span>
              <span className="font-semibold">{ordersWithFraudCheck}/{totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Orders with Tracking:</span>
              <span className="font-semibold">
                {orders.filter(o => o.steadfast_tracking_id).length}/{totalOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Task Completion Rate:</span>
              <span className="font-semibold">
                {tasks.length ? Math.round((tasks.filter(t => t.status === 'Completed').length/tasks.length)*100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Order Value:</span>
              <span className="font-semibold">
                ৳{deliveredOrders ? Math.round(totalRevenue/deliveredOrders) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and High Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activities across all moderators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.order_id} • {new Date(order.created_at).toLocaleDateString()}
                    {order.order_source && ` • ${order.order_source}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!order.steadfast_tracking_id && order.status !== 'Cancelled' && (
                    <Badge variant="outline" className="text-xs">No Tracking</Badge>
                  )}
                  <Badge 
                    variant={
                      order.status === 'Delivered' ? 'default' : 
                      order.status === 'Cancelled' ? 'destructive' : 'secondary'
                    } 
                    className="text-xs"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High Priority Tasks</CardTitle>
            <CardDescription>Urgent tasks requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.task_id} className="flex flex-col gap-2 pb-2 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-2 flex-1">{task.task_details}</p>
                  <Badge 
                    variant={
                      task.priority === 'High' ? 'destructive' : 
                      task.priority === 'Medium' ? 'default' : 'secondary'
                    } 
                    className="text-xs shrink-0"
                  >
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order: {task.order_id} • 
                  {task.due_date && ` Due: ${new Date(task.due_date).toLocaleDateString()}`}
                  {task.assigned_to && ` • Assigned`}
                </p>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No pending tasks</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/orders')}
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              <span className="text-xs">Manage Orders</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/products')}
            >
              <Package className="h-6 w-6 mb-2" />
              <span className="text-xs">Manage Products</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/tasks')}
            >
              <CheckSquare className="h-6 w-6 mb-2" />
              <span className="text-xs">Manage Tasks</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              <span className="text-xs">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
