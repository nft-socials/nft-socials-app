import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((_registration) => {
          toast.success('App ready for you!');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Add manifest link if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    // Add theme color meta tag
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#FFD700';
      document.head.appendChild(themeColorMeta);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* <ScaffoldStarkAppWithProviders> */}
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      {/* </ScaffoldStarkAppWithProviders> */}
    </QueryClientProvider>
  );
};

export default App;
