import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Users, Search, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function DonorListPage() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');

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

  const filtered = donors.filter((d) => {
    const matchesSearch =
      !search ||
      (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = bloodTypeFilter === 'all' || d.bloodType === bloodTypeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading donors..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Donors</h1>
        <p className="text-muted text-sm mt-1">Manage registered blood donors</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
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

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No donors found" description="No donors match your filters." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Donation</TableHead>
                  <TableHead>Eligible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">{donor.bloodType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted">{donor.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted">{donor.phone || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted">
                      {donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {donor.isEligible ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
