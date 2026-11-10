import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function DonorListPage() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all'); // 'all' | 'eligible' | 'ineligible'

  useEffect(() => {
    async function fetchDonors() {
      try {
        const data = await apiGet('/api/donors');
        setDonors(Array.isArray(data) ? data : []);
      } catch {
        setDonors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDonors();
  }, []);

  const totalDonors = donors.length;
  const eligibleCount = donors.filter((d) => d.isEligible !== false).length;
  const uniqueBloodTypes = new Set(donors.map((d) => d.bloodType).filter(Boolean)).size;

  const filtered = donors.filter((d) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      (d.name || '').toLowerCase().includes(query) ||
      (d.email || '').toLowerCase().includes(query) ||
      (d.city || '').toLowerCase().includes(query) ||
      (d.phone || '').toLowerCase().includes(query);

    const matchesType = bloodTypeFilter === 'all' || d.bloodType === bloodTypeFilter;

    if (eligibilityFilter === 'eligible' && d.isEligible === false) return false;
    if (eligibilityFilter === 'ineligible' && d.isEligible !== false) return false;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading donor registry..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donors Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified donor database with real-time eligibility tracking and contact records
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setEligibilityFilter('all')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            eligibilityFilter === 'all'
              ? 'bg-red-50/50 border-red-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Donors</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalDonors} <span className="text-xs font-medium text-slate-500">volunteers</span></p>
        </div>

        <div
          onClick={() => setEligibilityFilter('eligible')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            eligibilityFilter === 'eligible'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Eligible Now</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{eligibleCount} <span className="text-xs font-medium text-emerald-600">can donate</span></p>
        </div>

        <div className="rounded-2xl p-4 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Blood Groups</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{uniqueBloodTypes} / 8 <span className="text-xs font-medium text-blue-600">types active</span></p>
        </div>
      </div>

      {/* Live Search & Blood Group Filter */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Instant search by name, email, city, or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200"
              />
            </div>
            <BloodTypeSelector
              value={bloodTypeFilter}
              onValueChange={setBloodTypeFilter}
              includeAll
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No donors found"
          description="Try broadening your search query or changing the blood type filter."
        />
      ) : (
        <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-semibold text-slate-700">Donor Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Blood Type</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Location</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Last Donation</TableHead>
                  <TableHead className="font-semibold text-slate-700">Eligibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((donor) => {
                  const eligible = donor.isEligible !== false;
                  return (
                    <TableRow key={donor.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                            {donor.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{donor.name}</p>
                            <p className="text-xs text-slate-500">{donor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-red-50 text-red-700 font-bold text-xs border border-red-200 shadow-2xs">
                          {donor.bloodType}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{donor.city || 'India'}, {donor.state || 'Odisha'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{donor.phone || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never donated'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {eligible ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="h-3 w-3 text-slate-400" /> Cooldown
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
