
import { useState } from "react"
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  BarChart3, 
  Settings,
  FileText,
  TruckIcon,
  User
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"

const adminItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Products", url: "/products", icon: Package },
  { title: "Users", url: "/users", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "SMS", url: "/sms", icon: MessageSquare },
  { title: "Courier", url: "/courier", icon: TruckIcon },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
]

const moderatorItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "My Orders", url: "/my-orders", icon: ShoppingCart },
  { title: "Create Order", url: "/create-order", icon: Package },
  { title: "My Tasks", url: "/my-tasks", icon: CheckSquare },
  { title: "Follow-ups", url: "/follow-ups", icon: MessageSquare },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const { user } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  
  const items = user?.role === "Admin" ? adminItems : moderatorItems

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }
  
  const getNavCls = (path: string) => 
    isActive(path) ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <Avatar className="h-8 w-8 mx-auto">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </SidebarHeader>

      <SidebarContent>
        <div className="p-4">
          <h2 className={`font-bold text-xl ${isCollapsed ? 'hidden' : 'block'}`}>
            Order System
          </h2>
          {isCollapsed && <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">OS</div>}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
