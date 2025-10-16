'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getCurfewExceptions,
  createCurfewException,
  deleteCurfewException,
  type CurfewException,
} from '@/lib/actions/curfew';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurfewExceptionsCardProps {
  curfewId: string;
}

export default function CurfewExceptionsCard({ curfewId }: CurfewExceptionsCardProps) {
  const router = useRouter();
  const [exceptions, setExceptions] = useState<CurfewException[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    exception_date: '',
    reason: '',
  });

  useEffect(() => {
    loadExceptions();
  }, [curfewId]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const data = await getCurfewExceptions(curfewId);
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createCurfewException({
        curfew_id: curfewId,
        exception_date: formData.exception_date,
        reason: formData.reason,
      });

      setFormData({ exception_date: '', reason: '' });
      setIsDialogOpen(false);
      await loadExceptions();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exception');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exception?')) {
      return;
    }

    try {
      await deleteCurfewException(id);
      await loadExceptions();
      router.refresh();
    } catch (err) {
      alert('Failed to delete exception');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const upcomingExceptions = exceptions.filter(e => e.exception_date >= today);
  const pastExceptions = exceptions.filter(e => e.exception_date < today);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Curfew Exceptions
            </CardTitle>
            <CardDescription>
              Dates when this curfew does not apply (holidays, special events)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Exception
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Curfew Exception</DialogTitle>
                <DialogDescription>
                  Specify a date when the curfew will not be enforced
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exception_date">Exception Date *</Label>
                  <Input
                    id="exception_date"
                    type="date"
                    min={today}
                    value={formData.exception_date}
                    onChange={(e) =>
                      setFormData({ ...formData, exception_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., National Holiday, Community Festival"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? 'Adding...' : 'Add Exception'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : exceptions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No exceptions configured. Curfew applies to all dates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingExceptions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upcoming Exceptions</h4>
                <div className="space-y-2">
                  {upcomingExceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(exception.exception_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">{exception.reason}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exception.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastExceptions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Past Exceptions</h4>
                <div className="space-y-2">
                  {pastExceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between border rounded-lg p-3 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(exception.exception_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">{exception.reason}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exception.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
