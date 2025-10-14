"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Car, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AllocationSummaryProps {
  totalAllocation: number;
  usedStickers: number;
  pendingRequests?: number;
  className?: string;
}

export function AllocationSummary({
  totalAllocation,
  usedStickers,
  pendingRequests = 0,
  className,
}: AllocationSummaryProps) {
  const available = totalAllocation - usedStickers;
  const utilizationPercent = (usedStickers / totalAllocation) * 100;
  const isNearLimit = utilizationPercent >= 80;
  const isAtLimit = usedStickers >= totalAllocation;

  // Determine status
  let status: "success" | "warning" | "danger";
  let statusIcon;
  let statusText;

  if (isAtLimit) {
    status = "danger";
    statusIcon = <AlertTriangle className="h-4 w-4" />;
    statusText = "At Limit";
  } else if (isNearLimit) {
    status = "warning";
    statusIcon = <AlertTriangle className="h-4 w-4" />;
    statusText = "Near Limit";
  } else {
    status = "success";
    statusIcon = <CheckCircle2 className="h-4 w-4" />;
    statusText = "Available";
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Sticker Allocation
          </span>
          <Badge
            variant={status === "danger" ? "destructive" : status === "warning" ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {statusIcon}
            {statusText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {usedStickers} of {totalAllocation}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={utilizationPercent}
              className={
                status === "danger"
                  ? "h-2 [&>div]:bg-red-500"
                  : status === "warning"
                  ? "h-2 [&>div]:bg-yellow-500"
                  : "h-2 [&>div]:bg-green-500"
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Active Stickers</p>
            <p className="text-2xl font-bold">{usedStickers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-2xl font-bold">{available}</p>
          </div>
        </div>

        {pendingRequests > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Requests</span>
              <Badge variant="outline">{pendingRequests}</Badge>
            </div>
          </div>
        )}

        {isAtLimit && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              This household has reached its sticker allocation limit. To approve more requests, increase the
              allocation limit using the override tool.
            </p>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              This household is approaching its allocation limit ({utilizationPercent.toFixed(0)}% used).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
