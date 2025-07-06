
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Database, Zap, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  date_recorded: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  category: string;
}

const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Use mock data until database types are updated
        const mockMetrics: PerformanceMetric[] = [
          {
            date_recorded: '2024-01-01T10:00:00Z',
            metric_name: 'response_time',
            metric_value: 125,
            metric_unit: 'ms',
            category: 'api'
          },
          {
            date_recorded: '2024-01-01T10:00:00Z',
            metric_name: 'query_latency',
            metric_value: 45,
            metric_unit: 'ms',
            category: 'database'
          },
          {
            date_recorded: '2024-01-01T10:00:00Z',
            metric_name: 'cpu_usage',
            metric_value: 65.5,
            metric_unit: '%',
            category: 'system'
          },
          {
            date_recorded: '2024-01-01T10:00:00Z',
            metric_name: 'memory_usage',
            metric_value: 72.3,
            metric_unit: '%',
            category: 'system'
          }
        ];

        try {
          const { data, error } = await supabase
            .from('performance_metrics' as any)
            .select('*')
            .order('date_recorded', { ascending: false })
            .limit(100);

          if (error) throw error;
          setMetrics(data || mockMetrics);
        } catch (error) {
          console.log('Using mock performance data until database types are updated');
          setMetrics(mockMetrics);
        }
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Group metrics by category and name
  const systemMetrics = metrics.filter(m => m.category === 'system');
  const apiMetrics = metrics.filter(m => m.category === 'api');
  const databaseMetrics = metrics.filter(m => m.category === 'database');
  const userExperienceMetrics = metrics.filter(m => m.category === 'user_experience');

  // Calculate averages for key metrics
  const avgResponseTime = apiMetrics
    .filter(m => m.metric_name === 'response_time')
    .reduce((sum, m) => sum + m.metric_value, 0) / Math.max(apiMetrics.filter(m => m.metric_name === 'response_time').length, 1);

  const avgDatabaseLatency = databaseMetrics
    .filter(m => m.metric_name === 'query_latency')
    .reduce((sum, m) => sum + m.metric_value, 0) / Math.max(databaseMetrics.filter(m => m.metric_name === 'query_latency').length, 1);

  const avgCpuUsage = systemMetrics
    .filter(m => m.metric_name === 'cpu_usage')
    .reduce((sum, m) => sum + m.metric_value, 0) / Math.max(systemMetrics.filter(m => m.metric_name === 'cpu_usage').length, 1);

  const avgMemoryUsage = systemMetrics
    .filter(m => m.metric_name === 'memory_usage')
    .reduce((sum, m) => sum + m.metric_value, 0) / Math.max(systemMetrics.filter(m => m.metric_name === 'memory_usage').length, 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{avgResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">DB Latency</p>
                <p className="text-2xl font-bold text-green-600">{avgDatabaseLatency.toFixed(0)}ms</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-purple-600">{avgCpuUsage.toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-orange-600">{avgMemoryUsage.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Response Times</CardTitle>
            <CardDescription>Average response times over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiMetrics.filter(m => m.metric_name === 'response_time').reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                <Line 
                  type="monotone" 
                  dataKey="metric_value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
            <CardDescription>Query latency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={databaseMetrics.filter(m => m.metric_name === 'query_latency').reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Query Latency']} />
                <Line 
                  type="monotone" 
                  dataKey="metric_value" 
                  stroke="#10B981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>CPU and Memory usage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={systemMetrics.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                <Line 
                  type="monotone" 
                  dataKey="metric_value" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Usage %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Experience Metrics</CardTitle>
            <CardDescription>Page load times and user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userExperienceMetrics.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date_recorded" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="metric_value" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
