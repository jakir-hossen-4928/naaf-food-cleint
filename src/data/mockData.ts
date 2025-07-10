
export const mockProducts = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 199.99,
    salesPrice: 149.99,
    productionPrice: 80.00,
    discountPrice: 129.99,
    manufacturerPrice: 75.00,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    status: "Active"
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    price: 299.99,
    salesPrice: 249.99,
    productionPrice: 120.00,
    discountPrice: 199.99,
    manufacturerPrice: 110.00,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    status: "Active"
  },
  {
    id: "3",
    name: "Bluetooth Speaker",
    price: 89.99,
    salesPrice: 69.99,
    productionPrice: 35.00,
    discountPrice: 49.99,
    manufacturerPrice: 30.00,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    status: "Inactive"
  }
]

export const mockOrders = [
  {
    id: "NF-001",
    customerName: "John Doe",
    mobileNumber: "+1234567890",
    email: "john@example.com",
    address: "123 Main St, New York, NY 10001",
    moderatorId: "mod1",
    moderatorName: "Alice Johnson",
    notes: "Customer prefers morning delivery",
    productId: "1",
    productName: "Premium Wireless Headphones",
    orderSource: "Messenger",
    fraudCheckResult: { risk: "low", score: 0.2 },
    deliveryCharge: 15.00,
    status: "Pending",
    createdDate: "2024-01-15T10:30:00Z",
    updatedDate: "2024-01-15T14:20:00Z",
    steadfastTrackingId: "ST123456",
    followUpDate: "2024-01-20T09:00:00Z",
    followUpNotes: "Check delivery status",
    followUpStatus: "Pending"
  },
  {
    id: "NF-002",
    customerName: "Sarah Smith",
    mobileNumber: "+1234567891",
    email: "sarah@example.com",
    address: "456 Oak Ave, Los Angeles, CA 90210",
    moderatorId: "mod2",
    moderatorName: "Bob Wilson",
    notes: "Fragile item, handle with care",
    productId: "2",
    productName: "Smart Fitness Watch",
    orderSource: "Call",
    fraudCheckResult: { risk: "medium", score: 0.6 },
    deliveryCharge: 12.00,
    status: "Delivered",
    createdDate: "2024-01-14T15:45:00Z",
    updatedDate: "2024-01-16T11:30:00Z",
    steadfastTrackingId: "ST123457",
    followUpDate: null,
    followUpNotes: null,
    followUpStatus: "Completed"
  },
  {
    id: "NF-003",
    customerName: "Mike Johnson",
    mobileNumber: "+1234567892",
    email: "mike@example.com",
    address: "789 Pine St, Chicago, IL 60601",
    moderatorId: "mod1",
    moderatorName: "Alice Johnson",
    notes: "Customer requested express delivery",
    productId: "3",
    productName: "Bluetooth Speaker",
    orderSource: "WhatsApp",
    fraudCheckResult: { risk: "high", score: 0.8 },
    deliveryCharge: 20.00,
    status: "Cancelled",
    createdDate: "2024-01-13T09:15:00Z",
    updatedDate: "2024-01-14T16:00:00Z",
    steadfastTrackingId: null,
    followUpDate: "2024-01-25T10:00:00Z",
    followUpNotes: "Follow up on cancellation reason",
    followUpStatus: "Pending"
  }
]

export const mockUsers = [
  {
    id: "admin1",
    name: "Admin User",
    email: "admin@company.com",
    mobileNumber: "+1234567000",
    telegramChatId: "admin_chat_123",
    botToken: "bot_token_admin",
    role: "Admin",
    status: "Active"
  },
  {
    id: "mod1",
    name: "Alice Johnson",
    email: "alice@company.com",
    mobileNumber: "+1234567001",
    telegramChatId: "mod1_chat_456",
    botToken: "bot_token_mod1",
    role: "Moderator",
    status: "Active"
  },
  {
    id: "mod2",
    name: "Bob Wilson",
    email: "bob@company.com",
    mobileNumber: "+1234567002",
    telegramChatId: "mod2_chat_789",
    botToken: "bot_token_mod2",
    role: "Moderator",
    status: "Active"
  }
]

export const mockTasks = [
  {
    id: "task1",
    orderId: "NF-001",
    taskDetails: "Verify customer address and contact information",
    assignedToId: "mod1",
    assignedToName: "Alice Johnson",
    status: "Pending",
    createdDate: "2024-01-15T10:30:00Z",
    dueDate: "2024-01-16T18:00:00Z",
    priority: "High"
  },
  {
    id: "task2",
    orderId: "NF-002",
    taskDetails: "Follow up on delivery confirmation",
    assignedToId: "mod2",
    assignedToName: "Bob Wilson",
    status: "Completed",
    createdDate: "2024-01-14T15:45:00Z",
    dueDate: "2024-01-17T12:00:00Z",
    priority: "Medium"
  },
  {
    id: "task3",
    orderId: "NF-003",
    taskDetails: "Process cancellation and refund",
    assignedToId: "mod1",
    assignedToName: "Alice Johnson",
    status: "In Progress",
    createdDate: "2024-01-13T09:15:00Z",
    dueDate: "2024-01-15T17:00:00Z",
    priority: "High"
  }
]

export const mockAnalytics = {
  totalOrders: 156,
  deliveredOrders: 123,
  cancelledOrders: 18,
  pendingOrders: 15,
  totalRevenue: 18750.50,
  totalProfit: 7890.25,
  deliveryRevenue: 1875.00,
  cancellationCost: 450.00,
  monthlyGrowth: 12.5,
  conversionRate: 78.8
}
