import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Droplets,
  ClipboardList,
  Tent,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  PlusCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiGet } from '../../services/api';
import { BLOOD_TYPES, getStockBarColor, getStatusColor, formatRelativeTime, getUrgencyColor } from '../../lib/utils';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const role = userProfile?.role || 'donor';

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'hospital') return <HospitalDashboard />;
  return <DonorDashboard />;
}

/* ============================= Admin Dashboard ============================= */
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [expiringUnits, setExpiringUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, requestsRes, expiringRes] = await Promise.allSettled([
          apiGet('/api/inventory/summary'),
          apiGet('/api/requests?limit=5'),
          apiGet('/api/inventory/expiring?days=7'),
        ]);

        if (summaryRes.status === 'fulfilled') {
          const summaryData = summaryRes.value;
          const total = Array.isArray(summaryData)
            ? summaryData.reduce((acc, item) => acc + (item.totalUnits || 0), 0)
            : 0;
          setStockData(Array.isArray(summaryData) ? summaryData : []);
          setStats((prev) => ({ ...prev, totalUnits: total }));
        }

        if (requestsRes.status === 'fulfilled') {
          const reqData = Array.isArray(requestsRes.value) ? requestsRes.value : [];
          setRecentRequests(reqData.slice(0, 5));
          setStats((prev) => ({
            ...prev,
            pendingRequests: reqData.filter((r) => r.status === 'pending').length,
            totalRequests: reqData.length,
          }));
        }

        if (expiringRes.status === 'fulfilled') {
          const expData = Array.isArray(expiringRes.value) ? expiringRes.value : [];
          setExpiringUnits(expData.slice(0, 5));
          setStats((prev) => ({ ...prev, expiringCount: expData.length }));
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Build chart data from BLOOD_TYPES
  const chartData = BLOOD_TYPES.map((type) => {
    const found = stockData.find((item) => item.bloodType === type);
    return { bloodType: type, units: found?.totalUnits || 0 };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted text-sm mt-1">Overview of blood bank operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Blood Units"
          value={stats?.totalUnits ?? 0}
          icon={Droplets}
          description="Available in inventory"
        />
        <StatsCard
          title="Pending Requests"
          value={stats?.pendingRequests ?? 0}
          icon={ClipboardList}
          description="Awaiting approval"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats?.expiringCount ?? 0}
          icon={AlertTriangle}
          description="Within 7 days"
          className={stats?.expiringCount > 0 ? 'border-red-200 bg-red-50/50' : ''}
        />
        <StatsCard
          title="Total Requests"
          value={stats?.totalRequests ?? 0}
          icon={TrendingUp}
          description="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Stock Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Blood Stock by Type</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/stock')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bloodType" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={getStockBarColor(entry.units)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-primary font-bold text-sm">
                        {req.bloodType || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{req.hospitalName || 'Hospital'}</p>
                        <p className="text-xs text-muted">
                          {req.unitsNeeded || 0} units • {formatRelativeTime(req.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(req.urgencyLevel)}>{req.urgencyLevel || 'Normal'}</Badge>
                      <Badge className={getStatusColor(req.status)} variant="outline">{req.status || 'Pending'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Units Alert */}
      {expiringUnits.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-base font-semibold text-red-900">
                Expiring Blood Units
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/expiring')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiringUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center gap-3 rounded-lg bg-white p-3 border border-red-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                    {unit.bloodType}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{unit.component || 'Whole Blood'}</p>
                    <p className="text-xs text-red-600">Expires: {unit.expiryDate || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/inventory/add')}>
              <PlusCircle className="h-5 w-5 text-primary" />
              <span className="text-xs">Add Blood Unit</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/donors')}>
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">View Donors</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/requests')}>
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-xs">Manage Requests</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/camps/create')}>
              <Tent className="h-5 w-5 text-primary" />
              <span className="text-xs">Create Camp</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================= Hospital Dashboard ============================= */
function HospitalDashboard() {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, requestsRes] = await Promise.allSettled([
          apiGet('/api/inventory/summary'),
          apiGet('/api/requests?limit=10'),
        ]);

        if (summaryRes.status === 'fulfilled') {
          setStockData(Array.isArray(summaryRes.value) ? summaryRes.value : []);
        }
        if (requestsRes.status === 'fulfilled') {
          setMyRequests(Array.isArray(requestsRes.value) ? requestsRes.value : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const chartData = BLOOD_TYPES.map((type) => {
    const found = stockData.find((item) => item.bloodType === type);
    return { bloodType: type, units: found?.totalUnits || 0 };
  });

  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = myRequests.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hospital Dashboard</h1>
        <p className="text-muted text-sm mt-1">Track blood availability and your requests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="My Requests" value={myRequests.length} icon={ClipboardList} description="Total submitted" />
        <StatsCard title="Pending" value={pendingCount} icon={Activity} description="Awaiting approval" />
        <StatsCard title="Approved" value={approvedCount} icon={TrendingUp} description="Ready for pickup" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Available Blood Stock</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/stock')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bloodType" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={getStockBarColor(entry.units)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">My Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {myRequests.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {myRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-primary font-bold text-sm">
                        {req.bloodType || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{req.patientName || 'Patient'}</p>
                        <p className="text-xs text-muted">{req.unitsNeeded || 0} units</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/requests/new')}>
              <PlusCircle className="h-5 w-5 text-primary" />
              <span className="text-xs">New Blood Request</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/donors/search')}>
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs">Search Donors</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/camps')}>
              <Tent className="h-5 w-5 text-primary" />
              <span className="text-xs">View Camps</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================= Donor Dashboard ============================= */
function DonorDashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [campsRes, profileRes] = await Promise.allSettled([
          apiGet('/api/camps?status=upcoming&limit=5'),
          apiGet('/api/donors/me'),
        ]);

        if (campsRes.status === 'fulfilled') {
          setUpcomingCamps(Array.isArray(campsRes.value) ? campsRes.value : []);
        }
        if (profileRes.status === 'fulfilled') {
          setDonorProfile(profileRes.value);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const isRegistered = !!donorProfile;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {userProfile?.displayName || 'Donor'}!
        </h1>
        <p className="text-muted text-sm mt-1">Your donor dashboard</p>
      </div>

      {/* Registration prompt */}
      {!isRegistered && (
        <Card className="border-primary/30 bg-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Complete Your Donor Registration</h3>
                <p className="text-sm text-muted mt-1">
                  Register as a blood donor to track your donations, sign up for camps, and help save lives.
                </p>
              </div>
              <Button onClick={() => navigate('/donors/register')} className="bg-primary text-primary-foreground">
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donor Info Cards */}
      {isRegistered && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Blood Type"
            value={donorProfile.bloodType || 'N/A'}
            icon={Droplets}
          />
          <StatsCard
            title="Eligibility"
            value={donorProfile.isEligible ? 'Eligible' : 'Not Yet'}
            icon={Activity}
            className={donorProfile.isEligible ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}
          />
          <StatsCard
            title="Last Donation"
            value={donorProfile.lastDonationDate ? new Date(donorProfile.lastDonationDate).toLocaleDateString() : 'Never'}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Upcoming Camps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Upcoming Blood Donation Camps</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/camps')}>
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingCamps.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No upcoming camps</p>
          ) : (
            <div className="space-y-3">
              {upcomingCamps.map((camp) => (
                <div key={camp.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary">
                      <Tent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{camp.name}</p>
                      <p className="text-xs text-muted">{camp.venue} • {camp.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">{(camp.registeredDonors || []).length}/{camp.capacity || '?'} registered</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {!isRegistered && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/donors/register')}>
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-xs">Register as Donor</span>
              </Button>
            )}
            {isRegistered && (
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/donors/profile')}>
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs">My Profile</span>
              </Button>
            )}
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/camps')}>
              <Tent className="h-5 w-5 text-primary" />
              <span className="text-xs">View Camps</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/inventory/stock')}>
              <Droplets className="h-5 w-5 text-primary" />
              <span className="text-xs">Blood Stock</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
