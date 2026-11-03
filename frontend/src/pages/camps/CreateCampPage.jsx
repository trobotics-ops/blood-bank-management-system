import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { CalendarPlus, ArrowLeft, Loader2, Tent } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateCampPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    venue: '',
    address: '',
    city: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    organizer: '',
    capacity: 100,
    description: '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.venue.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Please fill in camp name and location details');
      return;
    }

    if (!form.date || !form.startTime || !form.endTime || !form.organizer.trim()) {
      toast.error('Please fill in schedule and organizer details');
      return;
    }

    const cap = parseInt(form.capacity, 10);
    if (isNaN(cap) || cap < 1) {
      toast.error('Capacity must be at least 1 donor');
      return;
    }

    setSubmitting(true);
    try {
      await apiPost('/api/camps', {
        name: form.name.trim(),
        venue: form.venue.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        organizer: form.organizer.trim(),
        capacity: cap,
        description: form.description.trim(),
      });
      toast.success('Donation camp scheduled successfully!');
      navigate('/camps');
    } catch (error) {
      toast.error(error.message || 'Failed to create camp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/camps')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedule Donation Camp</h1>
          <p className="text-muted text-sm mt-1">Organize a new blood donation drive</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary">
              <Tent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Camp Details</CardTitle>
              <CardDescription>All fields with * are required to schedule the camp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Camp Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Camp Title / Event Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Red Cross Blood Drive 2026"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizing Body / Partner *</Label>
                  <Input
                    id="organizer"
                    placeholder="e.g. Rotary Club / Red Cross Society"
                    value={form.organizer}
                    onChange={(e) => handleChange('organizer', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Venue & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue / Building *</Label>
                  <Input
                    id="venue"
                    placeholder="e.g. City Community Center"
                    value={form.venue}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  placeholder="Street address, landmark, PIN code"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Schedule & Capacity */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Schedule & Capacity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Donor Capacity (target registrations) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="5000"
                  value={form.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="description">Camp Description / Guidelines (optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional instructions for donors (eligibility reminders, what to bring, refreshment info)..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/camps')}
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4 mr-2" /> Schedule Camp
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
