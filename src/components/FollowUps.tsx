import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageSquare, Phone, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/use-toast"
import { useOrders } from "@/hooks/useOrders"
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp } from "@/hooks/useFollowUps"
import { useUsers } from "@/hooks/useUsers"

export function FollowUps() {
  const { user } = useAuth()
  const { orders } = useOrders()
  const { data: followUps = [], isLoading } = useFollowUps()
  const createFollowUpMutation = useCreateFollowUp()
  const updateFollowUpMutation = useUpdateFollowUp()
  const { users } = useUsers()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [moderatorFilter, setModeratorFilter] = useState("all")
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [reason, setReason] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [notes, setNotes] = useState("")

  // Filter orders and follow-ups based on user role
  const displayedOrders = user?.role === 'Admin' ? orders : orders.filter(order => order.moderator_id === user?.id)
  const displayedFollowUps = user?.role === 'Admin' ? followUps : followUps.filter(fu => fu.moderator_id === user?.id)
  
  const filteredFollowUps = displayedFollowUps.filter(followUp => {
    const matchesSearch = followUp.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         followUp.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || followUp.status === statusFilter
    const matchesPriority = priorityFilter === "all" || followUp.priority === priorityFilter
    const matchesModerator = moderatorFilter === "all" || followUp.moderator_id === moderatorFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesModerator
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': 
      case 'Delivered': return 'default'
      case 'In Review': 
      case 'Package to Confirmation': return 'secondary'
      case 'Pending': 
      case 'Pending Moderator': return 'outline'
      case 'Cancelled': return 'destructive'
      case 'Office Received': return 'default'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive'
      case 'Medium': return 'secondary'
      case 'Low': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered': return CheckCircle
      case 'In Review':
      case 'Package to Confirmation': return Clock
      case 'Pending':
      case 'Pending Moderator': return AlertCircle
      case 'Office Received': return CheckCircle
      case 'Cancelled': return AlertCircle
      default: return Clock
    }
  }

  const getFollowUpCounts = () => {
    return {
      total: displayedFollowUps.length,
      pending: displayedFollowUps.filter(f => f.status === 'Pending' || f.status === 'Pending Moderator').length,
      inProgress: displayedFollowUps.filter(f => f.status === 'In Review' || f.status === 'Package to Confirmation').length,
      completed: displayedFollowUps.filter(f => f.status === 'Completed' || f.status === 'Delivered').length,
      cancelled: displayedFollowUps.filter(f => f.status === 'Cancelled').length
    }
  }

  const counts = getFollowUpCounts()
  const moderators = users.filter(u => u.role === 'Moderator')

  const handleCreateFollowUp = () => {
    const selectedOrder = orders.find(o => o.order_id === selectedOrderId)
    if (!selectedOrder) return

    const followUpData = {
      order_id: selectedOrderId,
      followup_date: followUpDate,
      notes,
      status: 'Pending' as const,
      moderator_id: user?.id
    }

    createFollowUpMutation.mutate(followUpData)
    setSelectedOrderId("")
    setReason("")
    setFollowUpDate("")
    setNotes("")
  }

  const handleSendSMS = (followUpId: string, customerName: string) => {
    toast({
      title: "SMS Sent",
      description: `Follow-up SMS sent to ${customerName}.`,
    })
  }

  const handleMakeCall = (followUpId: string, customerName: string) => {
    toast({
      title: "Call Initiated",
      description: `Calling ${customerName}...`,
    })
  }

  const handleCompleteFollowUp = (followUpId: string) => {
    updateFollowUpMutation.mutate({
      id: followUpId,
      status: 'Completed'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Follow-ups</h1>
            <p className="text-muted-foreground">Loading follow-ups...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Follow-ups</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Customer follow-up tasks and communications</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-fit">
              <MessageSquare className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Follow-up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Select Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayedOrders.map((order) => (
                      <SelectItem key={order.id} value={order.order_id}>
                        {order.order_id} - {order.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Follow-up Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satisfaction">Customer Satisfaction</SelectItem>
                    <SelectItem value="delivery">Delivery Confirmation</SelectItem>
                    <SelectItem value="payment">Payment Issue</SelectItem>
                    <SelectItem value="complaint">Complaint Resolution</SelectItem>
                    <SelectItem value="feedback">Feedback Collection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input 
                  id="followUpDate" 
                  type="date" 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Additional notes..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                <Button 
                  className="w-full sm:w-auto"
                  onClick={handleCreateFollowUp}
                  disabled={createFollowUpMutation.isPending}
                >
                  {createFollowUpMutation.isPending ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Mobile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-muted-foreground">Total Follow-ups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{counts.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{counts.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{counts.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search follow-ups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Pending Moderator">Pending Moderator</SelectItem>
                  <SelectItem value="Package to Confirmation">Package to Confirmation</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Office Received">Office Received</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              {user?.role === 'Admin' && (
                <Select value={moderatorFilter} onValueChange={setModeratorFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups Table - Mobile Responsive */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Follow-up Tasks ({filteredFollowUps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {filteredFollowUps.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-muted-foreground text-sm">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No follow-ups match your filters" 
                    : "No follow-ups scheduled yet"
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredFollowUps.map((followUp) => {
                  const StatusIcon = getStatusIcon(followUp.status)
                  return (
                    <Card key={followUp.followup_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm">{followUp.order_id}</p>
                            <p className="text-xs text-muted-foreground">Follow-up ID: {followUp.followup_id}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant={getStatusColor(followUp.status)} className="text-xs">
                              {followUp.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <StatusIcon className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm line-clamp-2">{followUp.notes}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Date: {new Date(followUp.followup_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSendSMS(followUp.followup_id, followUp.order_id)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            SMS
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMakeCall(followUp.followup_id, followUp.order_id)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          {followUp.status !== 'Completed' && followUp.status !== 'Delivered' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => handleCompleteFollowUp(followUp.followup_id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Follow-up Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFollowUps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                          ? "No follow-ups match your filters" 
                          : "No follow-ups scheduled yet"
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFollowUps.map((followUp) => {
                    const StatusIcon = getStatusIcon(followUp.status)
                    return (
                      <TableRow key={followUp.followup_id}>
                        <TableCell className="font-medium">{followUp.order_id}</TableCell>
                        <TableCell>
                          {new Date(followUp.followup_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{followUp.notes}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(followUp.status)}>
                            {followUp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendSMS(followUp.followup_id, followUp.order_id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="hidden xl:inline ml-1">SMS</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMakeCall(followUp.followup_id, followUp.order_id)}
                            >
                              <Phone className="h-4 w-4" />
                              <span className="hidden xl:inline ml-1">Call</span>
                            </Button>
                            {followUp.status !== 'Completed' && followUp.status !== 'Delivered' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCompleteFollowUp(followUp.followup_id)}
                                disabled={updateFollowUpMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden xl:inline ml-1">Complete</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
