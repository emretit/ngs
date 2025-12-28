import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseRequestForm } from "@/components/expenses/ExpenseRequestForm";
import { ExpenseRequestList } from "@/components/expenses/ExpenseRequestList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExpenseRequests() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Harcama Talepleri</h1>
          <p className="text-muted-foreground mt-1">
            Harcama taleplerinizi oluşturun ve yönetin
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Harcama Talebi
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harcama Talepleri</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseRequestList />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Harcama Talebi</DialogTitle>
          </DialogHeader>
          <ExpenseRequestForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

