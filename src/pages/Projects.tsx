import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Search, Filter, TrendingUp, Target, Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { Project } from '../../shared/index.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../utils/api.js';
import Button from '../components/ui/Button.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import Input from '../components/ui/Input.js';
import Select from '../components/ui/Select.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.js';
import { cn } from '@/lib/utils.js';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'suspended', label: '已暂停' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'education', label: '助学' },
  { value: 'poverty', label: '助困' },
  { value: 'disaster', label: '救灾' },
  { value: 'medical', label: '医疗' },
];

const statusColors: Record<string, string> = {
  active: 'bg-primary-100 text-primary-700',
  completed: 'bg-success-100 text-success-700',
  suspended: 'bg-info-100 text-info-700',
};

const statusLabels: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  suspended: '已暂停',
};

const typeLabels: Record<string, string> = {
  education: '助学',
  poverty: '助困',
  disaster: '救灾',
  medical: '医疗',
};

const typeColors: Record<string, string> = {
  education: '#E63946',
  poverty: '#F4A261',
  disaster: '#2A9D8F',
  medical: '#1D3557',
};

const Projects = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const canManage = user?.role === 'project_admin' || user?.role === 'foundation_admin';

  const fetchProjects = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (type) params.append('type', type);

    const response = await api.get<{ projects: Project[] }>(`/projects?${params.toString()}`);
    if (response.success && response.data) {
      setProjects(response.data.projects);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [search, status, type]);

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`;

  const totalProjects = projects.length;
  const totalRaised = projects.reduce((sum, p) => sum + p.currentRaised, 0);
  const totalGoal = projects.reduce((sum, p) => sum + p.fundraisingGoal, 0);
  const avgCompletion = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-success-500';
    if (progress >= 50) return 'bg-primary-500';
    if (progress >= 20) return 'bg-warning-500';
    return 'bg-secondary-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">项目管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            管理慈善项目，查看筹款进度和资金使用情况
          </p>
        </div>
        {canManage && (
          <Button>
            <Plus size={18} className="mr-1" />
            新建项目
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                <FolderKanban size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">项目总数</p>
                <p className="text-2xl font-bold text-secondary-800 font-serif">{totalProjects}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">累计筹款</p>
                <p className="text-2xl font-bold text-success-600 font-serif">{formatCurrency(totalRaised)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
                <Target size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">目标总额</p>
                <p className="text-2xl font-bold text-warning-600 font-serif">{formatCurrency(totalGoal)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center text-info-600">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">平均完成率</p>
                <p className="text-2xl font-bold text-info-600 font-serif">{avgCompletion}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-secondary-100">
            <h3 className="text-lg font-semibold text-secondary-800 font-serif">资金使用趋势</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={selectedProject?.fundUsageTrend || []}>
                <defs>
                  <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="raised" 
                  stroke="#E63946" 
                  strokeWidth={2}
                  fill="url(#colorRaised)"
                  name="筹款金额"
                />
                <Area 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#2A9D8F" 
                  strokeWidth={2}
                  fill="url(#colorUsed)"
                  name="使用金额"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-sm text-secondary-600">筹款金额</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm text-secondary-600">使用金额</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-secondary-100">
            <h3 className="text-lg font-semibold text-secondary-800 font-serif">项目类型分布</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={Object.entries(typeLabels).map(([key, label]) => ({
                  type: label,
                  count: projects.filter(p => p.type === key).length,
                })).filter(d => d.count > 0)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {Object.entries(typeLabels).map(([key], index) => (
                    <Cell key={key} fill={Object.values(typeColors)[index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索项目名称"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={typeOptions}
              className="w-32"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-32"
            />
            <Button variant="ghost" size="sm" onClick={fetchProjects}>
              <Filter size={16} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>筹款进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>起止日期</TableHead>
                <TableHead className="text-right">受益人数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-secondary-400">
                    <FolderKanban size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无项目数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const progress = Math.round((project.currentRaised / project.fundraisingGoal) * 100);
                  
                  return (
                    <TableRow 
                      key={project.id} 
                      className={cn('cursor-pointer transition-colors', selectedProject?.id === project.id && 'bg-primary-50')}
                      onClick={() => setSelectedProject(project)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-secondary-800">{project.name}</p>
                          <p className="text-xs text-secondary-400">{project.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className="text-white"
                          style={{ backgroundColor: typeColors[project.type] }}
                        >
                          {typeLabels[project.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 text-xs font-semibold">
                            {project.managerName.charAt(0)}
                          </div>
                          <span className="text-sm text-secondary-600">{project.managerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary-600">{formatCurrency(project.currentRaised)}</span>
                            <span className="text-secondary-400">/ {formatCurrency(project.fundraisingGoal)}</span>
                          </div>
                          <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-right text-secondary-500">{progress}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[project.status]}>
                          {statusLabels[project.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-secondary-600 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-secondary-400" />
                          <span>
                            {new Date(project.startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {project.endDate
                              ? new Date(project.endDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                              : '长期'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Users size={14} className="text-secondary-400" />
                          <span className="text-secondary-800 font-medium">{project.beneficiaryCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Projects;
