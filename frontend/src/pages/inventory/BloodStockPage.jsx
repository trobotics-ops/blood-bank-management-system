import { useState, useEffect } from 'react';
import { Droplets, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { apiGet } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getStockBgColor, getStockBarColor } from '../../lib/utils';

export default function BloodStockPage() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/inventory/summary');
      setStockData(data);
    } catch (error) {
      toast.error('Failed to load blood stock data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading blood stock data..." />;
  }

  if (!stockData || stockData.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Stock</h1>
          <p className="text-muted text-sm mt-1">Overview of available blood units by type</p>
        </div>
        <EmptyState
          icon={Droplets}
          title="No Stock Data"
          description="No blood stock information is currently available."
        />
      </div>
    );
  }

  const totalUnits = stockData.reduce((sum, item) => sum + item.totalUnits, 0);
  const criticalTypes = stockData.filter((item) => item.totalUnits < 5).length;
  const adequateTypes = stockData.filter((item) => item.totalUnits >= 5).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blood Stock</h1>
        <p className="text-muted text-sm mt-1">Overview of available blood units by type</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Units"
          value={totalUnits}
          icon={Droplets}
          description="Total blood units in stock"
        />
        <StatsCard
          title="Critical Types"
          value={criticalTypes}
          icon={AlertTriangle}
          description="Blood types with < 5 units"
          trend={criticalTypes > 0 ? 'down' : undefined}
        />
        <StatsCard
          title="Adequate Types"
          value={adequateTypes}
          icon={TrendingUp}
          description="Blood types with ≥ 5 units"
        />
        <StatsCard
          title="Blood Types"
          value={stockData.length}
          icon={BarChart3}
          description="Total blood types tracked"
        />
      </div>

      {/* Blood Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stockData.map((item) => (
          <Card key={item.bloodType} className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${getStockBgColor(item.totalUnits)}`}
              >
                <span className="text-lg font-bold">{item.bloodType}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{item.totalUnits}</p>
              <p className="text-muted text-sm">units available</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stock Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="bloodType" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`${value} units`, 'Stock']}
                />
                <Bar dataKey="totalUnits" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStockBarColor(entry.totalUnits)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
