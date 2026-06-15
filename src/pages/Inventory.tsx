import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Calendar, Filter, Clock, PlusCircle } from 'lucide-react';
import type { Inventory, InventoryCreate, ProcurementRequest } from '../../shared/index.js';
import api from '../utils/api.js';
import Button from '../components/ui/Button.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import Input from '../components/ui/Input.js';
import Select from '../components/ui/Select.js';
import Modal from '../components/ui/Modal.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.js';
import { cn } from '@/lib/utils.js';

const categoryOptions = [
  { value: '', label: '全部类别' },
  { value: 'food', label: '食品' },
  { value: 'clothing', label: '衣物' },
  { value: 'medical', label: '医疗用品' },
  { value: 'daily', label: '生活用品' },
  { value: 'other', label: '其他' },
];

const statusColors: Record<string, string> = {
  normal: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  expiring: 'bg-orange-100 text-orange-700',
  out_of_stock: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  normal: '正常',
  warning: '库存预警',
  expiring: '即将过期',
  out_of_stock: '缺货',
};

const categoryLabels: Record<string, string> = {
  food: '食品',
  clothing: '衣物',
  medical: '医疗用品',
  daily: '生活用品',
  other: '其他',
};

const Inventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [procurementModalOpen, setProcurementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryCreate>>({
    name: '',
    category: 'food',
    quantity: 0,
    unit: '件',
    safetyStock: 10,
    expiryDate: '',
    unitPrice: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const response = await api.get<{ inventory: Inventory[] }>(`/inventory?${params.toString()}`);
    if (response.success && response.data) {
      setInventory(response.data.inventory);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [search, category, status]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const response = await api.post<Inventory>('/inventory', newItem as InventoryCreate);
    if (response.success) {
      setAddModalOpen(false);
      fetchInventory();
      setNewItem({
        name: '',
        category: 'food',
        quantity: 0,
        unit: '件',
        safetyStock: 10,
        expiryDate: '',
        unitPrice: 0,
      });
    }
    setSubmitting(false);
  };

  const handleGenerateProcurement = async () => {
    if (!selectedItem) return;
    setSubmitting(true);

    const requiredQuantity = Math.max(
      selectedItem.safetyStock * 2 - selectedItem.quantity,
      selectedItem.safetyStock
    );

    const response = await api.post<ProcurementRequest>('/procurement', {
      inventoryId: selectedItem.id,
      itemName: selectedItem.name,
      category: selectedItem.category,
      quantity: requiredQuantity,
      unit: selectedItem.unit,
      estimatedPrice: selectedItem.unitPrice || 10,
      totalAmount: requiredQuantity * (selectedItem.unitPrice || 10),
      reason: selectedItem.status === 'out_of_stock' 
        ? '库存不足，需补充' 
        : selectedItem.status === 'expiring'
        ? '物资即将过期，需补充'
        : '库存低于安全线',
    });

    if (response.success) {
      setProcurementModalOpen(false);
      fetchInventory();
    }
    setSubmitting(false);
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const warningCount = inventory.filter(i => i.status !== 'normal').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">物资库存管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            管理库存物资，登记入库，设置安全库存预警
          </p>
        </div>
        <div className="flex gap-2">
          {warningCount > 0 && (
            <Badge variant="danger">
              <AlertTriangle size={12} className="mr-1" />
              {warningCount} 项需关注
            </Badge>
          )}
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus size={18} className="mr-1" />
            登记入库
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">物资种类</p>
            <p className="text-2xl font-bold text-secondary-800 font-serif">{inventory.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">库存总价值</p>
            <p className="text-2xl font-bold text-primary-600 font-serif">
              {formatCurrency(inventory.reduce((sum, item) => sum + item.totalValue, 0))}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">库存预警</p>
            <p className="text-2xl font-bold text-warning-600 font-serif">
              {inventory.filter(i => i.status === 'warning').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-secondary-500 mb-1">即将过期</p>
            <p className="text-2xl font-bold text-orange-600 font-serif">
              {inventory.filter(i => i.status === 'expiring').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索物资名称"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              className="w-32"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: '全部状态' },
                { value: 'normal', label: '正常' },
                { value: 'warning', label: '库存预警' },
                { value: 'expiring', label: '即将过期' },
                { value: 'out_of_stock', label: '缺货' },
              ]}
              className="w-32"
            />
            <Button variant="ghost" size="sm" onClick={fetchInventory}>
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
                <TableHead>物资名称</TableHead>
                <TableHead>类别</TableHead>
                <TableHead className="text-center">库存数量</TableHead>
                <TableHead className="text-center">安全库存</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-secondary-400">
                    <Package size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无库存数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          item.status === 'normal' ? 'bg-success-100 text-success-600' :
                          item.status === 'warning' ? 'bg-warning-100 text-warning-600' :
                          item.status === 'expiring' ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                        )}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800">{item.name}</p>
                          <p className="text-xs text-secondary-400">{item.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{categoryLabels[item.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        item.quantity <= item.safetyStock ? 'text-red-600' : 'text-secondary-800'
                      )}>
                        {item.quantity}{item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-secondary-600">
                      {item.safetyStock}{item.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium text-secondary-800">
                      {formatCurrency(item.totalValue)}
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-secondary-400" />
                          <span className={cn(
                            new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                              ? 'text-orange-600'
                              : 'text-secondary-600'
                          )}>
                            {new Date(item.expiryDate).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status]}>
                        {item.status !== 'normal' && <AlertTriangle size={12} className="mr-1" />}
                        {statusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status !== 'normal' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setProcurementModalOpen(true);
                          }}
                        >
                          <PlusCircle size={16} className="mr-1" />
                          生成采购
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
        onClose={() => setAddModalOpen(false)}
        title="登记物资入库"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="物资名称"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="如：医用外科口罩"
                required
              />
            </div>
            <div>
              <Select
                label="物资类别"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                options={categoryOptions.filter(o => o.value)}
                required
              />
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="入库数量"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="单位"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="盒/箱/件"
                  required
                />
              </div>
            </div>
            <div>
              <Input
                label="安全库存预警线"
                type="number"
                min="1"
                value={newItem.safetyStock}
                onChange={(e) => setNewItem({ ...newItem, safetyStock: parseInt(e.target.value) || 10 })}
                required
              />
            </div>
            <div>
              <Input
                label="单价（元）"
                type="number"
                min="0"
                step="0.01"
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Input
                label="有效期（可选）"
                type="date"
                value={newItem.expiryDate}
                onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" loading={submitting}>
              确认入库
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={procurementModalOpen}
        onClose={() => setProcurementModalOpen(false)}
        title="生成采购建议"
        size="sm"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-warning-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-warning-800">库存状态异常</p>
                  <p className="text-sm text-warning-600 mt-1">
                    {selectedItem.name} 当前库存 {selectedItem.quantity}{selectedItem.unit}，
                    低于安全库存 {selectedItem.safetyStock}{selectedItem.unit}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">建议采购数量</span>
                <span className="font-semibold text-secondary-800">
                  {Math.max(selectedItem.safetyStock * 2 - selectedItem.quantity, selectedItem.safetyStock)}{selectedItem.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">预估采购金额</span>
                <span className="font-semibold text-primary-600">
                  {formatCurrency(
                    Math.max(selectedItem.safetyStock * 2 - selectedItem.quantity, selectedItem.safetyStock)
                    * (selectedItem.unitPrice || 10)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">审批流程</span>
                <span className="text-secondary-800">物资主管 → 项目总监</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setProcurementModalOpen(false)}>
                取消
              </Button>
              <Button loading={submitting} onClick={handleGenerateProcurement}>
                生成采购申请
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
