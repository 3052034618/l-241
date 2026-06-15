import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, AlertTriangle, Check, X, Sparkles, MapPin, Users } from 'lucide-react';
import type { AssistanceApplication, MaterialPlanItem, WorkOrder } from '../../shared/index.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../utils/api.js';
import Button from '../components/ui/Button.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import Input from '../components/ui/Input.js';
import Select from '../components/ui/Select.js';
import Modal from '../components/ui/Modal.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.js';
import { cn } from '@/lib/utils.js';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待初审' },
  { value: 'recommended', label: '待初审' },
  { value: 'first_review', label: '待复审' },
  { value: 'second_review', label: '待复审' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const urgencyOptions = [
  { value: 'critical', label: '紧急（24小时内）' },
  { value: 'high', label: '高（3天内）' },
  { value: 'medium', label: '中（7天内）' },
  { value: 'low', label: '低（15天内）' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  recommended: 'bg-warning-100 text-warning-700',
  first_review: 'bg-info-100 text-info-700',
  second_review: 'bg-info-100 text-info-700',
  approved: 'bg-success-100 text-success-700',
  rejected: 'bg-red-100 text-red-700',
  escalated: 'bg-purple-100 text-purple-700',
};

const statusLabels: Record<string, string> = {
  pending: '待初审',
  recommended: '待初审',
  first_review: '待复审',
  second_review: '待复审',
  approved: '已通过',
  rejected: '已拒绝',
  escalated: '已升级',
};

const urgencyColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-warning-100 text-warning-700',
  low: 'bg-success-100 text-success-700',
};

const urgencyLabels: Record<string, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

interface ReviewModalProps {
  application: AssistanceApplication | null;
  level: 'first' | 'second';
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comment: string) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
}

