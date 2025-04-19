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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
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
          <Router />
          <ChatBubble />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
