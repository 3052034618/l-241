import { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Clock, AlertTriangle, Phone, Check, Route, RefreshCw, QrCode, ArrowRight, User } from 'lucide-react';
import type { WorkOrder, LocationUpdate, Carrier } from '../../shared/index.js';
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
  { value: 'assigned', label: '待接单' },
  { value: 'accepted', label: '配送中' },
  { value: 'delivered', label: '已送达' },
];

const statusColors: Record<string, string> = {
  assigned: 'bg-info-100 text-info-700',
  accepted: 'bg-primary-100 text-primary-700',
  delivered: 'bg-success-100 text-success-700',
};

const statusLabels: Record<string, string> = {
  assigned: '待接单',
  accepted: '配送中',
  delivered: '已送达',
};

interface TrackingModalProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrackingModal = ({ workOrder, isOpen, onClose }: TrackingModalProps) => {
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [isTimeout, setIsTimeout] = useState(false);
  const [backupCarriers, setBackupCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLocationUpdates = async () => {
    if (!workOrder) return;
    
    const response = await api.get<{ updates: LocationUpdate[]; isTimeout: boolean; backupCarriers: Carrier[] }>(
      `/workorders/${workOrder.id}/tracking`
    );
    
    if (response.success && response.data) {
      setLocationUpdates(response.data.updates);
      setIsTimeout(response.data.isTimeout);
      setBackupCarriers(response.data.backupCarriers);
    }
  };

  useEffect(() => {
    if (isOpen && workOrder) {
      fetchLocationUpdates();
      
      refreshIntervalRef.current = setInterval(() => {
        fetchLocationUpdates();
      }, 5000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isOpen, workOrder]);

  const handleSwitchCarrier = async (carrierId: string) => {
    if (!workOrder) return;
    setLoading(true);
    
    const response = await api.put(`/workorders/${workOrder.id}/switch-carrier`, {
      newCarrierId: carrierId,
      reason: '超时备选方案',
    });
    
    if (response.success) {
      fetchLocationUpdates();
    }
    setLoading(false);
  };

  const handleDelivered = async () => {
    if (!workOrder) return;
    setLoading(true);
    
    const response = await api.put(`/workorders/${workOrder.id}/delivered`);
    if (response.success) {
      onClose();
    }
    setLoading(false);
  };

  if (!workOrder) return null;

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const statusSteps = [
    { key: 'assigned', label: '已指派', icon: <Check size={16} /> },
    { key: 'accepted', label: '司机接单', icon: <QrCode size={16} /> },
    { key: 'in_transit', label: '配送中', icon: <Truck size={16} /> },
    { key: 'delivered', label: '已送达', icon: <MapPin size={16} /> },
  ];

  const getCurrentStepIndex = () => {
    if (workOrder.status === 'delivered') return 3;
    if (workOrder.status === 'accepted' && locationUpdates.length > 0) return 2;
    if (workOrder.status === 'accepted') return 1;
    if (workOrder.status === 'assigned') return 0;
    return -1;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="物流追踪" size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
              <h4 className="font-semibold text-secondary-800">实时位置追踪</h4>
              <Badge variant="primary">
                <RefreshCw size={12} className="mr-1 animate-spin" />
                实时更新
              </Badge>
            </div>
            <div className="p-4">
              <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 256">
                    <path d="M50,200 Q100,100 200,120 T350,80" stroke="#1D3557" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                  </svg>
                </div>
                
                {locationUpdates.length > 0 && (
                  <div className="absolute inset-0">
                    {locationUpdates.map((update, index) => {
                      const x = 50 + (index / (locationUpdates.length - 1 || 1)) * 300;
                      const y = 200 - (index / (locationUpdates.length - 1 || 1)) * 120;
                      const isLast = index === locationUpdates.length - 1;
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500',
                            isLast && 'z-10'
                          )}
                          style={{ left: `${x}px`, top: `${y}px` }}
                        >
                          {isLast ? (
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white animate-pulse shadow-lg">
                                <Truck size={16} />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-success-500 border-2 border-white" />
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-primary-300" />
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="absolute left-[50px] top-[200px] transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-secondary-500 flex items-center justify-center text-white">
                        <Route size={12} />
                      </div>
                    </div>
                    
                    <div className="absolute left-[350px] top-[80px] transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center text-white">
                        <MapPin size={12} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 text-secondary-600">
                    <Truck size={12} className="text-primary-500" />
                    <span>当前位置：{locationUpdates[locationUpdates.length - 1]?.location || '配送中'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary-500 mt-1">
                    <Clock size={12} />
                    <span>预计还需 {locationUpdates.length > 0 ? 25 - locationUpdates.length * 5 : 25} 分钟</span>
                  </div>
                </div>

                {isTimeout && (
                  <div className="absolute top-3 right-3 bg-warning-100 border border-warning-300 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-warning-700 text-sm">
                      <AlertTriangle size={14} />
                      <span>配送超时2小时</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        index <= currentStep
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white border-secondary-200 text-secondary-400'
                      )}>
                        {step.icon}
                      </div>
                      <span className={cn(
                        "text-xs mt-2 font-medium",
                        index <= currentStep ? 'text-primary-600' : 'text-secondary-400'
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={cn(
                        "absolute top-5 left-[60%] w-[80%] h-0.5 -translate-y-1/2",
                        index < currentStep ? 'bg-primary-500' : 'bg-secondary-200'
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="p-4 border-b border-secondary-100">
                <h4 className="font-semibold text-secondary-800">配送信息</h4>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">工单号</span>
                  <span className="font-mono text-secondary-800">{workOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">受助人</span>
                  <span className="text-secondary-800">{workOrder.beneficiaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">配送地址</span>
                  <span className="text-secondary-800 text-right max-w-[150px]">{workOrder.deliveryAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">联系电话</span>
                  <span className="text-secondary-800">{workOrder.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">物资价值</span>
                  <span className="font-bold text-primary-600">{formatCurrency(workOrder.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">状态</span>
                  <Badge className={statusColors[workOrder.status]}>
                    {statusLabels[workOrder.status]}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b border-secondary-100">
                <h4 className="font-semibold text-secondary-800">承运方信息</h4>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">{workOrder.carrierName}</p>
                    <p className="text-xs text-secondary-500">
                      <User size={12} className="inline mr-1" />
                      {workOrder.driverName}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full" size="sm">
                  <Phone size={14} className="mr-1" />
                  联系司机
                </Button>
              </div>
            </Card>

            {isTimeout && backupCarriers.length > 0 && (
              <Card className="border-warning-300 bg-warning-50">
                <div className="p-4 border-b border-warning-200">
                  <div className="flex items-center gap-2 text-warning-700">
                    <AlertTriangle size={18} />
                    <h4 className="font-semibold">超时备选方案</h4>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-warning-600 mb-3">
                    配送已超时2小时，可切换以下备用承运方：
                  </p>
                  {backupCarriers.map((carrier) => (
                    <div
                      key={carrier.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-warning-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-secondary-800">{carrier.name}</p>
                        <p className="text-xs text-secondary-500">
                          {carrier.driverName} · {carrier.distance}km · {carrier.rating}★
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleSwitchCarrier(carrier.id)}
                        loading={loading}
                      >
                        切换
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {workOrder.status === 'accepted' && (
              <Button
                className="w-full"
                variant="success"
                onClick={handleDelivered}
                loading={loading}
              >
                <Check size={16} className="mr-1" />
                确认送达
              </Button>
            )}
          </div>
        </div>

        <Card>
          <div className="p-4 border-b border-secondary-100">
            <h4 className="font-semibold text-secondary-800">配送轨迹记录</h4>
          </div>
          <div className="p-4">
            {locationUpdates.length === 0 ? (
              <div className="text-center py-8 text-secondary-400">
                <Truck size={32} className="mx-auto mb-2 opacity-50" />
                <p>暂无位置记录</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-secondary-200" />
                <div className="space-y-4">
                  {[...locationUpdates].reverse().map((update, index) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                        index === 0 ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-500'
                      )}>
                        {index === 0 ? <Truck size={16} /> : <MapPin size={16} />}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-secondary-800">{update.location}</p>
                          <span className="text-xs text-secondary-400">{formatTime(update.timestamp)}</span>
                        </div>
                        <p className="text-sm text-secondary-500 mt-0.5">{update.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

const Logistics = () => {
  const { user } = useAuthStore();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [trackingModal, setTrackingModal] = useState<{
    isOpen: boolean;
    workOrder: WorkOrder | null;
  }>({ isOpen: false, workOrder: null });

  const fetchWorkOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    params.append('logistics', 'true');

    const response = await api.get<{ workOrders: WorkOrder[] }>(`/workorders?${params.toString()}`);
    if (response.success && response.data) {
      setWorkOrders(response.data.workOrders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [search, status]);

  const openTrackingModal = (workOrder: WorkOrder) => {
    setTrackingModal({ isOpen: true, workOrder });
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const deliveringCount = workOrders.filter(w => w.status === 'accepted').length;
  const timeoutCount = workOrders.filter(w => w.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">物流追踪</h2>
          <p className="text-sm text-secondary-500 mt-1">
            实时追踪物资配送状态，处理超时情况
          </p>
        </div>
        <div className="flex gap-2">
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
              {deliveringCount}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">超时预警</p>
            <p className="text-2xl font-bold text-warning-600 font-serif">
              0
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">已送达</p>
            <p className="text-2xl font-bold text-success-600 font-serif">
              {workOrders.filter(w => w.status === 'delivered').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索工单号、受助人或司机"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          </div>
          <div className="flex gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
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
                <TableHead>承运方/司机</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-secondary-400">
                    <Truck size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无物流信息</p>
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
                    <TableCell>
                      {wo.carrierName ? (
                        <div>
                          <p className="text-sm font-medium text-secondary-800">{wo.carrierName}</p>
                          <p className="text-xs text-secondary-500">{wo.driverName}</p>
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openTrackingModal(wo)}
                        disabled={wo.status === 'created'}
                      >
                        <Route size={14} className="mr-1" />
                        追踪
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <TrackingModal
        workOrder={trackingModal.workOrder}
        isOpen={trackingModal.isOpen}
        onClose={() => setTrackingModal({ isOpen: false, workOrder: null })}
      />
    </div>
  );
};

export default Logistics;
