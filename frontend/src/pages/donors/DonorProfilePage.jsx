import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function DonorProfilePage() {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiGet('/api/donors/me');
        setDonor(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (notFound || !donor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
        <div className="rounded-full bg-accent p-6">
          <UserPlus className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Donor Profile Found</h2>
        <p className="text-muted text-center max-w-md">
          You haven&apos;t registered as a blood donor yet. Register to track your donations and sign up for camps.
        </p>
        <Button onClick={() => navigate('/donors/register')} className="bg-primary text-primary-foreground">
          Register as Donor
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Donor Profile</h1>
        <p className="text-muted text-sm mt-1">Your blood donor information</p>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-red-500 to-red-700" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 -mt-12">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white text-primary font-bold text-2xl">
              {donor.bloodType || '?'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-foreground">{donor.name}</h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                <Badge className="bg-accent text-primary">{donor.bloodType}</Badge>
                {donor.isEligible ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" /> Eligible to Donate
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">
                    <XCircle className="h-3 w-3 mr-1" /> Not Yet Eligible
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Full Name" value={donor.name} />
            <InfoRow icon={Mail} label="Email" value={donor.email} />
            <InfoRow icon={Phone} label="Phone" value={donor.phone || 'Not provided'} />
            <InfoRow icon={Calendar} label="Date of Birth" value={donor.dateOfBirth ? formatDate(donor.dateOfBirth) : 'N/A'} />
            <InfoRow icon={User} label="Gender" value={donor.gender ? donor.gender.charAt(0).toUpperCase() + donor.gender.slice(1) : 'N/A'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Droplets} label="Blood Type" value={donor.bloodType} />
            <InfoRow
              icon={Heart}
              label="Last Donation"
              value={donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Never donated'}
            />
            <InfoRow
              icon={CheckCircle}
              label="Eligibility"
              value={donor.isEligible ? 'Eligible to donate' : 'Not yet eligible (56-day gap required)'}
            />
            <InfoRow icon={MapPin} label="Address" value={[donor.address, donor.city, donor.state].filter(Boolean).join(', ') || 'Not provided'} />
          </CardContent>
        </Card>
      </div>

      {/* Medical History */}
      {donor.medicalHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted whitespace-pre-wrap">{donor.medicalHistory}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
