import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, daysUntil, cn } from '../../lib/utils';

function getDaysLeftColor(days) {
  if (days <= 3) return 'text-red-600 bg-red-50';
  if (days <= 7) return 'text-orange-600 bg-orange-50';
  if (days <= 14) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export default function ExpiringUnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  useEffect(() => {
    fetchExpiringUnits();
  }, [days]);

  const fetchExpiringUnits = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/inventory/expiring?days=${days}`);
      setUnits(data);
    } catch (error) {
      toast.error('Failed to load expiring units');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expiring Units</h1>
          <p className="text-muted text-sm mt-1">
            Blood units expiring within the selected timeframe
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="14">Next 14 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading expiring units..." />
      ) : !units || units.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Expiring Units"
          description={`No blood units are expiring within the next ${days} days.`}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {units.length} unit{units.length !== 1 ? 's' : ''} expiring within {days} days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Collection Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit, index) => {
                    const daysLeft = daysUntil(unit.expiryDate);
                    const daysColor = getDaysLeftColor(daysLeft);

                    return (
                      <TableRow key={unit.id || index}>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {unit.bloodType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{unit.component || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{unit.units ?? 1}</TableCell>
                        <TableCell className="text-sm">
                          {unit.collectionDate ? formatDate(unit.collectionDate) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {unit.expiryDate ? formatDate(unit.expiryDate) : '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                              daysColor
                            )}
                          >
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              unit.status === 'Expired'
                                ? 'destructive'
                                : unit.status === 'Available'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {unit.status || 'Available'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
