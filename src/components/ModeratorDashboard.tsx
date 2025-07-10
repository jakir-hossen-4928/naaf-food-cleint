
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useTasks } from '@/hooks/useTasks';
import { ShoppingCart, CheckSquare, MessageSquare, Clock, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ModeratorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { tasks, isLoading: tasksLoading } = useTasks();

  if (ordersLoading || tasksLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
  
  // Filter data for current moderator based on actual API data
  const myOrders = orders.filter(order => order.moderator_id === user?.id);
  const myTasks = tasks.filter(task => task.assigned_to === user?.id);
  
  // Updated order status calculations
  const myStats = {
    totalOrders: myOrders.length,
    pendingModeratorOrders: myOrders.filter(o => o.status === 'Pending-Moderator').length,
    packageToConfirmationOrders: myOrders.filter(o => o.status === 'Package-to-Confirmation').length,
    inReviewOrders: myOrders.filter(o => o.status === 'In-Review').length,
    pendingOrders: myOrders.filter(o => o.status === 'Pending').length,
    deliveredOrders: myOrders.filter(o => o.status === 'Delivered').length,
    cancelledOrders: myOrders.filter(o => o.status === 'Cancelled').length,
    officeReceivedOrders: myOrders.filter(o => o.status === 'Office-Received').length,
    pendingTasks: myTasks.filter(t => t.status === 'Pending').length,
    completedTasks: myTasks.filter(t => t.status === 'Completed').length,
    followUps: myOrders.filter(o => !o.steadfast_tracking_id && o.status !== 'Cancelled').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Here's your performance overview
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Badge variant="outline" className="w-fit text-xs sm:text-sm">Moderator</Badge>
          <Button 
            size="sm" 
            className="w-full sm:w-auto text-sm"
            onClick={() => navigate('/create-order')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">My Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total created</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Mod</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.pendingModeratorOrders}</div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Delivered</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">
              Success: {myStats.totalOrders ? Math.round((myStats.deliveredOrders/myStats.totalOrders)*100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Follow-ups</CardTitle>
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.followUps}</div>
            <p className="text-xs text-muted-foreground">Needs tracking</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2 sm:pb-3">
            <div className="text-lg sm:text-2xl font-bold">{myStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks done</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Tasks - Mobile Stacked */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            <CardDescription className="text-sm">Your latest order activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.order_id} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    order.status === 'Delivered' ? 'default' : 
                    order.status === 'Cancelled' ? 'destructive' : 
                    'secondary'
                  } 
                  className="w-fit text-xs sm:text-sm shrink-0"
                >
                  {order.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
            {myOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Pending Tasks</CardTitle>
            <CardDescription className="text-sm">Tasks requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.filter(t => t.status === 'Pending').slice(0, 5).map((task) => (
              <div key={task.task_id} className="flex flex-col gap-2 pb-2 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-2 flex-1">{task.task_details}</p>
                  <Badge 
                    variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'} 
                    className="text-xs shrink-0"
                  >
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order: {task.order_id} • Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                </p>
              </div>
            ))}
            {myTasks.filter(t => t.status === 'Pending').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No pending tasks</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance and Actions - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Performance</CardTitle>
            <CardDescription className="text-sm">Your work statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Success Rate:</span>
                <span className="font-semibold">
                  {myStats.totalOrders ? Math.round((myStats.deliveredOrders/myStats.totalOrders)*100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Task Completion:</span>
                <span className="font-semibold">
                  {myTasks.length ? Math.round((myStats.completedTasks/myTasks.length)*100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Active Orders:</span>
                <span className="font-semibold">{myStats.pendingModeratorOrders + myStats.pendingOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm h-8"
                onClick={() => navigate('/create-order')}
              >
                • Create new order
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm h-8"
                onClick={() => navigate('/sms')}
              >
                • Send customer SMS
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm h-8"
                onClick={() => navigate('/my-orders')}
              >
                • Update order status
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm h-8"
                onClick={() => navigate('/follow-ups')}
              >
                • Complete follow-up
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Today's Goals</CardTitle>
            <CardDescription className="text-sm">Daily targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Process Orders:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{myStats.pendingModeratorOrders}/5</span>
                  <div className="w-12 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((myStats.pendingModeratorOrders/5)*100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Complete Tasks:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{myStats.pendingTasks}/3</span>
                  <div className="w-12 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((myStats.pendingTasks/3)*100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Follow-ups:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{myStats.followUps}/2</span>
                  <div className="w-12 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((myStats.followUps/2)*100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
