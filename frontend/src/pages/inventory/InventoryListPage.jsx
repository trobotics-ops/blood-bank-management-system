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
import {
  Package,
  PlusCircle,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function InventoryListPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'available' | 'expiring' | 'reserved'

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
      toast.error(error.message || 'Failed to delete unit');
    }
  };

  // Metrics calculation
  const totalUnits = units.reduce((acc, u) => acc + (Number(u.units) || 1), 0);
  const availableUnits = units
    .filter((u) => (u.status || '').toLowerCase() === 'available')
    .reduce((acc, u) => acc + (Number(u.units) || 1), 0);
  
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const expiringUnits = units.filter((u) => {
    if (!u.expiryDate) return false;
    const exp = new Date(u.expiryDate);
    return exp >= now && exp <= sevenDaysFromNow && (u.status || '').toLowerCase() === 'available';
  });

  const reservedUnits = units.filter((u) => (u.status || '').toLowerCase() === 'reserved').length;

  const filtered = units.filter((u) => {
    const matchesSearch =
      !search ||
      (u.bloodType || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.component || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(search.toLowerCase());

    const matchesType = bloodTypeFilter === 'all' || u.bloodType === bloodTypeFilter;
    
    // Tab filters
    if (activeTab === 'available' && (u.status || '').toLowerCase() !== 'available') return false;
    if (activeTab === 'reserved' && (u.status || '').toLowerCase() !== 'reserved') return false;
    if (activeTab === 'expiring') {
      if (!u.expiryDate) return false;
      const exp = new Date(u.expiryDate);
      if (!(exp >= now && exp <= sevenDaysFromNow)) return false;
    }

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading blood inventory..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blood Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time blood stock management, expiry tracking, and batch controls
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/stock')}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4 mr-2 text-slate-500" />
            Stock Matrix
          </Button>
          <Button
            onClick={() => navigate('/inventory/add')}
            className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-xs"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Blood Unit
          </Button>
        </div>
      </div>

      {/* Streamlined KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'all'
              ? 'bg-red-50/50 border-red-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock</span>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalUnits} <span className="text-xs font-medium text-slate-500">units</span></p>
        </div>

        <div
          onClick={() => setActiveTab('available')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'available'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Available</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{availableUnits} <span className="text-xs font-medium text-emerald-600">units</span></p>
        </div>

        <div
          onClick={() => setActiveTab('expiring')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'expiring'
              ? 'bg-amber-50/70 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Expiring (&le;7d)</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2">{expiringUnits.length} <span className="text-xs font-medium text-amber-600">units</span></p>
        </div>

        <div
          onClick={() => setActiveTab('reserved')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            activeTab === 'reserved'
              ? 'bg-blue-50/60 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Reserved</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{reservedUnits} <span className="text-xs font-medium text-blue-600">units</span></p>
        </div>
      </div>

      {/* Unified Search & Filters */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search unit by Blood Type, Component, or Unit ID..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used">Transfused / Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Unit Data Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No blood units found"
          description="Try adjusting your blood type or status filters, or add new units."
          action={
            <Button onClick={() => navigate('/inventory/add')} className="bg-red-600 text-white">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Blood Unit
            </Button>
          }
        />
      ) : (
        <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-semibold text-slate-700">Blood Group</TableHead>
                  <TableHead className="font-semibold text-slate-700">Component</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Volume</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-700">Collection Date</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Expiry Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((unit) => {
                  const isExpiring =
                    unit.expiryDate &&
                    new Date(unit.expiryDate) >= now &&
                    new Date(unit.expiryDate) <= sevenDaysFromNow &&
                    (unit.status || '').toLowerCase() === 'available';

                  return (
                    <TableRow key={unit.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 font-bold text-xs border border-red-200/80 shadow-2xs">
                            {unit.bloodType}
                          </span>
                          <span className="text-xs text-slate-500 font-mono hidden sm:inline">#{unit.id?.slice(-5)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {unit.component || 'Whole Blood'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600 text-sm">
                        {unit.units || 1} unit ({unit.volumeMl || 450} mL)
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                        {formatDate(unit.collectionDate)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        <span className={isExpiring ? 'text-amber-700 font-semibold flex items-center gap-1' : 'text-slate-600'}>
                          {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                          {formatDate(unit.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`capitalize text-xs font-semibold ${getStatusColor(unit.status)}`}
                        >
                          {unit.status || 'available'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(unit.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete blood unit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
