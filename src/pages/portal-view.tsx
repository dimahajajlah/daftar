import { useRoute, Link } from "wouter";
import { usePortalLookup, getPortalLookupQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt, AlertCircle, ShoppingBag, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalView() {
  const [, params] = useRoute("/portal/:code");
  const code = params?.code || "";

  const { data, isLoading, error } = usePortalLookup(code, {
    query: {
      enabled: !!code,
      queryKey: getPortalLookupQueryKey(code),
      retry: false
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center border-destructive/20">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">الحساب غير موجود</h1>
          <p className="text-muted-foreground mb-8">
            عذراً، لم نتمكن من العثور على حساب بالكود {code}. يرجى التأكد من الكود والمحاولة مرة أخرى.
          </p>
          <Link href="/portal">
            <Button className="w-full h-12" variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للبحث
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { customer, transactions, balance, totalPurchases, totalPayments } = data;
  const balanceColor = balance > 0 ? "text-destructive" : (balance < 0 ? "text-green-600" : "text-foreground");

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">دفتر</h1>
          <Link href="/portal">
            <Button variant="ghost" size="sm">
              <ArrowRight className="ml-2 h-4 w-4" />
              خروج
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1">{customer.name}</h2>
            <div className="text-muted-foreground flex items-center gap-2">
              <span>كود:</span>
              <Badge variant="secondary" className="font-mono text-sm">{customer.code}</Badge>
            </div>
          </div>
        </div>

        <Card className="bg-card border-2 shadow-sm overflow-hidden">
          <div className="p-6 text-center border-b border-border/50 bg-muted/20">
            <p className="text-lg text-muted-foreground font-medium mb-2">الرصيد المتبقي</p>
            <div className={`text-4xl md:text-5xl font-bold ${balanceColor}`}>
              {formatCurrency(balance)}
            </div>
            {balance > 0 && <p className="text-sm text-destructive mt-2">مديونية مستحقة الدفع</p>}
          </div>
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/50">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm">إجمالي المشتريات</span>
              </div>
              <div className="text-xl font-bold">{formatCurrency(totalPurchases)}</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">إجمالي المدفوع</span>
              </div>
              <div className="text-xl font-bold">{formatCurrency(totalPayments)}</div>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            سجل العمليات
          </h3>
          
          {transactions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              لا توجد عمليات سابقة في هذا الحساب.
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPurchase = tx.type === "purchase";
                return (
                  <Card key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-full ${isPurchase ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {isPurchase ? <ShoppingBag className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{formatCurrency(tx.amount)}</div>
                        <div className="text-sm text-muted-foreground">{formatDate(tx.occurredAt)}</div>
                        {tx.description && <div className="text-sm mt-1">{tx.description}</div>}
                      </div>
                    </div>
                    <Badge variant={isPurchase ? "destructive" : "default"} className="hidden sm:flex">
                      {isPurchase ? "شراء" : "دفعة"}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
