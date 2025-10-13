import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function FeesPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalRevenue: '₱245,000',
    collectionRate: 85,
    unpaidHouseholds: 15,
    overdueAmount: '₱45,000',
    dueThisMonth: '₱180,000',
    collectedThisMonth: '₱153,000',
  };

  const recentTransactions = [
    {
      id: 1,
      household: 'Block 5 Lot 12',
      householdHead: 'Juan Dela Cruz',
      amount: '₱1,500',
      status: 'paid' as const,
      paidAt: '2 hours ago',
      dueDate: 'Oct 15, 2025',
    },
    {
      id: 2,
      household: 'Block 3 Lot 8',
      householdHead: 'Maria Santos',
      amount: '₱1,500',
      status: 'overdue' as const,
      dueDate: 'Sep 15, 2025',
    },
    {
      id: 3,
      household: 'Block 7 Lot 15',
      householdHead: 'Pedro Garcia',
      amount: '₱1,500',
      status: 'paid' as const,
      paidAt: '1 day ago',
      dueDate: 'Oct 15, 2025',
    },
    {
      id: 4,
      household: 'Block 2 Lot 5',
      householdHead: 'Anna Reyes',
      amount: '₱1,500',
      status: 'unpaid' as const,
      dueDate: 'Oct 15, 2025',
    },
  ];

  const getStatusBadge = (status: 'paid' | 'unpaid' | 'overdue') => {
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
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Association Fees</h1>
          <p className="text-muted-foreground">
            Manage monthly dues, track payments, and generate invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Invoices
          </Button>
          <Button>
            <DollarSign className="mr-2 h-4 w-4" />
            Fee Structure
          </Button>
        </div>
      </div>

      {/* Alert for overdue fees */}
      {stats.unpaidHouseholds > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">
                {stats.unpaidHouseholds} household{stats.unpaidHouseholds > 1 ? 's' : ''} with outstanding fees
              </p>
              <p className="text-sm text-red-700 mt-1">
                Total overdue amount: {stats.overdueAmount}. Send payment reminders to ensure timely collection.
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-red-900 border-red-300">
              Send Reminders
            </Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionRate}%</div>
            <Progress value={stats.collectionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Households</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unpaidHouseholds}</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueAmount}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Collection</CardTitle>
          <CardDescription>
            Progress towards monthly collection target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Target: {stats.dueThisMonth}</p>
              <p className="text-sm font-medium">Collected: {stats.collectedThisMonth}</p>
            </div>
            <Progress value={85} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {stats.collectionRate}% of target achieved. {stats.unpaidHouseholds} households pending.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest fee payments and outstanding dues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.household}</p>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {transaction.householdHead}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm font-medium">{transaction.amount}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {transaction.dueDate}
                      </p>
                      {transaction.paidAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Paid {transaction.paidAt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Payment Tracking</CardTitle>
            <CardDescription>View detailed payment history and status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" className="w-full">
              View All Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Invoice Generator</CardTitle>
            <CardDescription>Generate invoices for all households</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" className="w-full">
              Generate Invoices
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Reports</CardTitle>
            <CardDescription>Download financial reports and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" className="w-full">
              View Reports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
