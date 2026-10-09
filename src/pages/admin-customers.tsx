import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { CustomerForm } from "@/components/CustomerForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const { data: customers, isLoading } = useListCustomers(search ? { search } : {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">إدارة العملاء</h1>
        <Button onClick={() => setFormOpen(true)} className="gap-2 h-11 px-6">
          <Plus className="w-5 h-5" />
          إضافة عميل
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="ابحث بالاسم أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-12 text-lg"
        />
      </div>

      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead className="text-left">الرصيد المتبقي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-left"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  لا يوجد عملاء
                </TableCell>
              </TableRow>
            ) : (
              customers?.map((customer) => {
                const isDebt = customer.balance > 0;
                return (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-muted-foreground">{customer.code}</TableCell>
                    <TableCell>
                      <Link href={`/admin/customers/${customer.id}`} className="font-bold text-primary hover:underline">
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">{customer.phone || "-"}</TableCell>
                    <TableCell className={`text-left font-bold ${isDebt ? 'text-destructive' : (customer.balance < 0 ? 'text-green-600' : '')}`}>
                      {formatCurrency(customer.balance)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : customers?.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا يوجد عملاء</Card>
        ) : (
          customers?.map((customer) => {
            const isDebt = customer.balance > 0;
            return (
              <Link key={customer.id} href={`/admin/customers/${customer.id}`}>
                <Card className="p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div>
                    <div className="font-bold text-lg">{customer.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{customer.code}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-bold ${isDebt ? 'text-destructive' : (customer.balance < 0 ? 'text-green-600' : '')}`}>
                      {formatCurrency(customer.balance)}
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      <CustomerForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
