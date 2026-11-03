import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPatch } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatsCard from '../../components/common/StatsCard';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  ClipboardList,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getUrgencyColor,
  REQUEST_STATUSES,
} from '../../lib/utils';
import toast from 'react-hot-toast';

export default function RequestListPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const isHospital = userProfile?.role === 'hospital';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await apiGet('/api/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await apiPatch(`/api/requests/${id}/approve`);
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const openRejectDialog = (id) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await apiPatch(`/api/requests/${selectedRequestId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Request rejected');
      setRejectDialogOpen(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async (id) => {
    try {
      await apiPatch(`/api/requests/${id}/fulfill`);
      toast.success('Request marked as fulfilled');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to fulfill request');
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      (r.hospitalName || '').toLowerCase().includes(query) ||
      (r.patientName || '').toLowerCase().includes(query) ||
      (r.bloodType || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading blood requests..." />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Requests</h1>
          <p className="text-muted text-sm mt-1">
            {isAdmin ? 'Manage and fulfill blood requests from hospitals' : 'Track and manage your blood requests'}
          </p>
        </div>
        {isHospital && (
          <Button onClick={() => navigate('/requests/new')} className="bg-primary text-primary-foreground">
            <PlusCircle className="h-4 w-4 mr-2" /> New Request
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Pending Requests"
          value={pendingCount}
          icon={Clock}
          description="Awaiting review"
          className={pendingCount > 0 ? 'border-yellow-200 bg-yellow-50/40' : ''}
        />
        <StatsCard
          title="Approved Requests"
          value={approvedCount}
          icon={CheckCircle}
          description="Ready for fulfillment"
          className={approvedCount > 0 ? 'border-blue-200 bg-blue-50/40' : ''}
        />
        <StatsCard
          title="Fulfilled Requests"
          value={fulfilledCount}
          icon={Package}
          description="Completed donations"
          className={fulfilledCount > 0 ? 'border-green-200 bg-green-50/40' : ''}
        />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search by hospital, patient, blood type..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table / Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No blood requests found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your search filters.' : 'No blood requests have been submitted yet.'}
          action={
            isHospital ? (
              <Button onClick={() => navigate('/requests/new')} className="bg-primary text-primary-foreground">
                <PlusCircle className="h-4 w-4 mr-2" /> Submit First Request
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead className="hidden md:table-cell">Patient</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{req.hospitalName}</p>
                        <p className="text-xs text-muted">
                          {req.contactPerson} {req.contactPhone ? `• ${req.contactPhone}` : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-sm">
                        {req.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{req.unitsNeeded}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="font-medium">{req.patientName}</p>
                      <p className="text-xs text-muted">{req.patientAge} years old</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(req.urgencyLevel?.charAt(0).toUpperCase() + req.urgencyLevel?.slice(1))}>
                        {req.urgencyLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(req.status?.charAt(0).toUpperCase() + req.status?.slice(1))}>
                        {req.status}
                      </Badge>
                      {req.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1" title={req.rejectionReason}>
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted text-xs">
                      {formatRelativeTime(req.createdAt)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                onClick={() => handleApprove(req.id)}
                                title="Approve Request"
                              >
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => openRejectDialog(req.id)}
                                title="Reject Request"
                              >
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <Button
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleFulfill(req.id)}
                              title="Fulfill Request"
                            >
                              <Package className="h-4 w-4 mr-1" /> Fulfill
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Blood Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this blood request. The hospital will be notified.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g. Insufficient units available in inventory..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
