'use client';

/**
 * T153: Invoice Generator Component
 * Generate invoices for association fees
 */

import { useState } from 'react';
import { Calendar, Download, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InvoiceGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceType, setInvoiceType] = useState<string>('monthly');
  const [amount, setAmount] = useState<string>('1500');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Invoices
        </CardTitle>
        <CardDescription>
          Create and send invoices to all households
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-type">Invoice Type</Label>
            <Select value={invoiceType} onValueChange={setInvoiceType}>
              <SelectTrigger id="invoice-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Fee</SelectItem>
                <SelectItem value="annual">Annual Fee</SelectItem>
                <SelectItem value="special">Special Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PHP)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due-date">Due Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="due-date"
              type="date"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="e.g., Monthly association fee for October 2025"
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Recipients</p>
              <p className="text-xs text-muted-foreground">150 households will receive this invoice</p>
            </div>
            <p className="text-2xl font-bold">₱{(parseInt(amount) * 150).toLocaleString()}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate & Send Invoices'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">Invoice Generation Notes:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Invoices will be sent via email and in-app notification</li>
            <li>• Recipients can pay online or provide proof of payment</li>
            <li>• Automated reminders will be sent before due date</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
