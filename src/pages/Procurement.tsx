import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Check, X, Clock, User, Lock, AlertCircle } from 'lucide-react';
import type { ProcurementRequest } from '../../shared/index.js';
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
  { value: 'pending_level1', label: '待一级审批' },
  { value: 'pending_level2', label: '待二级审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'budget_locked', label: '预算已锁定' },
];

const statusColors: Record<string, string> = {
  pending_level1: 'bg-warning-100 text-warning-700',
  pending_level2: 'bg-info-100 text-info-700',
  approved: 'bg-success-100 text-success-700',
  rejected: 'bg-red-100 text-red-700',
  budget_locked: 'bg-secondary-100 text-secondary-700',
};

const statusLabels: Record<string, string> = {
  pending_level1: '待物资主管审批',
  pending_level2: '待项目总监审批',
  approved: '审批通过',
  rejected: '已拒绝',
  budget_locked: '预算已锁定',
};

const categoryLabels: Record<string, string> = {
  food: '食品',
  clothing: '衣物',
  medical: '医疗用品',
  daily: '生活用品',
  other: '其他',
};

interface ApproveModalProps {
  request: ProcurementRequest | null;
  level: 1 | 2;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comment: string) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
}

const ApproveModal = ({ request, level, isOpen, onClose, onApprove, onReject }: ApproveModalProps) => {
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

  if (!request) return null;

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${level === 1 ? '一级' : '二级'}审批`}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-secondary-50 rounded-lg p-4">
          <h4 className="font-semibold text-secondary-800 mb-3">采购申请详情</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-secondary-500">物资名称</p>
              <p className="font-medium text-secondary-800">{request.itemName}</p>
            </div>
            <div>
              <p className="text-secondary-500">类别</p>
              <p className="font-medium text-secondary-800">{categoryLabels[request.category]}</p>
            </div>
            <div>
              <p className="text-secondary-500">采购数量</p>
              <p className="font-medium text-secondary-800">{request.quantity}{request.unit}</p>
            </div>
            <div>
              <p className="text-secondary-500">预估金额</p>
              <p className="font-bold text-primary-600">{formatCurrency(request.estimatedCost)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-secondary-500">采购原因</p>
              <p className="text-secondary-800">{request.reason}</p>
            </div>
          </div>
        </div>

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

const Procurement = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    request: ProcurementRequest | null;
    level: 1 | 2;
  }>({ isOpen: false, request: null, level: 1 });

  const canApproveLevel1 = user?.role === 'inventory_admin' || user?.role === 'foundation_admin';
  const canApproveLevel2 = user?.role === 'foundation_admin';

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get<{ requests: ProcurementRequest[] }>(`/procurement?${params.toString()}`);
    if (response.success && response.data) {
      setRequests(response.data.requests);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [search, status]);

  const handleApprove = async (level: 1 | 2, id: string, comment: string) => {
    const response = await api.put(`/procurement/${id}/approve`, { level, comment });
    if (response.success) {
      fetchRequests();
    }
  };

  const handleReject = async (level: 1 | 2, id: string, comment: string) => {
    const response = await api.put(`/procurement/${id}/reject`, { level, comment });
    if (response.success) {
      fetchRequests();
    }
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const pendingCount = requests.filter(r => r.status === 'pending_level1' || r.status === 'pending_level2').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">采购审批管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            管理采购申请，执行两级审批流程
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning">
            <Clock size={12} className="mr-1" />
            {pendingCount} 项待审批
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待一级审批</p>
            <p className="text-2xl font-bold text-warning-600 font-serif">
              {requests.filter(r => r.status === 'pending_level1').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待二级审批</p>
            <p className="text-2xl font-bold text-info-600 font-serif">
              {requests.filter(r => r.status === 'pending_level2').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">预算已锁定</p>
            <p className="text-2xl font-bold text-success-600 font-serif">
              {requests.filter(r => r.status === 'budget_locked').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索物资名称或申请编号"
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
            <Button variant="ghost" size="sm" onClick={fetchRequests}>
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
                <TableHead>申请编号</TableHead>
                <TableHead>物资名称</TableHead>
                <TableHead className="text-center">数量</TableHead>
                <TableHead className="text-right">预估金额</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>当前审批</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-secondary-400">
                    <ShoppingCart size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无采购申请</p>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm text-secondary-600">
                      {request.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-secondary-800">{request.itemName}</p>
                        <p className="text-xs text-secondary-400">{categoryLabels[request.category]}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-secondary-800">
                      {request.quantity}{request.unit}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary-600">
                      {formatCurrency(request.estimatedCost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 text-xs font-semibold">
                          {request.createdByName.charAt(0)}
                        </div>
                        <span className="text-sm text-secondary-600">{request.createdByName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[request.status]}>
                        {request.status === 'budget_locked' && <Lock size={12} className="mr-1" />}
                        {statusLabels[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-secondary-600">
                      {request.status === 'pending_level1' && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          物资主管
                        </span>
                      )}
                      {request.status === 'pending_level2' && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          项目总监
                        </span>
                      )}
                      {request.status === 'approved' && '待执行'}
                      {request.status === 'budget_locked' && '已完成'}
                      {request.status === 'rejected' && (
                        <span className="text-red-500">
                          <X size={14} className="inline mr-1" />
                          已拒绝
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending_level1' && canApproveLevel1 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setApproveModal({ isOpen: true, request, level: 1 })}
                        >
                          审批
                        </Button>
                      )}
                      {request.status === 'pending_level2' && canApproveLevel2 && (
                        <Button
                          size="sm"
                          onClick={() => setApproveModal({ isOpen: true, request, level: 2 })}
                        >
                          最终审批
                        </Button>
                      )}
                      {request.status === 'approved' && canApproveLevel2 && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(2, request.id, '预算已锁定')}
                        >
                          <Lock size={14} className="mr-1" />
                          锁定预算
                        </Button>
                      )}
                      {request.status === 'rejected' && request.rejectComment && (
                        <Badge variant="danger" className="cursor-help" title={request.rejectComment}>
                          <AlertCircle size={12} className="mr-1" />
                          查看原因
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ApproveModal
        request={approveModal.request}
        level={approveModal.level}
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, request: null, level: 1 })}
        onApprove={(comment) => approveModal.request
          ? handleApprove(approveModal.level, approveModal.request.id, comment)
          : Promise.resolve()
        }
        onReject={(comment) => approveModal.request
          ? handleReject(approveModal.level, approveModal.request.id, comment)
          : Promise.resolve()
        }
      />
    </div>
  );
};

export default Procurement;
