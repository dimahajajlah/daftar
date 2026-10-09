import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  useAdminLogout, 
  useAdminMe, 
  getAdminMeQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, LayoutDashboard, Users, FileUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logout = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
        setLocation("/admin/login");
      }
    }
  });

  const { data: session } = useAdminMe();

  const navLinks = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/admin/customers", label: "العملاء", icon: Users },
    { href: "/admin/import", label: "استيراد", icon: FileUp },
  ];

  return (
    <div className="min-h-[100dvh] bg-muted/30 flex flex-col">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-12">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const active = location === link.href;
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} className="w-full">
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 text-lg h-12"
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                  <div className="flex-1" />
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-3 mt-8"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    <LogOut className="h-5 w-5" />
                    تسجيل الخروج
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">دفتر</span>
              <span className="text-muted-foreground hidden sm:inline-block">/ لوحة التحكم</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 mr-8">
              {navLinks.map((link) => {
                const active = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button variant={active ? "secondary" : "ghost"} className="text-base">
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex gap-2 text-muted-foreground hover:text-destructive"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
