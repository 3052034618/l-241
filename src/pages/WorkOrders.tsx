import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Truck, User, MapPin, Package, Clock, Check } from 'lucide-react';
import type { WorkOrder, Carrier } from '../../shared/index.js';
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
  { value: 'created', label: '待指派' },
  { value: 'assigned', label: '待接单' },
  { value: 'accepted', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
];

const statusColors: Record<string, string> = {
  created: 'bg-warning-100 text-warning-700',
  assigned: 'bg-info-100 text-info-700',
  accepted: 'bg-primary-100 text-primary-700',
  delivered: 'bg-success-100 text-success-700',
  completed: 'bg-secondary-100 text-secondary-700',
};

const statusLabels: Record<string, string> = {
  created: '待指派',
  assigned: '待接单',
  accepted: '配送中',
  delivered: '已送达',
  completed: '已完成',
};

const WorkOrders = () => {
  const { user } = useAuthStore();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAssign = user?.role === 'project_admin' || user?.role === 'foundation_admin';

  const fetchWorkOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get<{ workOrders: WorkOrder[] }>(`/workorders?${params.toString()}`);
    if (response.success && response.data) {
      setWorkOrders(response.data.workOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [search, status]);

  const fetchCarriers = async () => {
    const response = await api.get<{ carriers: Carrier[] }>('/workorders/carriers');
    if (response.success && response.data) {
      setCarriers(response.data.carriers);
      if (response.data.carriers.length > 0) {
        setSelectedCarrier(response.data.carriers[0].id);
      }
    }
  };

  const handleAssign = async () => {
    if (!selectedWorkOrder || !selectedCarrier) return;
    setSubmitting(true);

    const response = await api.put(`/workorders/${selectedWorkOrder.id}/assign`, {
      carrierId: selectedCarrier,
    });

    if (response.success) {
      setAssignModalOpen(false);
      fetchWorkOrders();
    }
    setSubmitting(false);
  };

  const handleComplete = async (id: string) => {
    const response = await api.put(`/workorders/${id}/complete`);
    if (response.success) {
      fetchWorkOrders();
    }
  };

  const openAssignModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    fetchCarriers();
    setAssignModalOpen(true);
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const pendingCount = workOrders.filter(w => w.status === 'created' || w.status === 'assigned').length;
  const deliveringCount = workOrders.filter(w => w.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">分配工单管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            管理物资分配工单，指派承运方进行配送
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge variant="warning">
              <Clock size={12} className="mr-1" />
              {pendingCount} 项待处理
            </Badge>
          )}
          {deliveringCount > 0 && (
            <Badge variant="primary">
              <Truck size={12} className="mr-1" />
              {deliveringCount} 项配送中
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待指派</p>
            <p className="text-2xl font-bold text-warning-600 font-serif">
              {workOrders.filter(w => w.status === 'created').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">待接单</p>
            <p className="text-2xl font-bold text-info-600 font-serif">
              {workOrders.filter(w => w.status === 'assigned').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">配送中</p>
            <p className="text-2xl font-bold text-primary-600 font-serif">
              {workOrders.filter(w => w.status === 'accepted').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">已完成</p>
            <p className="text-2xl font-bold text-success-600 font-serif">
              {workOrders.filter(w => w.status === 'completed').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索工单号或受助人"
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
            <Button variant="ghost" size="sm" onClick={fetchWorkOrders}>
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
                <TableHead>工单号</TableHead>
                <TableHead>受助人</TableHead>
                <TableHead>配送地址</TableHead>
                <TableHead className="text-right">物资价值</TableHead>
                <TableHead>承运方</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-secondary-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无分配工单</p>
                  </TableCell>
                </TableRow>
              ) : (
                workOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="font-mono text-sm text-secondary-600">
                      {wo.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 text-xs font-semibold">
                          {wo.beneficiaryName.charAt(0)}
                        </div>
                        <span className="font-medium text-secondary-800">{wo.beneficiaryName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-secondary-600 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-secondary-400 flex-shrink-0" />
                        <span>{wo.deliveryAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary-600">
                      {formatCurrency(wo.totalValue)}
                    </TableCell>
                    <TableCell>
                      {wo.carrierName ? (
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-secondary-400" />
                          <span className="text-secondary-700">{wo.carrierName}</span>
                          {wo.driverName && (
                            <span className="text-xs text-secondary-400">({wo.driverName})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-secondary-400 text-sm">未指派</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[wo.status]}>
                        {statusLabels[wo.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-secondary-500 text-sm">
                      {new Date(wo.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {wo.status === 'created' && canAssign && (
                        <Button
                          size="sm"
                          onClick={() => openAssignModal(wo)}
                        >
                          <Truck size={14} className="mr-1" />
                          指派承运
                        </Button>
                      )}
                      {wo.status === 'delivered' && canAssign && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleComplete(wo.id)}
                        >
                          <Check size={14} className="mr-1" />
                          确认完成
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
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="指派承运方"
        size="md"
      >
        {selectedWorkOrder && (
          <div className="space-y-4">
            <div className="bg-secondary-50 rounded-lg p-4">
              <h4 className="font-semibold text-secondary-800 mb-3">工单信息</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-secondary-500">工单号</p>
                  <p className="font-mono text-secondary-800">{selectedWorkOrder.id}</p>
                </div>
                <div>
                  <p className="text-secondary-500">受助人</p>
                  <p className="font-medium text-secondary-800">{selectedWorkOrder.beneficiaryName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-secondary-500">配送地址</p>
                  <p className="text-secondary-800">{selectedWorkOrder.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-secondary-500">联系电话</p>
                  <p className="font-medium text-secondary-800">{selectedWorkOrder.contactPhone}</p>
                </div>
                <div>
                  <p className="text-secondary-500">物资总价值</p>
                  <p className="font-bold text-primary-600">{formatCurrency(selectedWorkOrder.totalValue)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                物资明细
              </label>
              <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-secondary-600">物资名称</th>
                      <th className="px-3 py-2 text-center text-secondary-600">数量</th>
                      <th className="px-3 py-2 text-right text-secondary-600">价值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWorkOrder.items.map((item, index) => (
                      <tr key={index} className="border-t border-secondary-100">
                        <td className="px-3 py-2 text-secondary-800">{item.name}</td>
                        <td className="px-3 py-2 text-center text-secondary-600">{item.quantity}{item.unit}</td>
                        <td className="px-3 py-2 text-right font-medium text-secondary-800">
                          {formatCurrency(item.estimatedValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                选择承运方
              </label>
              <div className="space-y-2">
                {carriers.map((carrier) => (
                  <label
                    key={carrier.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                      selectedCarrier === carrier.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="carrier"
                        value={carrier.id}
                        checked={selectedCarrier === carrier.id}
                        onChange={(e) => setSelectedCarrier(e.target.value)}
                        className="text-primary-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-secondary-400" />
                          <span className="font-medium text-secondary-800">{carrier.name}</span>
                          {carrier.isNearest && (
                            <Badge variant="primary" className="text-xs">最近</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-secondary-500">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {carrier.driverName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {carrier.distance}km
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-secondary-800">{carrier.phone}</p>
                      <p className="text-xs text-secondary-500">评分 {carrier.rating}★</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAssign} loading={submitting}>
                确认指派
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrders;
