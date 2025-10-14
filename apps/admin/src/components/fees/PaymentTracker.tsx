'use client';

/**
 * T154: Payment Tracker Component
 * Track and display payment status for households
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data - replace with actual Supabase query
const mockPayments = [
  {
    id: '1',
    household: 'Block 5 Lot 12',
    householdHead: 'Juan Dela Cruz',
    amount: 1500,
    dueDate: '2025-10-15',
    status: 'paid',
    paidAt: '2025-10-10',
  },
  {
    id: '2',
    household: 'Block 3 Lot 8',
    householdHead: 'Maria Santos',
    amount: 1500,
    dueDate: '2025-09-15',
    status: 'overdue',
    paidAt: null,
  },
  {
    id: '3',
    household: 'Block 7 Lot 15',
    householdHead: 'Pedro Garcia',
    amount: 1500,
    dueDate: '2025-10-15',
    status: 'unpaid',
    paidAt: null,
  },
  {
    id: '4',
    household: 'Block 2 Lot 5',
    householdHead: 'Anna Reyes',
    amount: 1500,
    dueDate: '2025-10-15',
    status: 'paid',
    paidAt: '2025-10-12',
  },
  {
    id: '5',
    household: 'Block 6 Lot 18',
    householdHead: 'Carlos Mendoza',
    amount: 1500,
    dueDate: '2025-10-15',
    status: 'unpaid',
    paidAt: null,
  },
];

export function PaymentTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'unpaid':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Unpaid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.household.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.householdHead.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Tracker</CardTitle>
        <CardDescription>
          Monitor payment status for all households
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by household or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {mockPayments.filter((p) => p.status === 'paid').length}
            </p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {mockPayments.filter((p) => p.status === 'unpaid').length}
            </p>
            <p className="text-xs text-muted-foreground">Unpaid</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {mockPayments.filter((p) => p.status === 'overdue').length}
            </p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* Payment Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Household</TableHead>
                <TableHead>Head</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.household}</TableCell>
                  <TableCell>{payment.householdHead}</TableCell>
                  <TableCell className="text-right">₱{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
