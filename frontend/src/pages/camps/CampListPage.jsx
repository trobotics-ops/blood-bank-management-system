import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatsCard from '../../components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Tent,
  CalendarPlus,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Building,
  Check,
  Search,
  Droplets,
} from 'lucide-react';
import { formatDate, getStatusColor, CAMP_STATUSES } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function CampListPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const isDonor = userProfile?.role === 'donor';

  const [camps, setCamps] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Complete camp modal state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState(null);
  const [unitsCollected, setUnitsCollected] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampsAndDonor = async () => {
    try {
      const [campsData, donorData] = await Promise.allSettled([
        apiGet('/api/camps'),
        isDonor ? apiGet('/api/donors/me') : Promise.resolve(null),
      ]);

      if (campsData.status === 'fulfilled') {
        setCamps(Array.isArray(campsData.value) ? campsData.value : []);
      }
      if (donorData.status === 'fulfilled') {
        setDonorProfile(donorData.value);
      }
    } catch {
      setCamps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampsAndDonor();
  }, [isDonor]);

  const handleRegister = async (campId) => {
    try {
      await apiPost(`/api/camps/${campId}/register`);
      toast.success('Successfully registered for donation camp!');
      fetchCampsAndDonor();
    } catch (error) {
      toast.error(error.message || 'Failed to register for camp');
    }
  };

  const handleUnregister = async (campId) => {
    try {
      await apiPost(`/api/camps/${campId}/unregister`);
      toast.success('Unregistered from camp');
      fetchCampsAndDonor();
    } catch (error) {
      toast.error(error.message || 'Failed to unregister');
    }
  };

  const openCompleteModal = (campId) => {
    setSelectedCampId(campId);
    setUnitsCollected('');
    setCompleteDialogOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    const units = parseInt(unitsCollected, 10);
    if (isNaN(units) || units < 0) {
      toast.error('Please enter a valid number of units');
      return;
    }

    setActionLoading(true);
    try {
      await apiPatch(`/api/camps/${selectedCampId}/complete`, { unitsCollected: units });
      toast.success('Camp marked as completed!');
      setCompleteDialogOpen(false);
      fetchCampsAndDonor();
    } catch (error) {
      toast.error(error.message || 'Failed to complete camp');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = camps.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      (c.name || '').toLowerCase().includes(query) ||
      (c.venue || '').toLowerCase().includes(query) ||
      (c.city || '').toLowerCase().includes(query) ||
      (c.organizer || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading donation camps..." />
      </div>
    );
  }

  const upcomingCount = camps.filter((c) => c.status === 'upcoming').length;
  const ongoingCount = camps.filter((c) => c.status === 'ongoing').length;
  const totalRegistered = camps.reduce((sum, c) => sum + (c.registeredDonors?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Donation Camps</h1>
          <p className="text-muted text-sm mt-1">
            Community blood drives and donation camps
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/camps/create')} className="bg-primary text-primary-foreground">
            <CalendarPlus className="h-4 w-4 mr-2" /> Create Camp
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Upcoming Camps" value={upcomingCount} icon={Calendar} description="Scheduled drives" />
        <StatsCard title="Ongoing Camps" value={ongoingCount} icon={Clock} description="Currently active" />
        <StatsCard title="Donor Registrations" value={totalRegistered} icon={Users} description="Across all camps" />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search camps by name, venue, city, organizer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Camps List Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Tent}
          title="No donation camps found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No blood donation camps scheduled at this time.'}
          action={
            isAdmin ? (
              <Button onClick={() => navigate('/camps/create')} className="bg-primary text-primary-foreground">
                <CalendarPlus className="h-4 w-4 mr-2" /> Schedule First Camp
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((camp) => {
            const donorId = donorProfile?.id;
            const isRegisteredForThis = donorId && (camp.registeredDonors || []).includes(donorId);
            const isFull = (camp.registeredDonors || []).length >= camp.capacity;

            return (
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
                      <span>{formatDate(camp.date)} • {camp.startTime} to {camp.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {(camp.registeredDonors || []).length} / {camp.capacity} registered
                        {isFull && <span className="ml-2 text-red-600 font-semibold">(Capacity Full)</span>}
                      </span>
                    </div>
                    {camp.unitsCollected > 0 && (
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <Droplets className="h-4 w-4 shrink-0" />
                        <span>{camp.unitsCollected} blood units collected</span>
                      </div>
                    )}
                    {camp.description && (
                      <p className="text-xs text-muted/80 mt-2 line-clamp-2 pt-2 border-t">
                        {camp.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                    {/* Donor Action */}
                    {isDonor && (
                      <div>
                        {isRegisteredForThis ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Registered
                            </Badge>
                            {camp.status === 'upcoming' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                                onClick={() => handleUnregister(camp.id)}
                              >
                                Unregister
                              </Button>
                            )}
                          </div>
                        ) : camp.status === 'upcoming' ? (
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground text-xs"
                            disabled={isFull}
                            onClick={() => handleRegister(camp.id)}
                          >
                            {isFull ? 'Camp Full' : 'Register as Donor'}
                          </Button>
                        ) : null}
                      </div>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 ml-auto">
                        {camp.status !== 'completed' && camp.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => openCompleteModal(camp.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete Camp
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Camp Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Donation Camp</DialogTitle>
            <DialogDescription>
              Record the total units of blood collected during this camp.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="unitsCollected">Total Units Collected *</Label>
              <Input
                id="unitsCollected"
                type="number"
                min="0"
                placeholder="e.g. 45"
                value={unitsCollected}
                onChange={(e) => setUnitsCollected(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompleteDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Mark Completed'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
