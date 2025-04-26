import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PlantChat from "@/pages/PlantChat";
import Login from "@/pages/Login";
import MyPlants from "@/pages/MyPlants";
import Settings from "@/pages/Settings";
import { ThemeProvider } from "./lib/ThemeProvider";
import { AuthProvider } from "./lib/AuthProvider";
import { ChatBubble } from "@/components/ChatBubble";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { DataCollector } from "@/components/DataCollector";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chat" component={PlantChat} />
      <Route path="/login" component={Login} />
      <Route path="/my-plants" component={MyPlants} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="fitness-app-bg min-h-screen pb-24"> 
            {/* The fitness-app-bg class now handles both light and dark modes properly */}
            <Router />
            <ChatBubble />
            <FloatingNavigation />
            <Toaster />
            {/* Data collector runs in the background with no UI */}
            <DataCollector />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
