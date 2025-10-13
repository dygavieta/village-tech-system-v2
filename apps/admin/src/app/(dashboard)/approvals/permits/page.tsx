import {
  Construction,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ConstructionPermitsPage() {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalPending: 3,
    approved: 12,
    rejected: 2,
    avgProcessingTime: '36 hours',
  };

  const pendingPermits = [
    {
      id: 1,
      household: 'Block 5 Lot 12',
      householdHead: 'Juan Dela Cruz',
      projectType: 'Kitchen Renovation',
      description: 'Complete kitchen remodeling including cabinets, countertops, and appliances',
      duration: '30 days',
      startDate: 'Nov 1, 2025',
      endDate: 'Nov 30, 2025',
      fee: '₱5,000',
      paymentStatus: 'pending' as const,
      workers: 5,
      contractor: 'ABC Construction Co.',
      submittedAt: '2 hours ago',
      priority: 'high' as const,
      documents: ['Floor Plan', 'Contract', 'Building Permit'],
    },
    {
      id: 2,
      household: 'Block 3 Lot 8',
      householdHead: 'Maria Santos',
      projectType: 'Bathroom Upgrade',
      description: 'Bathroom renovation with new fixtures and tiling',
      duration: '14 days',
      startDate: 'Oct 20, 2025',
      endDate: 'Nov 3, 2025',
      fee: '₱3,000',
      paymentStatus: 'pending' as const,
      workers: 3,
      contractor: 'XYZ Builders',
      submittedAt: '1 day ago',
      priority: 'normal' as const,
      documents: ['Quotation', 'Contract'],
    },
    {
      id: 3,
      household: 'Block 7 Lot 15',
      householdHead: 'Pedro Garcia',
      projectType: 'Garage Extension',
      description: 'Extending garage to accommodate two vehicles',
      duration: '45 days',
      startDate: 'Nov 15, 2025',
      endDate: 'Dec 30, 2025',
      fee: '₱8,000',
      paymentStatus: 'pending' as const,
      workers: 8,
      contractor: 'Supreme Construction',
      submittedAt: '2 days ago',
      priority: 'normal' as const,
      documents: ['Blueprint', 'Contract', 'Structural Plan'],
    },
  ];

  const getPaymentBadge = (status: 'pending' | 'paid') => {
    return status === 'paid' ? (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Paid
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Clock className="mr-1 h-3 w-3" />
        Payment Pending
      </Badge>
    );
  };

  const getPriorityBadge = (priority: 'high' | 'normal') => {
    return priority === 'high' ? (
      <Badge variant="destructive" className="text-xs">
        High Priority
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/approvals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Construction Permits</h1>
            <p className="text-muted-foreground">
              Review and approve construction permit requests
            </p>
          </div>
        </div>
      </div>

      {/* Alert for pending permits */}
      {stats.totalPending > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">
                {stats.totalPending} permit request{stats.totalPending > 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Review project details, verify documentation, and approve permits to allow construction work to begin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Construction className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Permits List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Construction Permits</CardTitle>
          <CardDescription>
            Review project details, documentation, and approve or reject permits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pendingPermits.map((permit) => (
              <div
                key={permit.id}
                className="flex items-start justify-between border rounded-lg p-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Construction className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">{permit.projectType}</p>
                        {getPriorityBadge(permit.priority)}
                        {getPaymentBadge(permit.paymentStatus)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {permit.household} - {permit.householdHead}
                      </p>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2">
                      <p className="text-sm">{permit.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium">{permit.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Road Fee</p>
                            <p className="font-medium">{permit.fee}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Construction className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Workers</p>
                            <p className="font-medium">{permit.workers} persons</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                            <p className="font-medium">{permit.submittedAt}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Project Timeline:</p>
                        <p className="font-medium">{permit.startDate} - {permit.endDate}</p>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Contractor:</p>
                        <p className="font-medium">{permit.contractor}</p>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Attached Documents:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {permit.documents.map((doc, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Construction Permit Guidelines</CardTitle>
          <CardDescription>
            Important information for reviewing construction permits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Required Documents</p>
                <p className="text-muted-foreground">Verify all required documents are attached and valid</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Project Timeline</p>
                <p className="text-muted-foreground">Ensure timeline is reasonable and doesn't conflict with community events</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Road Fee Calculation</p>
                <p className="text-muted-foreground">Verify fee calculation based on project scope and duration</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Worker Registration</p>
                <p className="text-muted-foreground">Ensure all workers are registered with valid IDs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
