import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, Filter, Edit2, Trash2, Shield, User, Phone, Mail, Check, X } from 'lucide-react';
import type { User as UserType } from '../../shared/index.js';
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

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'donor', label: '捐赠人' },
  { value: 'project_admin', label: '项目管理员' },
  { value: 'inventory_admin', label: '物资管理员' },
  { value: 'foundation_admin', label: '基金会负责人' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '禁用' },
];

const roleLabels: Record<string, string> = {
  donor: '捐赠人',
  project_admin: '项目管理员',
  inventory_admin: '物资管理员',
  foundation_admin: '基金会负责人',
};

const roleColors: Record<string, string> = {
  donor: 'bg-secondary-100 text-secondary-700',
  project_admin: 'bg-info-100 text-info-700',
  inventory_admin: 'bg-warning-100 text-warning-700',
  foundation_admin: 'bg-primary-100 text-primary-700',
};

const roleIcons: Record<string, React.ReactNode> = {
  donor: <User size={16} />,
  project_admin: <Shield size={16} />,
  inventory_admin: <Shield size={16} />,
  foundation_admin: <Shield size={16} />,
};

const Users = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserType> | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === 'foundation_admin';

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const response = await api.get<{ users: UserType[] }>(`/users?${params.toString()}`);
    if (response.success && response.data) {
      setUsers(response.data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, role, status]);

  const handleAdd = () => {
    setIsNewUser(true);
    setEditingUser({
      username: '',
      name: '',
      phone: '',
      email: '',
      role: 'donor',
      status: 'active',
      password: '123456',
    });
    setEditModalOpen(true);
  };

  const handleEdit = (user: UserType) => {
    setIsNewUser(false);
    setEditingUser({ ...user });
    setEditModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const response = await api.put(`/users/${id}`, { status: newStatus });
    if (response.success) {
      fetchUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    
    const response = await api.delete(`/users/${id}`);
    if (response.success) {
      fetchUsers();
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSubmitting(true);

    let response;
    if (isNewUser) {
      response = await api.post<UserType>('/users', editingUser);
    } else {
      const { password, ...data } = editingUser;
      response = await api.put(`/users/${editingUser.id}`, data);
    }

    if (response.success) {
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const activeCount = users.filter(u => u.status === 'active').length;
  const donorCount = users.filter(u => u.role === 'donor').length;
  const adminCount = users.filter(u => u.role !== 'donor').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">用户管理</h2>
          <p className="text-sm text-secondary-500 mt-1">
            管理系统用户，配置角色和权限
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="mr-1" />
            新增用户
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                <UsersIcon size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">用户总数</p>
                <p className="text-2xl font-bold text-primary-600 font-serif">{users.length}</p>
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
                <p className="text-sm text-secondary-500">活跃用户</p>
                <p className="text-2xl font-bold text-success-600 font-serif">{activeCount}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">捐赠人</p>
                <p className="text-2xl font-bold text-secondary-600 font-serif">{donorCount}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">管理员</p>
                <p className="text-2xl font-bold text-warning-600 font-serif">{adminCount}</p>
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
              placeholder="搜索用户名、姓名、电话"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
              className="w-36"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-32"
            />
            <Button variant="ghost" size="sm" onClick={fetchUsers}>
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
                <TableHead>用户信息</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-secondary-400">
                    <UsersIcon size={40} className="mx-auto mb-2 opacity-50" />
                    <p>暂无用户数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800">{u.name}</p>
                          <p className="text-xs text-secondary-400">{u.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-secondary-600">
                      {u.username}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {u.phone && (
                          <div className="flex items-center gap-1 text-sm text-secondary-600">
                            <Phone size={12} className="text-secondary-400" />
                            {u.phone}
                          </div>
                        )}
                        {u.email && (
                          <div className="flex items-center gap-1 text-xs text-secondary-400">
                            <Mail size={12} />
                            {u.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[u.role]}>
                        <span className="inline-flex items-center gap-1">
                          {roleIcons[u.role]}
                          {roleLabels[u.role]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-secondary-500 text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => canEdit && handleToggleStatus(u.id, u.status)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          u.status === 'active'
                            ? 'bg-success-100 text-success-700 hover:bg-success-200'
                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200',
                          !canEdit && 'cursor-not-allowed opacity-70'
                        )}
                        disabled={!canEdit}
                      >
                        {u.status === 'active' ? <Check size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                        {u.status === 'active' ? '启用' : '禁用'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(u)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          {u.role !== 'foundation_admin' && u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(u.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
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
          setEditingUser(null);
        }}
        title={isNewUser ? '新增用户' : '编辑用户'}
        size="lg"
      >
        {editingUser && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="姓名"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div>
                <Input
                  label="用户名"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="请输入用户名"
                  required
                  disabled={!isNewUser}
                />
              </div>
              <div>
                <Input
                  label="手机号码"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <Input
                  label="邮箱"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <Select
                  label="角色"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  options={roleOptions.filter(o => o.value)}
                  required
                />
              </div>
              {isNewUser && (
                <div>
                  <Input
                    label="初始密码"
                    type="password"
                    value={editingUser.password || '123456'}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="请输入初始密码"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingUser(null);
                }}
              >
                取消
              </Button>
              <Button onClick={handleSave} loading={submitting}>
                保存
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
