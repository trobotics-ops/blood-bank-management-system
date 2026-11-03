import React, { useState } from 'react';
import { apiGet } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function DonorSearchPage() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [city, setCity] = useState('');

  const handleSearch = async () => {
    const params = {};
    if (bloodType && bloodType !== 'all') params.bloodType = bloodType;
    if (city.trim()) params.city = city.trim();

    if (Object.keys(params).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const query = new URLSearchParams(params).toString();
      const data = await apiGet(`/api/donors/search?${query}`);
      setDonors(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Search failed');
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search Donors</h1>
        <p className="text-muted text-sm mt-1">Find donors by blood type and location</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <BloodTypeSelector
              value={bloodType}
              onValueChange={setBloodType}
              includeAll
              className="w-full sm:w-48"
              placeholder="Blood type"
            />
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="City (optional)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-primary text-primary-foreground">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Searching donors..." />
        </div>
      ) : searched && donors.length === 0 ? (
        <EmptyState icon={Search} title="No donors found" description="Try adjusting your search criteria." />
      ) : donors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{donors.length} donor{donors.length !== 1 ? 's' : ''} found</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Donation</TableHead>
                  <TableHead>Eligible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donors.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">{donor.bloodType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted">{donor.city || '—'}</TableCell>
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
      ) : null}
    </div>
  );
}
