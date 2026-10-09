import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetCustomer, useDeleteCustomer, useDeleteTransaction, getListCustomersQueryKey, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowRight, ShoppingBag, CreditCard, Trash2, Edit, Phone, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { CustomerForm } from "@/components/CustomerForm";
import { TransactionForm } from "@/components/TransactionForm";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/customers/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<number | null>(null);

  const { data, isLoading, error } = useGetCustomer(id, {
    query: {
      enabled: Number.isFinite(id),
      queryKey: getGetCustomerQueryKey(id)
    }
  });

  const deleteCustMut = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "تم حذف العميل بنجاح" });
        setLocation("/admin/customers");
      },
      onError: (err: any) => {
        toast({ title: "خطأ", description: err.message || "فشل حذف العميل", variant: "destructive" });
      }
    }
  });

  const deleteTxMut = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "تم حذف العملية بنجاح" });
        setTxToDelete(null);
      },
      onError: (err: any) => {
        toast({ title: "خطأ", description: err.message || "فشل حذف العملية", variant: "destructive" });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div>خطأ في تحميل بيانات العميل</div>;
  }

  const { customer, transactions, balance } = data;
  const isDebt = balance > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <Button variant="outline" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">تفاصيل العميل</h1>
        <Button variant="outline" size="sm" onClick={() => setEditFormOpen(true)}>
          <Edit className="h-4 w-4 ml-2" />
          تعديل
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
          <Trash2 className="h-4 w-4 ml-2" />
          حذف
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-1">{customer.name}</h2>
              <Badge variant="secondary" className="font-mono">{customer.code}</Badge>
            </div>
            
            {(customer.phone || customer.notes) && (
              <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{customer.phone}</span>
                  </div>
                )}
                {customer.notes && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{customer.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-6 rounded-lg min-w-[250px] text-center flex flex-col justify-center border border-border/50">
            <div className="text-muted-foreground mb-2">الرصيد الحالي</div>
            <div className={`text-4xl font-bold ${isDebt ? 'text-destructive' : (balance < 0 ? 'text-green-600' : '')}`}>
              {formatCurrency(balance)}
            </div>
            {isDebt && <div className="text-sm text-destructive mt-2">مديونية عليه</div>}
            {balance < 0 && <div className="text-sm text-green-600 mt-2">رصيد دائن له</div>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="destructive" 
          className="h-16 text-lg gap-2" 
          onClick={() => setPurchaseFormOpen(true)}
        >
          <ShoppingBag className="w-6 h-6" />
          إضافة مشتريات (مديونية)
        </Button>
        <Button 
          variant="default" 
          className="h-16 text-lg gap-2"
          onClick={() => setPaymentFormOpen(true)}
        >
          <CreditCard className="w-6 h-6" />
          تسجيل دفعة (سداد)
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">سجل العمليات</h3>
        
        {transactions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا توجد عمليات مسجلة</Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isPurchase = tx.type === "purchase";
              return (
                <Card key={tx.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isPurchase ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {isPurchase ? <ShoppingBag className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{formatCurrency(tx.amount)}</span>
                        <Badge variant={isPurchase ? "destructive" : "default"} className="text-xs">
                          {isPurchase ? "شراء" : "دفعة"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{formatDate(tx.occurredAt)}</div>
                      {tx.description && <div className="text-sm mt-1">{tx.description}</div>}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setTxToDelete(tx.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CustomerForm 
        open={editFormOpen} 
        onOpenChange={setEditFormOpen} 
        customer={{
          id: customer.id,
          code: customer.code,
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes
        }} 
      />
      
      <TransactionForm 
        open={purchaseFormOpen} 
        onOpenChange={setPurchaseFormOpen} 
        customerId={customer.id} 
        type="purchase" 
      />
      
      <TransactionForm 
        open={paymentFormOpen} 
        onOpenChange={setPaymentFormOpen} 
        customerId={customer.id} 
        type="payment" 
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف العميل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العميل {customer.name} وجميع العمليات المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCustMut.mutate({ id: customer.id })}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCustMut.isPending}
            >
              {deleteCustMut.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={txToDelete !== null} onOpenChange={(o) => !o && setTxToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العملية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه العملية؟ سيتم تحديث رصيد العميل بناءً على ذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => txToDelete && deleteTxMut.mutate({ id: txToDelete })}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteTxMut.isPending}
            >
              {deleteTxMut.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
