import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Search, Receipt, Filter, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Donation } from '../../shared/index.js';
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
  { value: 'money', label: '现金捐赠' },
  { value: 'goods', label: '物资捐赠' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'approved', label: '已确认' },
  { value: 'pending', label: '待审核' },
  { value: 'rejected', label: '已拒绝' },
];

const statusColors: Record<string, string> = {
  approved: 'bg-success-100 text-success-700',
  pending: 'bg-warning-100 text-warning-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  approved: '已确认',
  pending: '待审核',
  rejected: '已拒绝',
};

const typeLabels: Record<string, string> = {
  money: '现金捐赠',
  goods: '物资捐赠',
};

interface ReceiptModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptModal = ({ donation, isOpen, onClose }: ReceiptModalProps) => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && donation) {
      const fetchReceipt = async () => {
        setLoading(true);
        const response = await api.get<{ receiptNo: string; qrCode: string }>(`/donations/${donation.id}/receipt`);
        if (response.success && response.data) {
          setQrCode(response.data.qrCode);
        }
        setLoading(false);
      };
      fetchReceipt();
    }
  }, [isOpen, donation]);

  if (!donation) return null;

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="电子票据" size="md">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <Heart size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary-800 font-serif">慈善捐赠电子票据</h3>
                <p className="text-xs text-secondary-500">智慧慈善捐赠与物资管理平台</p>
              </div>
            </div>
            <Badge variant="success">
              <Receipt size={14} className="mr-1" />
              票据已生效
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-secondary-500 mb-1">票据编号</p>
              <p className="font-mono font-semibold text-secondary-800">{donation.receiptNo}</p>
            </div>
            <div>
              <p className="text-secondary-500 mb-1">捐赠日期</p>
              <p className="font-medium text-secondary-800">
                {new Date(donation.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div>
              <p className="text-secondary-500 mb-1">捐赠人</p>
              <p className="font-medium text-secondary-800">{donation.donorName}</p>
            </div>
            <div>
              <p className="text-secondary-500 mb-1">捐赠类型</p>
              <p className="font-medium text-secondary-800">{typeLabels[donation.type]}</p>
            </div>
            {donation.projectId && (
              <div>
                <p className="text-secondary-500 mb-1">关联项目</p>
                <p className="font-medium text-secondary-800">{donation.projectName}</p>
              </div>
            )}
            <div>
              <p className="text-secondary-500 mb-1">捐赠金额</p>
              <p className="font-bold text-primary-600 text-lg">{formatCurrency(donation.totalValue)}</p>
            </div>
          </div>

          {donation.goods && donation.goods.length > 0 && (
            <div className="mt-6 border-t border-primary-200 pt-4">
              <p className="text-secondary-500 mb-2 text-sm">捐赠物资明细</p>
              <div className="bg-white rounded-lg overflow-hidden border border-primary-100">
                <table className="w-full text-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-secondary-600 font-medium">物资名称</th>
                      <th className="px-3 py-2 text-center text-secondary-600 font-medium">数量</th>
                      <th className="px-3 py-2 text-right text-secondary-600 font-medium">估值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donation.goods.map((item, index) => (
                      <tr key={index} className="border-t border-secondary-100">
                        <td className="px-3 py-2 text-secondary-800">{item.name}</td>
                        <td className="px-3 py-2 text-center text-secondary-600">{item.quantity}{item.unit}</td>
                        <td className="px-3 py-2 text-right font-medium text-secondary-800">{formatCurrency(item.estimatedValue || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">此票据由系统自动生成，具有法律效力</p>
              <p className="text-xs text-secondary-400">扫码可验证票据真伪</p>
            </div>
            {qrCode ? (
              <div className="w-24 h-24 bg-white p-2 rounded-lg border border-secondary-200">
                <img src={qrCode} alt="票据二维码" className="w-full h-full" />
              </div>
            ) : loading ? (
              <div className="w-24 h-24 bg-white rounded-lg border border-secondary-200 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>关闭</Button>
          <Button
            variant="secondary"
            onClick={() => {
              window.print();
            }}
          >
            <Download size={16} className="mr-1" />
            打印票据
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const Donations = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const pageSize = 10;

  const fetchDonations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const response = await api.get<{ donations: Donation[]; total: number }>(`/donations?${params.toString()}`);
    if (response.success && response.data) {
      setDonations(response.data.donations);
      setTotal(response.data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDonations();
  }, [page, search, type, status]);

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const totalPages = Math.ceil(total / pageSize);

  const isDonor = user?.role === 'donor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">
            {isDonor ? '我的捐赠记录' : '捐赠管理'}
          </h2>
          <p className="text-sm text-secondary-500 mt-1">
            {isDonor ? '查看您的所有捐赠记录和电子票据' : '管理所有捐赠记录，查看电子票据'}
          </p>
        </div>
        {isDonor && (
          <Button onClick={() => navigate('/donations/new')}>
            <Plus size={18} className="mr-1" />
            发起捐赠
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="搜索捐赠人、项目或票据号"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              options={typeOptions}
              className="w-32"
            />
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={statusOptions}
              className="w-32"
            />
            <Button variant="ghost" size="sm" onClick={fetchDonations}>
              <Filter size={16} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>捐赠人</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-secondary-400">
                      <Heart size={40} className="mx-auto mb-2 opacity-50" />
                      <p>暂无捐赠记录</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation, index) => (
                    <TableRow key={donation.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                            {donation.donorName.charAt(0)}
                          </div>
                          <span className="font-medium text-secondary-800">{donation.donorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={donation.type === 'money' ? 'primary' : 'secondary'}>
                          {typeLabels[donation.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-secondary-600">
                        {donation.projectName || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-secondary-800">
                        {formatCurrency(donation.totalValue)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[donation.status])}>
                          {statusLabels[donation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-secondary-500">
                        {new Date(donation.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDonation(donation);
                            setReceiptModalOpen(true);
                          }}
                        >
                          <Eye size={16} className="mr-1" />
                          查看票据
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
                <p className="text-sm text-secondary-500">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2) + i);
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ReceiptModal
        donation={selectedDonation}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  );
};

export default Donations;
