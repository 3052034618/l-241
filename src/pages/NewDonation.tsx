import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Plus, Trash2, Banknote, Package, Send, Check } from 'lucide-react';
import type { Donation, DonationItemCreate, DonationCreate } from '../../shared/index.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../utils/api.js';
import Button from '../components/ui/Button.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import Input from '../components/ui/Input.js';
import Select from '../components/ui/Select.js';
import Modal from '../components/ui/Modal.js';

const projectOptions = [
  { value: '', label: '不指定项目（平台统筹分配）' },
  { value: 'proj1', label: '希望小学助学计划 - 教育' },
  { value: 'proj2', label: '困难家庭温暖包 - 助困' },
  { value: 'proj3', label: '灾区重建基金 - 救灾' },
  { value: 'proj4', label: '重病医疗救助 - 医疗' },
];

const categoryOptions = [
  { value: 'food', label: '食品' },
  { value: 'clothing', label: '衣物' },
  { value: 'medical', label: '医疗用品' },
  { value: 'daily', label: '生活用品' },
  { value: 'other', label: '其他' },
];

const NewDonation = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [type, setType] = useState<'money' | 'goods'>('money');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [goods, setGoods] = useState<DonationItemCreate[]>([
    { name: '', quantity: 1, unit: '件', estimatedValue: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [newDonation, setNewDonation] = useState<Donation | null>(null);

  const addItem = () => {
    setGoods([...goods, { name: '', quantity: 1, unit: '件', estimatedValue: 0 }]);
  };

  const removeItem = (index: number) => {
    if (goods.length > 1) {
      setGoods(goods.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DonationItemCreate, value: any) => {
    const newGoods = [...goods];
    newGoods[index] = { ...newGoods[index], [field]: value };
    setGoods(newGoods);
  };

  const calculateTotal = () => {
    if (type === 'money') {
      return parseFloat(amount) || 0;
    }
    return goods.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalValue = calculateTotal();
    
    const donationData: DonationCreate = {
      type,
      totalValue,
      projectId: projectId || undefined,
      ...(type === 'money' ? { amount: parseFloat(amount) } : { goods }),
    };

    const response = await api.post<Donation>('/donations', donationData);
    
    if (response.success && response.data) {
      setNewDonation(response.data);
      setSuccessModalOpen(true);
    }
    setLoading(false);
  };

  const handleViewReceipt = () => {
    setSuccessModalOpen(false);
    navigate('/donations');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-secondary-800 font-serif">发起捐赠</h2>
          <p className="text-sm text-secondary-500 mt-1">您的善举将帮助更多需要帮助的人</p>
        </div>
      </div>

      <Card>
        <div className="p-6 border-b border-secondary-100">
          <h3 className="font-semibold text-secondary-800 mb-4">选择捐赠类型</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('money')}
              className={`p-4 rounded-xl border-2 transition-all ${
                type === 'money'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  type === 'money' ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-500'
                }`}>
                  <Banknote size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-secondary-800">现金捐赠</p>
                  <p className="text-xs text-secondary-500">在线支付，即时到账</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('goods')}
              className={`p-4 rounded-xl border-2 transition-all ${
                type === 'goods'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  type === 'goods' ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-500'
                }`}>
                  <Package size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-secondary-800">物资捐赠</p>
                  <p className="text-xs text-secondary-500">实物捐赠，物流配送</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {type === 'money' ? (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">捐赠金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500 text-xl">¥</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入捐赠金额"
                  className="pl-8 text-xl font-semibold"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex gap-2 mt-3">
                {[50, 100, 200, 500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === String(value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    ¥{value}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-secondary-700">捐赠物资</label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  <Plus size={16} className="mr-1" />
                  添加物资
                </Button>
              </div>
              
              <div className="space-y-4">
                {goods.map((item, index) => (
                  <Card key={index} className="border-dashed">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-secondary-600">物资 {index + 1}</span>
                        {goods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                          <Input
                            label="物资名称"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="如：冬季羽绒服"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="数量"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="单位"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            placeholder="件/箱/个"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="估值（元）"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.estimatedValue}
                            onChange={(e) => updateItem(index, 'estimatedValue', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <Select
              label="捐赠意向项目（可选）"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={projectOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">捐赠留言（可选）</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="写下您想对受助人说的话..."
              className="w-full px-4 py-3 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-secondary-400 mt-1 text-right">{message.length}/200</p>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">捐赠总额</span>
              <span className="text-2xl font-bold text-primary-600 font-serif">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" loading={loading} disabled={calculateTotal() <= 0}>
              <Send size={16} className="mr-1" />
              提交捐赠
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={successModalOpen}
        onClose={() => {}}
        title="捐赠成功"
        size="sm"
        hideCloseButton
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <div className="w-16 h-16 rounded-full bg-success-500 flex items-center justify-center text-white">
              <Check size={32} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-secondary-800 mb-2 font-serif">感谢您的爱心捐赠！</h3>
          <p className="text-secondary-500 mb-6">
            您的捐赠已成功提交，电子票据已生成
          </p>
          
          <div className="bg-secondary-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary-500 text-sm">票据编号</span>
              <span className="font-mono text-secondary-800">{newDonation?.receiptNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-500 text-sm">捐赠金额</span>
              <span className="font-bold text-primary-600">{formatCurrency(newDonation?.totalValue || 0)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button className="flex-1" onClick={handleViewReceipt}>
              查看电子票据
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NewDonation;
