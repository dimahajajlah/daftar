import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { UserCircle, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">دفتر</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
          نظام إدارة حسابات العملاء والمبيعات الآجلة ببساطة وأمان.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link href="/portal" className="group">
          <Card className="p-8 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-shadow cursor-pointer h-full border-primary/20 hover:border-primary">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">بوابة العميل</h2>
            <p className="text-center text-muted-foreground">
              استعرض حسابك والمشتريات والمدفوعات الخاصة بك.
            </p>
          </Card>
        </Link>

        <Link href="/admin/login" className="group">
          <Card className="p-8 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-shadow cursor-pointer h-full border-accent/20 hover:border-accent">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">لوحة التحكم</h2>
            <p className="text-center text-muted-foreground">
              إدارة العملاء، تسجيل المبيعات والمدفوعات.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
