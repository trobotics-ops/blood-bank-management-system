import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import BloodTypeSelector from '../../components/common/BloodTypeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { FilePlus, ArrowLeft, Loader2, Hospital } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hospitalName: userProfile?.organizationName || userProfile?.displayName || '',
    contactPerson: userProfile?.displayName || '',
    contactPhone: userProfile?.phone || '',
    bloodType: '',
    unitsNeeded: 1,
    patientName: '',
    patientAge: '',
    urgencyLevel: 'normal',
    reason: '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.hospitalName.trim() || !form.contactPerson.trim() || !form.contactPhone.trim()) {
      toast.error('Please enter hospital and contact details');
      return;
    }

    if (!form.bloodType) {
      toast.error('Please select a blood type');
      return;
    }

    if (!form.patientName.trim() || form.patientAge === '') {
      toast.error('Please enter patient name and age');
      return;
    }

    const units = parseInt(form.unitsNeeded, 10);
    const age = parseInt(form.patientAge, 10);

    if (isNaN(units) || units < 1) {
      toast.error('Units needed must be at least 1');
      return;
    }

    if (isNaN(age) || age < 0 || age > 150) {
      toast.error('Please enter a valid patient age');
      return;
    }

    setSubmitting(true);
    try {
      await apiPost('/api/requests', {
        hospitalName: form.hospitalName.trim(),
        contactPerson: form.contactPerson.trim(),
        contactPhone: form.contactPhone.trim(),
        bloodType: form.bloodType,
        unitsNeeded: units,
        patientName: form.patientName.trim(),
        patientAge: age,
        urgencyLevel: form.urgencyLevel,
        reason: form.reason.trim(),
      });
      toast.success('Blood request submitted successfully!');
      navigate('/requests');
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit Blood Request</h1>
          <p className="text-muted text-sm mt-1">Request blood units for emergency or routine transfusion</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary">
              <Hospital className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Request Information</CardTitle>
              <CardDescription>Fill out patient and hospital details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hospital & Contact Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted">
                Hospital & Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital / Facility Name *</Label>
                  <Input
                    id="hospitalName"
                    value={form.hospitalName}
                    onChange={(e) => handleChange('hospitalName', e.target.value)}
                    placeholder="e.g. City General Hospital"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="Doctor or Coordinator Name"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone Number *</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Blood & Patient Details */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted">
                Patient & Transfusion Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Full Name *</Label>
                  <Input
                    id="patientName"
                    value={form.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    placeholder="Patient name"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Patient Age *</Label>
                  <Input
                    id="patientAge"
                    type="number"
                    min="0"
                    max="150"
                    value={form.patientAge}
                    onChange={(e) => handleChange('patientAge', e.target.value)}
                    placeholder="Years"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required Blood Type *</Label>
                <BloodTypeSelector
                  value={form.bloodType}
                  onValueChange={(val) => handleChange('bloodType', val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitsNeeded">Units Needed *</Label>
                  <Input
                    id="unitsNeeded"
                    type="number"
                    min="1"
                    max="50"
                    value={form.unitsNeeded}
                    onChange={(e) => handleChange('unitsNeeded', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgencyLevel">Urgency Level *</Label>
                  <Select
                    value={form.urgencyLevel}
                    onValueChange={(val) => handleChange('urgencyLevel', val)}
                  >
                    <SelectTrigger id="urgencyLevel">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (Scheduled / Routine)</SelectItem>
                      <SelectItem value="urgent">Urgent (Within 24 Hours)</SelectItem>
                      <SelectItem value="critical">Critical (Immediate / Emergency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Clinical Reason / Notes</Label>
                <Textarea
                  id="reason"
                  value={form.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="Diagnosis, surgery schedule, or relevant medical notes..."
                  rows={3}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/requests')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground min-w-[140px]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                  </>
                ) : (
                  <>
                    <FilePlus className="h-4 w-4 mr-2" /> Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
