import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Smile,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { DashboardStats, Donation, Inventory } from '../../shared/index.js';
import api from '../utils/api.js';
import Button from '../components/ui/Button.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import Select from '../components/ui/Select.js';
import Input from '../components/ui/Input.js';
import Modal from '../components/ui/Modal.js';
import { cn } from '@/lib/utils.js';

const projectTypeOptions = [
  { value: '', label: '全部项目类型' },
  { value: 'education', label: '助学' },
  { value: 'poverty', label: '助困' },
  { value: 'disaster', label: '救灾' },
  { value: 'medical', label: '医疗' },
];

const COLORS = ['#E63946', '#F4A261', '#2A9D8F', '#1D3557'];

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: string;
  delay: number;
}

const StatCard = ({ title, value, icon, trend, trendLabel, color, delay }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        if (value.includes('¥')) {
          setDisplayValue(`¥${Math.floor(current).toLocaleString()}`);
        } else if (value.includes('%')) {
          setDisplayValue(`${current.toFixed(1)}%`);
        } else {
          setDisplayValue(current.toFixed(2));
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-10 -mt-10" style={{ backgroundColor: color }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend >= 0 ? 'text-success-600' : 'text-red-500'
            )}>
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-sm text-secondary-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-secondary-800 font-serif animate-number-roll">
          {displayValue}
        </p>
        {trendLabel && (
          <p className="text-xs text-secondary-400 mt-2">{trendLabel}</p>
        )}
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    const params = new URLSearchParams();
    if (projectType) params.append('projectType', projectType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<DashboardStats>(`/dashboard/stats?${params.toString()}`);
    if (response.success && response.data) {
      setStats(response.data);
      setPulseKey(prev => prev + 1);
    }
    setLoading(false);
    if (showRefresh) setRefreshing(false);
  }, [projectType, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    
    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchStats]);

  const handleExport = async (type: 'monthly_report' | 'distribution_detail') => {
    setExportLoading(true);
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const response = await api.post<{ downloadUrl: string; filename: string; content: string }>('/export', {
      type,
      startDate: startDate || firstDay.toISOString().split('T')[0],
      endDate: endDate || now.toISOString().split('T')[0],
      projectType: projectType || undefined,
    });

    if (response.success && response.data) {
      const blob = new Blob([response.data.content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = response.data.filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    setExportLoading(false);
    setExportModalOpen(false);
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

  const inventoryStatusColors: Record<string, string> = {
    normal: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    expiring: 'bg-orange-100 text-orange-700',
    out_of_stock: 'bg-red-100 text-red-700',
  };

  const inventoryStatusLabels: Record<string, string> = {
    normal: '正常',
    warning: '库存预警',
    expiring: '即将过期',
    out_of_stock: '缺货',
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">运营数据概览</h2>
          <Badge variant="primary" className={cn('transition-all', pulseKey % 2 === 0 ? 'opacity-100' : 'opacity-60')}>
            <RefreshCw size={12} className="inline mr-1" />
            实时更新中
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-secondary-400" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <span className="text-secondary-400">至</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          <Select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            options={projectTypeOptions}
            className="w-40"
          />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => fetchStats(true)}
            loading={refreshing}
          >
            <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setExportModalOpen(true)}
          >
            <Download size={16} className="mr-1" />
            导出数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="捐赠总额"
          value={formatCurrency(stats?.totalDonations || 0)}
          icon={<Heart size={24} fill="currentColor" />}
          trend={stats?.totalDonationsYoY}
          trendLabel="较去年同期"
          color="#E63946"
          delay={0}
        />
        <StatCard
          title="库存周转率"
          value={`${stats?.inventoryTurnover?.toFixed(2) || 0}次`}
          icon={<Package size={24} />}
          trend={stats?.inventoryTurnoverYoY}
          trendLabel="较去年同期"
          color="#1D3557"
          delay={100}
        />
        <StatCard
          title="项目完成率"
          value={`${stats?.projectCompletionRate?.toFixed(1) || 0}%`}
          icon={<Target size={24} />}
          trend={stats?.projectCompletionRateYoY}
          trendLabel="较去年同期"
          color="#2A9D8F"
          delay={200}
        />
        <StatCard
          title="受助人满意度"
          value={`${stats?.beneficiarySatisfaction?.toFixed(1) || 0}%`}
          icon={<Smile size={24} />}
          trend={stats?.beneficiarySatisfactionYoY}
          trendLabel="较去年同期"
          color="#F4A261"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-secondary-100">
            <h3 className="text-lg font-semibold text-secondary-800 font-serif">近30天捐赠趋势</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.donationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '捐赠金额']}
                  labelFormatter={(label) => `日期: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#E63946" 
                  strokeWidth={3}
                  dot={{ fill: '#E63946', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#E63946' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-secondary-100">
            <h3 className="text-lg font-semibold text-secondary-800 font-serif">项目类型分布</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats?.projectStats || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="ongoing"
                >
                  {stats?.projectStats?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {stats?.projectStats?.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-secondary-600">{item.type}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-secondary-800 font-medium">{item.ongoing} 进行中</span>
                    <span className="text-success-600 font-medium">{item.completed} 已完成</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-secondary-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-800 font-serif">最近捐赠</h3>
            <Button variant="ghost" size="sm">
              查看全部 <ArrowUpRight size={14} className="ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-secondary-100">
            {stats?.recentDonations?.map((donation, index) => (
              <div 
                key={donation.id} 
                className="p-4 flex items-center justify-between hover:bg-secondary-50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                    {donation.donorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">{donation.donorName}</p>
                    <p className="text-xs text-secondary-500">
                      {donation.type === 'money' ? '现金捐赠' : '物资捐赠'} · {donation.projectName || '未指定项目'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary-800">
                    {formatCurrency(donation.totalValue)}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {new Date(donation.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-secondary-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-secondary-800 font-serif">库存预警</h3>
              {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
                <Badge variant="danger">
                  <AlertTriangle size={12} className="mr-1" />
                  {stats.lowStockItems.length} 项
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              查看全部 <ArrowUpRight size={14} className="ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-secondary-100">
            {stats?.lowStockItems?.map((item, index) => (
              <div 
                key={item.id} 
                className="p-4 flex items-center justify-between hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.status === 'out_of_stock' ? 'bg-red-100 text-red-600' :
                    item.status === 'expiring' ? 'bg-orange-100 text-orange-600' :
                    'bg-warning-100 text-warning-600'
                  )}>
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">{item.name}</p>
                    <p className="text-xs text-secondary-500">
                      {item.category} · 库存 {item.quantity}{item.unit} / 安全线 {item.safetyStock}{item.unit}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={item.status === 'normal' ? 'success' : item.status === 'warning' ? 'warning' : 'danger'}
                  className={inventoryStatusColors[item.status]}
                >
                  {inventoryStatusLabels[item.status]}
                </Badge>
              </div>
            ))}
            {(!stats?.lowStockItems || stats.lowStockItems.length === 0) && (
              <div className="p-8 text-center text-secondary-400">
                <Package size={40} className="mx-auto mb-2 opacity-50" />
                <p>暂无库存预警</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="导出数据"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-500">请选择要导出的数据类型：</p>
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => handleExport('monthly_report')}
              loading={exportLoading}
            >
              <FileText size={18} className="mr-2" />
              月度慈善运营分析报告
            </Button>
            <Button
              className="w-full justify-start"
              variant="secondary"
              onClick={() => handleExport('distribution_detail')}
              loading={exportLoading}
            >
              <Package size={18} className="mr-2" />
              物资分发明细
            </Button>
          </div>
          <p className="text-xs text-secondary-400">
            导出范围：{startDate || '本月初'} 至 {endDate || '今日'}
          </p>
        </div>
      </Modal>
    </div>
  );
};

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default Dashboard;
