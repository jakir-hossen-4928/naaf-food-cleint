
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
import { mockAnalytics, mockOrders, mockTasks } from "@/data/mockData"

export function Dashboard() {
  const stats = [
    {
      title: "Total Orders",
      value: mockAnalytics.totalOrders,
      icon: ShoppingCart,
      change: "+12.5%",
      changeType: "positive"
    },
    {
      title: "Delivered Orders",
      value: mockAnalytics.deliveredOrders,
      icon: CheckCircle,
      change: "+8.2%",
      changeType: "positive"
    },
    {
      title: "Total Revenue",
      value: `$${mockAnalytics.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: "+15.3%",
      changeType: "positive"
    },
    {
      title: "Cancelled Orders",
      value: mockAnalytics.cancelledOrders,
      icon: XCircle,
      change: "-2.1%",
      changeType: "negative"
    }
  ]

  const recentOrders = mockOrders.slice(0, 5)
  const pendingTasks = mockTasks.filter(task => task.status === "Pending")

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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      order.status === 'Delivered' ? 'default' :
                      order.status === 'Pending' ? 'secondary' :
                      order.status === 'Cancelled' ? 'destructive' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
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
                    <p className="font-medium">{task.taskDetails}</p>
                    <p className="text-sm text-muted-foreground">Order: {task.orderId}</p>
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
                <span className="text-sm">Conversion Rate</span>
                <span className="text-sm font-medium">{mockAnalytics.conversionRate}%</span>
              </div>
              <Progress value={mockAnalytics.conversionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Delivery Success</span>
                <span className="text-sm font-medium">
                  {Math.round((mockAnalytics.deliveredOrders / mockAnalytics.totalOrders) * 100)}%
                </span>
              </div>
              <Progress 
                value={(mockAnalytics.deliveredOrders / mockAnalytics.totalOrders) * 100} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Growth</span>
                <span className="text-sm font-medium">{mockAnalytics.monthlyGrowth}%</span>
              </div>
              <Progress value={mockAnalytics.monthlyGrowth} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
