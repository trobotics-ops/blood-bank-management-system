import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  Tent,
  XCircle,
  Building,
} from 'lucide-react';
import { formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function MyCampsPage() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCamps = async () => {
    try {
      const data = await apiGet('/api/camps/my');
      setCamps(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load your registered camps');
      setCamps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCamps();
  }, []);

  const handleUnregister = async (campId) => {
    if (!window.confirm('Are you sure you want to cancel your registration for this camp?')) return;
    try {
      await apiPost(`/api/camps/${campId}/unregister`);
      toast.success('Registration cancelled');
      fetchMyCamps();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel registration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading your camps..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Registered Camps</h1>
          <p className="text-muted text-sm mt-1">
            Blood donation camps you have signed up for
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/camps')}>
          <Tent className="h-4 w-4 mr-2" /> Browse All Camps
        </Button>
      </div>

      {camps.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No registered camps"
          description="You haven't signed up for any donation camps yet. Check out upcoming camps to join one!"
          action={
            <Button onClick={() => navigate('/camps')} className="bg-primary text-primary-foreground">
              <Tent className="h-4 w-4 mr-2" /> Browse Upcoming Camps
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {camps.map((camp) => (
            <Card key={camp.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{camp.name}</CardTitle>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" /> Organized by {camp.organizer}
                    </p>
                  </div>
                  <Badge className={getStatusColor(camp.status?.charAt(0).toUpperCase() + camp.status?.slice(1))}>
                    {camp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span>{camp.venue}, {camp.address}, {camp.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>{formatDate(camp.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>{camp.startTime} - {camp.endTime}</span>
                  </div>
                  {camp.description && (
                    <p className="text-xs text-muted/80 mt-2 line-clamp-2 pt-2 border-t">
                      {camp.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
                    ✓ You are registered
                  </span>
                  {camp.status === 'upcoming' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                      onClick={() => handleUnregister(camp.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel Registration
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
