import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Package, PlusCircle, Search, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function InventoryListPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInventory = async () => {
    try {
      const data = await apiGet('/api/inventory');
      setUnits(Array.isArray(data) ? data : []);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this blood unit?')) return;
    try {
      await apiDelete(`/api/inventory/${unitId}`);
      toast.success('Blood unit deleted');
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const filtered = units.filter((u) => {
    const matchesSearch =
      !search || (u.bloodType || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = bloodTypeFilter === 'all' || u.bloodType === bloodTypeFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Inventory</h1>
          <p className="text-muted text-sm mt-1">Manage blood units in stock</p>
        </div>
        <Button onClick={() => navigate('/inventory/add')} className="bg-primary text-primary-foreground">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Unit
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No blood units found"
          description="No units match your filters, or the inventory is empty."
          action={
            <Button onClick={() => navigate('/inventory/add')} className="bg-primary text-primary-foreground">
              <PlusCircle className="h-4 w-4 mr-2" /> Add First Unit
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead className="hidden md:table-cell">Units</TableHead>
                  <TableHead className="hidden md:table-cell">Collection Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">{unit.bloodType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{unit.component || 'Whole Blood'}</TableCell>
                    <TableCell className="hidden md:table-cell">{unit.units || 1}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted">
                      {formatDate(unit.collectionDate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted">
                      {formatDate(unit.expiryDate)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(unit.status?.charAt(0).toUpperCase() + unit.status?.slice(1))}>
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