const ReviewModal = ({ application, level, isOpen, onClose, onApprove, onReject }: ReviewModalProps) => {
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!action) return;
    setLoading(true);
    
    if (action === 'approve') {
      await onApprove(comment);
    } else {
      await onReject(comment);
    }
    
    setLoading(false);
    setComment('');
    setAction(null);
    onClose();
  };

  if (!application) return null;

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${level === 'first' ? '初审' : '复审'}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-secondary-50 rounded-lg p-4">
          <h4 className="font-semibold text-secondary-800 mb-3">申请详情</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-secondary-500">申请人</p>
              <p className="font-medium text-secondary-800">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-secondary-500">联系电话</p>
              <p className="font-medium text-secondary-800">{application.phone}</p>
            </div>
            <div>
              <p className="text-secondary-500">紧急程度</p>
              <Badge className={urgencyColors[application.urgencyLevel]}>
                {urgencyLabels[application.urgencyLevel]}
              </Badge>
            </div>
            <div>
              <p className="text-secondary-500">申请日期</p>
              <p className="font-medium text-secondary-800">
                {new Date(application.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-secondary-500">家庭住址</p>
              <p className="font-medium text-secondary-800">{application.address}</p>
            </div>
            <div className="col-span-2">
              <p className="text-secondary-500">需求描述</p>
              <p className="text-secondary-800">{application.needs}</p>
            </div>
          </div>
        </div>

        {application.recommendedPlan && application.recommendedPlan.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-primary-600" />
              <h4 className="font-semibold text-secondary-800">智能推荐方案</h4>
            </div>
            <div className="bg-white rounded-lg p-3 border border-primary-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-100">
                    <th className="text-left py-2 text-secondary-600">物资名称</th>
                    <th className="text-center py-2 text-secondary-600">数量</th>
                    <th className="text-right py-2 text-secondary-600">单价</th>
                  </tr>
                </thead>
                <tbody>
                  {application.recommendedPlan.map((item, index) => (
                    <tr key={index} className="border-b border-secondary-50">
                      <td className="py-2 font-medium text-secondary-800">{item.name}</td>
                      <td className="py-2 text-center text-secondary-600">{item.quantity}{item.unit}</td>
                      <td className="py-2 text-right text-secondary-500 text-xs">
                        {formatCurrency(item.unitPrice || item.estimatedValue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-primary-100 flex justify-between text-sm">
                <span className="text-secondary-500">预计总价值</span>
                <span className="font-bold text-primary-600">
                  {formatCurrency(application.recommendedPlan.reduce((sum, item) => sum + (item.unitPrice || item.estimatedValue || 0) * item.quantity, 0))}
                </span>
              </div>
              <p className="mt-2 text-xs text-secondary-500">
                推荐理由：根据申请人需求智能推荐
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            审批意见
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={action === 'approve' ? '输入批准意见（可选）' : '输入拒绝原因（必填）'}
            className="w-full px-4 py-3 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            rows={3}
            required={action === 'reject'}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => setAction('reject')}
            className={cn(action === 'reject' && 'ring-2 ring-red-500/50')}
          >
            <X size={16} className="mr-1" />
            拒绝
          </Button>
          <Button
            variant="success"
            onClick={() => setAction('approve')}
            className={cn(action === 'approve' && 'ring-2 ring-success-500/50')}
          >
            <Check size={16} className="mr-1" />
            通过
          </Button>
        </div>

        {action && (
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="ghost" onClick={() => setAction(null)}>
              返回修改
            </Button>
            <Button
              variant={action === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
              loading={loading}
            >
              确认{action === 'approve' ? '批准' : '拒绝'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Applications = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<AssistanceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    application: AssistanceApplication | null;
    level: 'first' | 'second';
  }>({ isOpen: false, application: null, level: 'first' });
  const [recommendedPlan, setRecommendedPlan] = useState<MaterialPlanItem[] | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [tempAppId, setTempAppId] = useState<string>('');
  const [newApplication, setNewApplication] = useState<Partial<AssistanceApplication>>({
    applicantName: '',
    phone: '',
    address: '',
    familyMembers: 1,
    familyIncome: 0,
    urgencyLevel: 'medium',
    needs: '',
    specialSituation: '',
    idCard: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const canReviewFirst = user?.role === 'project_admin' || user?.role === 'foundation_admin';
  const canReviewSecond = user?.role === 'foundation_admin';

  const fetchApplications = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get<AssistanceApplication[]>(`/applications?${params.toString()}`);
    if (response.success && response.data) {
      setApplications(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [search, status]);

  const generateRecommendation = async () => {
    if (!newApplication.urgencyLevel || !newApplication.needs) return;
    
    setGeneratingPlan(true);
    const response = await api.post<{ application: AssistanceApplication; recommendedPlan: MaterialPlanItem[] }>(
      `/applications/${tempAppId}/recommend`,
      {}
    );
    
    if (response.success && response.data) {
      setRecommendedPlan(response.data.recommendedPlan);
    }
    setGeneratingPlan(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const submitData = {
      ...newApplication,
      familyMembers: newApplication.familyMembers || 1,
      urgencyLevel: newApplication.urgencyLevel || 'medium',
    };

    const response = await api.post<AssistanceApplication>('/applications', submitData);
    
    if (response.success && response.data) {
      const appId = response.data.id;
      setTempAppId(appId);

      const recommendResponse = await api.post<{ application: AssistanceApplication; recommendedPlan: MaterialPlanItem[] }>(
        `/applications/${appId}/recommend`,
        {}
      );
      
      if (recommendResponse.success && recommendResponse.data) {
        setRecommendedPlan(recommendResponse.data.recommendedPlan);
      }

      setAddModalOpen(false);
      fetchApplications();
      setNewApplication({
        applicantName: '',
        phone: '',
        address: '',
        familyMembers: 1,
        familyIncome: 0,
        urgencyLevel: 'medium',
        needs: '',
        specialSituation: '',
        idCard: '',
      });
      setRecommendedPlan(null);
      setTempAppId('');
    }
    setSubmitting(false);
  };

  const handleReview = async (level: 'first' | 'second', id: string, comment: string, approved: boolean) => {
    const endpoint = level === 'first' ? 'first-review' : 'second-review';
    const response = await api.post<AssistanceApplication>(`/applications/${id}/${endpoint}`, { approved, comment });
    if (response.success) {
      fetchApplications();
    }
  };

  const handleCreateWorkOrder = async (_id: string) => {
    fetchApplications();
  };



  const pendingCount = applications.filter(a => a.status === 'pending' || a.status === 'recommended' || a.status === 'first_review').length;
  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">受助申请管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            处理受助申请，智能推荐物资方案，执行两级审批
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge variant="warning">
              <AlertTriangle size={12} className="mr-1" />
              {pendingCount} 项待审批
            </Badge>
          )}
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus size={18} className="mr-1" />
            新增申请
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待初审</p>
            <p className="text-2xl font-bold text-warning-600 font-serif">
              {applications.filter(a => a.status === 'pending' || a.status === 'recommended').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待复审</p>
            <p className="text-2xl font-bold text-info-600 font-serif">
              {applications.filter(a => a.status === 'first_review' || a.status === 'second_review').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">已通过</p>
            <p className="text-2xl font-bold text-success-600 font-serif">
              {applications.filter(a => a.status === 'approved').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">已拒绝</p>
            <p className="text-2xl font-bold text-red-600 font-serif">
              {applications.filter(a => a.status === 'rejected').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索申请人姓名或电话"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
            <Button variant="ghost" size="sm" onClick={fetchApplications}>
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
                <TableHead>申请人</TableHead>
                <TableHead>紧急程度</TableHead>
                <TableHead>家庭人口</TableHead>
                <TableHead>需求摘要</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-secondary-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无受助申请</p>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold text-sm">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800">{app.applicantName}</p>
                          <p className="text-xs text-secondary-400">{app.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={urgencyColors[app.urgencyLevel]}>
                        {urgencyLabels[app.urgencyLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-secondary-600">
                      {app.familyMembers}人
                    </TableCell>
                    <TableCell className="text-secondary-600 max-w-xs truncate">
                      {app.needs}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status]}>
                        {statusLabels[app.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-secondary-500">
                      {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {(app.status === 'pending' || app.status === 'recommended') && canReviewFirst && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setReviewModal({ isOpen: true, application: app, level: 'first' })}
                        >
                          初审
                        </Button>
                      )}
                      {(app.status === 'first_review' || app.status === 'second_review') && canReviewSecond && (
                        <Button
                          size="sm"
                          onClick={() => setReviewModal({ isOpen: true, application: app, level: 'second' })}
                        >
                          复审
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setRecommendedPlan(null);
        }}
        title="新增受助申请"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="申请人姓名"
                value={newApplication.applicantName}
                onChange={(e) => setNewApplication({ ...newApplication, applicantName: e.target.value })}
                placeholder="请输入姓名"
                required
              />
            </div>
            <div>
              <Input
                label="联系电话"
                value={newApplication.phone}
                onChange={(e) => setNewApplication({ ...newApplication, phone: e.target.value })}
                placeholder="请输入手机号码"
                required
              />
            </div>
            <div>
              <Input
                label="身份证号"
                value={newApplication.idCard}
                onChange={(e) => setNewApplication({ ...newApplication, idCard: e.target.value })}
                placeholder="请输入身份证号"
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                label="家庭住址"
                value={newApplication.address}
                onChange={(e) => setNewApplication({ ...newApplication, address: e.target.value })}
                placeholder="请输入详细地址"
                icon={<MapPin size={16} className="text-secondary-400" />}
                required
              />
            </div>
            <div>
              <Input
                label="家庭人口数"
                type="number"
                min="1"
                value={newApplication.familyMembers}
                onChange={(e) => setNewApplication({ ...newApplication, familyMembers: parseInt(e.target.value) || 1 })}
                icon={<Users size={16} className="text-secondary-400" />}
                required
              />
            </div>
            <div>
              <Input
                label="家庭月收入"
                type="number"
                min="0"
                value={newApplication.familyIncome}
                onChange={(e) => setNewApplication({ ...newApplication, familyIncome: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Select
                label="紧急程度"
                value={newApplication.urgencyLevel}
                onChange={(e) => setNewApplication({ ...newApplication, urgencyLevel: e.target.value as any })}
                options={urgencyOptions}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              需求描述
            </label>
            <textarea
              value={newApplication.needs}
              onChange={(e) => setNewApplication({ ...newApplication, needs: e.target.value })}
              placeholder="请详细描述家庭困难情况和具体需求..."
              className="w-full px-4 py-3 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <Input
              label="特殊情况（可选）"
              value={newApplication.specialSituation}
              onChange={(e) => setNewApplication({ ...newApplication, specialSituation: e.target.value })}
              placeholder="如：过敏史、慢性病、行动不便等"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={generateRecommendation}
            loading={generatingPlan}
            disabled={!newApplication.urgencyLevel || !newApplication.needs || !tempAppId}
          >
            <Sparkles size={16} className="mr-1" />
            智能推荐物资方案（请先保存草稿）
          </Button>

          {recommendedPlan && recommendedPlan.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" />
                  <h4 className="font-semibold text-secondary-800">智能推荐方案</h4>
                </div>
                <Badge variant="primary">已生成</Badge>
              </div>
              <div className="bg-white rounded-lg p-3 border border-primary-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-100">
                      <th className="text-left py-2 text-secondary-600">物资名称</th>
                      <th className="text-center py-2 text-secondary-600">数量</th>
                      <th className="text-right py-2 text-secondary-600">单价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedPlan.map((item, index) => (
                      <tr key={index} className="border-b border-secondary-50">
                        <td className="py-2 font-medium text-secondary-800">{item.name}</td>
                        <td className="py-2 text-center text-secondary-600">{item.quantity}{item.unit}</td>
                        <td className="py-2 text-right text-secondary-500 text-xs">
                          {formatCurrency(item.unitPrice || item.estimatedValue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 pt-3 border-t border-primary-100 flex justify-between text-sm">
                  <span className="text-secondary-500">预计总价值</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(recommendedPlan.reduce((sum, item) => sum + (item.unitPrice || item.estimatedValue || 0) * item.quantity, 0))}
                  </span>
                </div>
                <p className="mt-2 text-xs text-secondary-500">
                  推荐理由：根据申请人需求智能推荐
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAddModalOpen(false);
                setRecommendedPlan(null);
              }}
            >
              取消
            </Button>
            <Button type="submit" loading={submitting}>
              提交申请
            </Button>
          </div>
        </form>
      </Modal>

      <ReviewModal
        application={reviewModal.application}
        level={reviewModal.level}
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, application: null, level: 'first' })}
        onApprove={(comment) => reviewModal.application
          ? handleReview(reviewModal.level, reviewModal.application.id, comment, true)
          : Promise.resolve()
        }
        onReject={(comment) => reviewModal.application
          ? handleReview(reviewModal.level, reviewModal.application.id, comment, false)
          : Promise.resolve()
        }
      />
    </div>
  );
};

export default Applications;
