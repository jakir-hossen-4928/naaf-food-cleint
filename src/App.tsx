
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ModeratorDashboard } from "@/components/ModeratorDashboard";
import { Orders } from "@/components/Orders";
import { Products } from "@/components/Products";
import { Tasks } from "@/components/Tasks";
import { Analytics } from "@/components/Analytics";
import { CreateOrder } from "@/components/CreateOrder";
import { MyOrders } from "@/components/MyOrders";
import { MyTasks } from "@/components/MyTasks";
import { FollowUps } from "@/components/FollowUps";
import { SMS } from "@/components/SMS";
import { LoginPage } from "@/components/LoginPage";
import { HomePage } from "@/components/HomePage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotFound from "./pages/NotFound";
import { Users } from "@/components/Users";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user, logout } = useAuth();

  const DashboardComponent = user?.role === 'Admin' ? AdminDashboard : ModeratorDashboard;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-lg font-semibold">Order Management System</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-gray-50/50 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardComponent />} />
              
              {/* Admin only routes */}
              <Route path="/orders" element={
                <ProtectedRoute roles={['Admin']}>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute roles={['Admin']}>
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute roles={['Admin']}>
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute roles={['Admin']}>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute roles={['Admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              
              {/* Moderator routes */}
              <Route path="/create-order" element={
                <ProtectedRoute roles={['Moderator']}>
                  <CreateOrder />
                </ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute roles={['Moderator']}>
                  <MyOrders />
                </ProtectedRoute>
              } />
              <Route path="/my-tasks" element={
                <ProtectedRoute roles={['Moderator']}>
                  <MyTasks />
                </ProtectedRoute>
              } />
              <Route path="/follow-ups" element={
                <ProtectedRoute roles={['Moderator']}>
                  <FollowUps />
                </ProtectedRoute>
              } />
              
              {/* Common protected routes */}
              <Route path="/sms" element={
                <ProtectedRoute>
                  <SMS />
                </ProtectedRoute>
              } />
              <Route path="/courier" element={
                <ProtectedRoute>
                  <div className="text-center py-20"><h2 className="text-2xl font-bold">Courier Management</h2><p className="text-muted-foreground">Coming Soon</p></div>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <div className="text-center py-20"><h2 className="text-2xl font-bold">Reports</h2><p className="text-muted-foreground">Coming Soon</p></div>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <div className="text-center py-20"><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground">Coming Soon</p></div>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const ProtectedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Auth state:', { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      {isAuthenticated ? (
        <Route path="/*" element={<AuthenticatedApp />} />
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ProtectedApp />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
