import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Users, Package, ShoppingCart, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import { useOrders } from "@/hooks/useOrders"
import { useProducts } from "@/hooks/useProducts"
import { useTasks } from "@/hooks/useTasks"
import { useUsers } from "@/hooks/useUsers"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

export function Analytics() {
  const { user } = useAuth()
  const { orders, isLoading: ordersLoading } = useOrders()
  const { products, isLoading: productsLoading } = useProducts()
  const { tasks, isLoading: tasksLoading } = useTasks()
  const { users, isLoading: usersLoading } = useUsers()
  
  const [selectedModerator, setSelectedModerator] = useState<string>("all")

  if (ordersLoading || productsLoading || tasksLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Get moderators for filtering (Admin only)
  const moderators = users.filter(u => u.role === 'Moderator')

  // Filter data based on selected moderator (Admin only)
  const filteredOrders = user?.role === 'Admin' && selectedModerator !== "all" 
    ? orders.filter(o => o.moderator_id === selectedModerator)
    : orders

  const filteredTasks = user?.role === 'Admin' && selectedModerator !== "all"
    ? tasks.filter(t => t.assigned_to === selectedModerator)
    : tasks

  // Order statistics with updated statuses
  const totalOrders = filteredOrders.length
  const pendingModeratorOrders = filteredOrders.filter(o => o.status === 'Pending-Moderator').length
  const packageToConfirmationOrders = filteredOrders.filter(o => o.status === 'Package-to-Confirmation').length
  const inReviewOrders = filteredOrders.filter(o => o.status === 'In-Review').length
  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered').length  
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length
  const officeReceivedOrders = filteredOrders.filter(o => o.status === 'Office-Received').length

  // Calculate revenue from delivered orders with proper type conversion
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => {
      const product = products.find(p => p.id === order.product_id)
      const salesPrice = product ? Number(product.sales_price || 0) : 0
      const deliveryCharge = Number(order.delivery_charge || 0)
      return sum + salesPrice + deliveryCharge
    }, 0)

  // Calculate total profit with proper type conversion
  const totalProfit = filteredOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => {
      const product = products.find(p => p.id === order.product_id)
      if (!product) return sum
      const salesPrice = Number(product.sales_price || 0)
      const productionPrice = Number(product.production_price || 0)
      const deliveryCharge = Number(order.delivery_charge || 0)
      return sum + (salesPrice - productionPrice) + deliveryCharge
    }, 0)

  // Task statistics
  const totalTasks = filteredTasks.length
  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending').length
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed').length
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress').length

  // Product statistics
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'Active').length
  const inactiveProducts = products.filter(p => p.status === 'Inactive').length

  // Calculate average order value
  const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0

  // Calculate conversion rate (delivered orders / total orders)
  const conversionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        
        {/* Moderator Filter (Admin only) */}
        {user?.role === 'Admin' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedModerator} onValueChange={setSelectedModerator}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by moderator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moderators</SelectItem>
                {moderators.map((moderator) => (
                  <SelectItem key={moderator.id} value={moderator.id}>
                    {moderator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {deliveredOrders} delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Profit margin: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{Math.round(avgOrderValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per delivered order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>Pending Moderator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{pendingModeratorOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((pendingModeratorOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span>Package to Confirmation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{packageToConfirmationOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((packageToConfirmationOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>In Review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{inReviewOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((inReviewOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{pendingOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Delivered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{deliveredOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">{cancelledOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span>Office Received</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{officeReceivedOrders}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalOrders > 0 ? Math.round((officeReceivedOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Total Tasks</span>
                </div>
                <Badge variant="outline">{totalTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>Pending</span>
                </div>
                <Badge variant="secondary">{pendingTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>In Progress</span>
                </div>
                <Badge variant="secondary">{inProgressTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Completed</span>
                </div>
                <Badge variant="default">{completedTasks}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Products</span>
                <Badge variant="outline">{totalProducts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Products</span>
                <Badge variant="default">{activeProducts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Inactive Products</span>
                <Badge variant="secondary">{inactiveProducts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products
                .sort((a, b) => {
                  const aRevenue = filteredOrders
                    .filter(o => o.product_id === a.id && o.status === 'Delivered')
                    .reduce((sum, order) => sum + Number(a.sales_price || 0), 0)
                  const bRevenue = filteredOrders
                    .filter(o => o.product_id === b.id && o.status === 'Delivered')
                    .reduce((sum, order) => sum + Number(b.sales_price || 0), 0)
                  return bRevenue - aRevenue
                })
                .slice(0, 5)
                .map((product) => {
                  const productRevenue = filteredOrders
                    .filter(o => o.product_id === product.id && o.status === 'Delivered')
                    .reduce((sum, order) => sum + Number(product.sales_price || 0), 0)
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="truncate">{product.name}</span>
                      <span className="font-medium">৳{productRevenue.toLocaleString()}</span>
                    </div>
                  )
                })}
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">No products found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredOrders
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                .slice(0, 5)
                .map((order) => (
                  <div key={order.id} className="flex justify-between text-sm">
                    <span className="truncate">Order #{order.order_id}</span>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                ))}
              {filteredOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
