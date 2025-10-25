import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Building2, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Ana Siteye Dön</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/admin/companies">
                <Button variant="ghost" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Şirketler
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
