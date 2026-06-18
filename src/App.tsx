import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Servicos from "./pages/Servicos";
import Blog from "./pages/Blog";
import PostPage from "./pages/PostPage";
import Biblioteca from "./pages/Biblioteca";
import DiagnosticoPage from "./pages/DiagnosticoPage";
import AdminLayout from "./pages/admin/AdminLayout";
import Approvals from "./pages/admin/Approvals";
import AdminCalendar from "./pages/admin/Calendar";
import Metrics from "./pages/admin/Metrics";
import Generate from "./pages/admin/Generate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostPage />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/diagnostico" element={<DiagnosticoPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Approvals />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="generate" element={<Generate />} />
          </Route>
          {/* back-compat: rota antiga protegida por token redireciona pro novo /admin */}
          <Route path="/admin/approvals" element={<Navigate to="/admin" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
