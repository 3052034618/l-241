import { useState, useEffect } from 'react';
import { Settings, Plus, Search, Filter, Edit2, Trash2, Check, X, Save, Lock, Shield } from 'lucide-react';
import type { ApprovalRule } from '../../shared/index.js';
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

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'procurement', label: '采购审批' },
  { value: 'assistance', label: '受助审批' },
  { value: 'budget', label: '预算审批' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '禁用' },
];

const typeLabels: Record<string, string> = {
  procurement: '采购审批',
  assistance: '受助审批',
  budget: '预算审批',
};

const typeColors: Record<string, string> = {
  procurement: 'bg-primary-100 text-primary-700',
  assistance: 'bg-info-100 text-info-700',
  budget: 'bg-warning-100 text-warning-700',
};

const roleLabels: Record<string, string> = {
  donor: '捐赠人',
  project_admin: '项目管理员',
  inventory_admin: '物资管理员',
  foundation_admin: '基金会负责人',
};

const levelLabels: Record<number, string> = {
  1: '一级审批',
  2: '二级审批',
  3: '三级审批',
};

const ApprovalRules = () => {
  const { user } = useAuthStore();
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<ApprovalRule> | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'foundation_admin';

  const fetchRules = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const response = await api.get<{ rules: ApprovalRule[] }>(`/approval-rules?${params.toString()}`);
    if (response.success && response.data) {
      setRules(response.data.rules);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [search, type, status]);

  const handleAdd = () => {
    setIsNewRule(true);
    setEditingRule({
      name: '',
      type: 'procurement',
      description: '',
      minAmount: 0,
      maxAmount: 999999,
      level1Role: 'inventory_admin',
      level2Role: 'foundation_admin',
      requireAll: true,
      status: 'active',
    });
    setEditModalOpen(true);
  };

  const handleEdit = (rule: ApprovalRule) => {
    setIsNewRule(false);
    setEditingRule({ ...rule });
    setEditModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const response = await api.put(`/approval-rules/${id}`, { status: newStatus });
    if (response.success) {
      fetchRules();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此审批规则吗？')) return;
    
    const response = await api.delete(`/approval-rules/${id}`);
    if (response.success) {
      fetchRules();
    }
  };

  const handleSave = async () => {
    if (!editingRule) return;
    setSubmitting(true);

    let response;
    if (isNewRule) {
      response = await api.post<ApprovalRule>('/approval-rules', editingRule);
    } else {
      response = await api.put(`/approval-rules/${editingRule.id}`, editingRule);
    }

    if (response.success) {
      setEditModalOpen(false);
      setEditingRule(null);
      fetchRules();
    }
    setSubmitting(false);
  };

  const activeCount = rules.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">审批规则配置</h2>
          <p className="text-sm text-secondary-500 mt-1">
            配置各类审批流程的规则和审批人
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="mr-1" />
            新增规则
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">采购审批规则</p>
                <p className="text-2xl font-bold text-primary-600 font-serif">
                  {rules.filter(r => r.type === 'procurement').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center text-info-600">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">受助审批规则</p>
                <p className="text-2xl font-bold text-info-600 font-serif">
                  {rules.filter(r => r.type === 'assistance').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
                <Settings size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">已启用规则</p>
                <p className="text-2xl font-bold text-warning-600 font-serif">{activeCount}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
                <Check size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">规则总数</p>
                <p className="text-2xl font-bold text-success-600 font-serif">{rules.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索规则名称"
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
              className="w-36"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-32"
            />
            <Button variant="ghost" size="sm" onClick={fetchRules}>
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
                <TableHead>规则名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额范围</TableHead>
                <TableHead>一级审批</TableHead>
                <TableHead>二级审批</TableHead>
                <TableHead>会签方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-secondary-400">
                    <Settings size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无审批规则</p>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-secondary-800">{rule.name}</p>
                        <p className="text-xs text-secondary-400">{rule.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[rule.type]}>
                        {typeLabels[rule.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-secondary-600">
                      ¥{rule.minAmount.toLocaleString()} - ¥{rule.maxAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[rule.level1Role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[rule.level2Role]}</Badge>
                    </TableCell>
                    <TableCell className="text-secondary-600">
                      {rule.requireAll ? '全员会签' : '或签（任一即可）'}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => canEdit && handleToggleStatus(rule.id, rule.status)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          rule.status === 'active'
                            ? 'bg-success-100 text-success-700 hover:bg-success-200'
                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200',
                          !canEdit && 'cursor-not-allowed opacity-70'
                        )}
                        disabled={!canEdit}
                      >
                        {rule.status === 'active' ? <Check size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                        {rule.status === 'active' ? '启用' : '禁用'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
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
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRule(null);
        }}
        title={isNewRule ? '新增审批规则' : '编辑审批规则'}
        size="lg"
      >
        {editingRule && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="规则名称"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="请输入规则名称"
                  required
                />
              </div>
              <div>
                <Select
                  label="规则类型"
                  value={editingRule.type}
                  onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as any })}
                  options={typeOptions.filter(o => o.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="规则描述"
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="请输入规则描述"
                />
              </div>
              <div>
                <Input
                  label="最小金额（元）"
                  type="number"
                  min="0"
                  value={editingRule.minAmount}
                  onChange={(e) => setEditingRule({ ...editingRule, minAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Input
                  label="最大金额（元）"
                  type="number"
                  min="0"
                  value={editingRule.maxAmount}
                  onChange={(e) => setEditingRule({ ...editingRule, maxAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Select
                  label="一级审批角色"
                  value={editingRule.level1Role}
                  onChange={(e) => setEditingRule({ ...editingRule, level1Role: e.target.value as any })}
                  options={[
                    { value: 'inventory_admin', label: '物资管理员' },
                    { value: 'project_admin', label: '项目管理员' },
                    { value: 'foundation_admin', label: '基金会负责人' },
                  ]}
                  required
                />
              </div>
              <div>
                <Select
                  label="二级审批角色"
                  value={editingRule.level2Role}
                  onChange={(e) => setEditingRule({ ...editingRule, level2Role: e.target.value as any })}
                  options={[
                    { value: 'project_admin', label: '项目管理员' },
                    { value: 'foundation_admin', label: '基金会负责人' },
                  ]}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  会签方式
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requireAll"
                      checked={editingRule.requireAll === true}
                      onChange={() => setEditingRule({ ...editingRule, requireAll: true })}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-secondary-700">全员会签（需所有审批人同意）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requireAll"
                      checked={editingRule.requireAll === false}
                      onChange={() => setEditingRule({ ...editingRule, requireAll: false })}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-secondary-700">或签（任一审批人同意即可）</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingRule(null);
                }}
              >
                取消
              </Button>
              <Button onClick={handleSave} loading={submitting}>
                <Save size={16} className="mr-1" />
                保存
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalRules;
