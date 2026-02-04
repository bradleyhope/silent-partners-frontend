import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CanvasThemeProvider } from "./contexts/CanvasThemeContext";
import { OrchestratorProvider } from "./contexts/OrchestratorContext";
import { EnrichQueueProvider } from "./contexts/EnrichQueueContext";
import EnrichQueuePanel from "./components/EnrichQueuePanel";
import Home from "./pages/Home";
import ShareView from "./pages/ShareView";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/share" component={ShareView} />
      <Route path="/share/:id" component={ShareView} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <CanvasThemeProvider>
            <OrchestratorProvider>
              <EnrichQueueProvider>
                <TooltipProvider>
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      style: {
                        fontFamily: "'Source Sans 3', sans-serif",
                      },
                    }}
                  />
                  <Router />
                  <EnrichQueuePanel />
                </TooltipProvider>
              </EnrichQueueProvider>
            </OrchestratorProvider>
          </CanvasThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
