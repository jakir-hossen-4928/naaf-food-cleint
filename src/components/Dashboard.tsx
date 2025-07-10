
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { useTasks } from "@/hooks/useTasks"

export function Dashboard() {
  const { orders = [], isLoading: ordersLoading } = useOrders()
  const { products = [], isLoading: productsLoading } = useProducts()
  const { tasks = [], isLoading: tasksLoading } = useTasks()

  if (ordersLoading || productsLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  // Calculate stats based on actual server fields
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length
  const pendingOrders = orders.filter(o => o.status === 'Pending-Moderator').length
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length
  
  // Calculate revenue from delivered orders using actual server fields
  const totalRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => {
      const orderTotal = parseFloat(order.total_amount) || 0
      const deliveryCharge = parseFloat(order.delivery_charge) || 0
      return sum + orderTotal + deliveryCharge
    }, 0)

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      change: "+12.5%",
      changeType: "positive"
    },
    {
      title: "Delivered Orders",
      value: deliveredOrders,
      icon: CheckCircle,
      change: "+8.2%",
      changeType: "positive"
    },
    {
      title: "Total Revenue",
      value: `৳${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: "+15.3%",
      changeType: "positive"
    },
    {
      title: "Cancelled Orders",
      value: cancelledOrders,
      icon: XCircle,
      change: "-2.1%",
      changeType: "negative"
    }
  ]

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
  
  const pendingTasks = tasks.filter(task => task.status === "Pending").slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your order management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const product = products.find(p => p.id === order.product_id)
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.order_id}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.mobile_number}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        order.status === 'Delivered' ? 'default' :
                        order.status === 'Pending-Moderator' ? 'secondary' :
                        order.status === 'Cancelled' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        ৳{((parseFloat(order.total_amount) || 0) + (parseFloat(order.delivery_charge) || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
              {recentOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{task.task_details || task.taskDetails}</p>
                    <p className="text-sm text-muted-foreground">Order: {task.order_id}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      task.priority === 'High' ? 'destructive' :
                      task.priority === 'Medium' ? 'secondary' : 'outline'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No pending tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Delivery Success Rate</span>
                <span className="text-sm font-medium">
                  {totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={totalOrders ? (deliveredOrders / totalOrders) * 100 : 0} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Orders with Tracking</span>
                <span className="text-sm font-medium">
                  {Math.round((orders.filter(o => o.steadfast_tracking_id).length / (totalOrders || 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(orders.filter(o => o.steadfast_tracking_id).length / (totalOrders || 1)) * 100} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active Products</span>
                <span className="text-sm font-medium">
                  {products.filter(p => p.status === 'Active').length}/{products.length}
                </span>
              </div>
              <Progress 
                value={products.length ? (products.filter(p => p.status === 'Active').length / products.length) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
