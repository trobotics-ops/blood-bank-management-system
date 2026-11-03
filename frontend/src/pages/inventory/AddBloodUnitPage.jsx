import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { PlusCircle, Loader2, Droplets } from 'lucide-react';
import { COMPONENT_TYPES } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AddBloodUnitPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodType: '',
    component: 'Whole Blood',
    units: 1,
    collectionDate: new Date().toISOString().split('T')[0],
    donorId: '',
    status: 'available',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bloodType || !formData.collectionDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/api/inventory', formData);
      toast.success('Blood unit added to inventory!');
      navigate('/inventory');
    } catch (error) {
      toast.error(error.message || 'Failed to add blood unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Blood Unit</h1>
        <p className="text-muted text-sm mt-1">Add a new blood unit to the inventory</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Blood Unit Details</CardTitle>
              <CardDescription>Fields marked with * are required</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood Type *</Label>
                <BloodTypeSelector
                  value={formData.bloodType}
                  onValueChange={(v) => handleChange('bloodType', v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Component Type *</Label>
                <Select value={formData.component} onValueChange={(v) => handleChange('component', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">Number of Units *</Label>
                <Input
                  id="units"
                  type="number"
                  min={1}
                  value={formData.units}
                  onChange={(e) => handleChange('units', parseInt(e.target.value) || 1)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectionDate">Collection Date *</Label>
                <Input
                  id="collectionDate"
                  type="date"
                  value={formData.collectionDate}
                  onChange={(e) => handleChange('collectionDate', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorId">Donor ID (optional)</Label>
              <Input
                id="donorId"
                placeholder="e.g. walk-in or donor document ID"
                value={formData.donorId}
                onChange={(e) => handleChange('donorId', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this blood unit..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/inventory')} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                Add Blood Unit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
