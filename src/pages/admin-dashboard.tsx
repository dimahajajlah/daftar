import { Link } from "wouter";
import { useGetAdminSummary, useListRecentTransactions, useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, CreditCard, AlertCircle, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetAdminSummary();
  const { data: recentTransactions, isLoading: loadingRecent } = useListRecentTransactions({ limit: 10 });
  const { data: customers, isLoading: loadingCustomers } = useListCustomers();

  const owingCustomers = customers?.filter((c) => c.balance > 0) || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">نظرة عامة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي المبيعات"
          value={summary ? formatCurrency(summary.totalPurchases) : null}
          icon={<ShoppingBag className="w-5 h-5 text-primary" />}
          loading={loadingSummary}
        />
        <MetricCard
          title="إجمالي المدفوعات"
          value={summary ? formatCurrency(summary.totalPayments) : null}
          icon={<CreditCard className="w-5 h-5 text-green-600" />}
          loading={loadingSummary}
        />
        <MetricCard
          title="إجمالي المتأخرات"
          value={summary ? formatCurrency(summary.totalOutstanding) : null}
          icon={<AlertCircle className="w-5 h-5 text-destructive" />}
          loading={loadingSummary}
        />
        <MetricCard
          title="العملاء المدينين"
          value={summary ? summary.customersWithBalance.toString() : null}
          icon={<Users className="w-5 h-5 text-accent" />}
          loading={loadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            أحدث العمليات
          </h2>
          {loadingRecent ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : recentTransactions?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">لا توجد عمليات مسجلة</Card>
          ) : (
            <div className="space-y-4">
              {recentTransactions?.map((tx) => {
                const isPurchase = tx.type === "purchase";
                return (
                  <Card key={tx.id} className="p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${isPurchase ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {isPurchase ? <ShoppingBag className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{formatCurrency(tx.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.customerName} • {formatDate(tx.occurredAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={isPurchase ? "destructive" : "default"}>
                      {isPurchase ? "شراء" : "دفعة"}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            العملاء المدينون
          </h2>
          {loadingCustomers ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : owingCustomers.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">لا يوجد عملاء عليهم مديونيات</Card>
          ) : (
            <div className="space-y-4">
              {owingCustomers.slice(0, 8).map((c) => (
                <Link key={c.id} href={`/admin/customers/${c.id}`}>
                  <Card className="p-4 flex items-center justify-between hover:border-destructive/30 transition-colors cursor-pointer mb-4">
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.code}</div>
                    </div>
                    <div className="font-bold text-destructive">{formatCurrency(c.balance)}</div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, loading }: { title: string; value: string | null; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
