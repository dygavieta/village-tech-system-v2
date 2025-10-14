'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, MapPin, Calendar, Phone, Home, Car } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getHouseholdById } from '@/lib/services/household-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AllocationSummary } from '@/components/households/AllocationSummary';
import { AllocationOverride } from '@/components/households/AllocationOverride';

interface HouseholdDetail {
  id: string;
  move_in_date: string | null;
  ownership_type: 'owner' | 'renter';
  sticker_allocation: number;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    address: string;
    phase: string | null;
    block: string | null;
    lot: string | null;
    unit: string | null;
    property_type: string;
    property_size_sqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking_slots: number | null;
  };
  household_head: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    phone_number: string | null;
    position: string | null;
  };
  household_members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    relationship: string;
    age: number | null;
    is_minor: boolean;
  }>;
  vehicle_stickers: Array<{
    id: string;
    vehicle_plate: string;
    vehicle_make: string | null;
    vehicle_color: string | null;
    sticker_type: string;
    status: string;
    rfid_serial: string | null;
    issue_date: string | null;
    expiry_date: string | null;
  }>;
}

export default function HouseholdDetailPage() {
  const params = useParams();
  const householdId = params.id as string;

  const [household, setHousehold] = useState<HouseholdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHousehold() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await getHouseholdById(householdId);

        if (fetchError) {
          setError(fetchError.message || 'Failed to load household');
          return;
        }

        if (!data) {
          setError('Household not found');
          return;
        }

        setHousehold(data);
      } catch (err) {
        console.error('Error loading household:', err);
        setError('Unexpected error loading household');
      } finally {
        setLoading(false);
      }
    }

    if (householdId) {
      loadHousehold();
    }
  }, [householdId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading household details...</p>
        </div>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error || 'Household not found'}</p>
          <Link href="/households">
            <Button className="mt-4" variant="outline">
              Back to Households
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/households">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Households
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {household.household_head.first_name} {household.household_head.last_name} Household
            </h1>
            <p className="text-muted-foreground">{household.property.address}</p>
          </div>
          <Badge variant={household.ownership_type === 'owner' ? 'default' : 'secondary'}>
            {household.ownership_type}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{household.household_members.length + 1}</div>
            <p className="text-xs text-muted-foreground">Including household head</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Move-in Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {household.move_in_date
                ? new Date(household.move_in_date).toLocaleDateString()
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Type</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {household.property.property_type.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticker Allocation Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <AllocationSummary
          totalAllocation={household.sticker_allocation}
          usedStickers={household.vehicle_stickers.filter(s => s.status === 'issued' || s.status === 'approved').length}
          pendingRequests={household.vehicle_stickers.filter(s => s.status === 'pending').length}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Allocation Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Need to adjust the sticker allocation limit for this household? Use the override tool to increase or decrease the limit with proper justification.
            </p>
            <AllocationOverride
              householdId={household.id}
              currentAllocation={household.sticker_allocation}
              usedStickers={household.vehicle_stickers.filter(s => s.status === 'issued' || s.status === 'approved').length}
              onUpdate={(newAllocation) => {
                // Refresh household data after update
                setHousehold(prev => prev ? { ...prev, sticker_allocation: newAllocation } : null);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="stickers">Vehicle Stickers</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Household Head Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">
                      {household.household_head.first_name}{' '}
                      {household.household_head.middle_name &&
                        `${household.household_head.middle_name} `}
                      {household.household_head.last_name}
                    </p>
                  </div>
                </div>

                {household.household_head.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {household.household_head.phone_number}
                      </p>
                    </div>
                  </div>
                )}

                {household.household_head.position && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Position</p>
                      <p className="text-sm text-muted-foreground">
                        {household.household_head.position}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Household Members</CardTitle>
              <CardDescription>
                {household.household_members.length} member
                {household.household_members.length !== 1 ? 's' : ''} (excluding household head)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {household.household_members.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No additional members registered
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {household.household_members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell className="capitalize">{member.relationship}</TableCell>
                        <TableCell>{member.age || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_minor ? 'secondary' : 'default'}>
                            {member.is_minor ? 'Minor' : 'Adult'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Stickers Tab */}
        <TabsContent value="stickers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Stickers</CardTitle>
              <CardDescription>
                {household.vehicle_stickers.length} of {household.sticker_allocation} stickers used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {household.vehicle_stickers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No vehicle stickers registered
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>RFID Serial</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {household.vehicle_stickers.map((sticker) => (
                      <TableRow key={sticker.id}>
                        <TableCell className="font-medium">{sticker.vehicle_plate}</TableCell>
                        <TableCell>
                          {sticker.vehicle_make || 'N/A'}
                          {sticker.vehicle_color && ` - ${sticker.vehicle_color}`}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{sticker.rfid_serial || 'Pending'}</code>
                        </TableCell>
                        <TableCell className="capitalize">
                          {sticker.sticker_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sticker.status === 'issued'
                                ? 'default'
                                : sticker.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {sticker.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sticker.expiry_date
                            ? new Date(sticker.expiry_date).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Tab */}
        <TabsContent value="property" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{household.property.address}</p>
                  </div>
                </div>

                {household.property.phase && (
                  <div>
                    <p className="text-sm font-medium">Phase</p>
                    <p className="text-sm text-muted-foreground">{household.property.phase}</p>
                  </div>
                )}

                {household.property.block && (
                  <div>
                    <p className="text-sm font-medium">Block</p>
                    <p className="text-sm text-muted-foreground">{household.property.block}</p>
                  </div>
                )}

                {household.property.lot && (
                  <div>
                    <p className="text-sm font-medium">Lot</p>
                    <p className="text-sm text-muted-foreground">{household.property.lot}</p>
                  </div>
                )}

                {household.property.property_size_sqm && (
                  <div>
                    <p className="text-sm font-medium">Property Size</p>
                    <p className="text-sm text-muted-foreground">
                      {household.property.property_size_sqm} sqm
                    </p>
                  </div>
                )}

                {household.property.bedrooms && (
                  <div>
                    <p className="text-sm font-medium">Bedrooms</p>
                    <p className="text-sm text-muted-foreground">{household.property.bedrooms}</p>
                  </div>
                )}

                {household.property.bathrooms && (
                  <div>
                    <p className="text-sm font-medium">Bathrooms</p>
                    <p className="text-sm text-muted-foreground">{household.property.bathrooms}</p>
                  </div>
                )}

                {household.property.parking_slots !== null && (
                  <div>
                    <p className="text-sm font-medium">Parking Slots</p>
                    <p className="text-sm text-muted-foreground">
                      {household.property.parking_slots}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
