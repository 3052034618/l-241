import { Router, Request, Response } from 'express';
import { getStore, generateId, generateReceiptNo, generateQRCode } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { Donation, Receipt, ApiResponse, DonationType } from '../../shared/index.js';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response) => {
  const store = getStore();
  const user = getCurrentUser(req)!;

  let donations = [...store.donations];

  if (user.role === 'donor') {
    donations = donations.filter(d => d.donorId === user.id);
  }

  const { search, type, status } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    donations = donations.filter(d =>
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNo.toLowerCase().includes(q) ||
      (d.projectName && d.projectName.toLowerCase().includes(q))
    );
  }
  if (type) {
    donations = donations.filter(d => d.type === type);
  }
  if (status) {
    donations = donations.filter(d => d.status === status);
  }

  donations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = donations.length;

  res.json({ success: true, data: { donations, total } });
});

router.get('/:id', authenticate, (req: Request<{ id: string }>, res: Response) => {
  const store = getStore();
  const user = getCurrentUser(req)!;
  const donation = store.donations.find(d => d.id === req.params.id);

  if (!donation) {
    res.status(404).json({ success: false, message: '捐赠记录不存在' });
    return;
  }

  if (user.role === 'donor' && donation.donorId !== user.id) {
    res.status(403).json({ success: false, message: '无权查看此记录' });
    return;
  }

  res.json({ success: true, data: donation });
});

router.post(
  '/',
  authenticate,
  requireRoles(['donor']),
  (req: Request<never, ApiResponse<Donation>, { type: DonationType; amount?: number; goods?: { name: string; quantity: number; unit: string; estimatedValue?: number }[]; projectId?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const { type, amount, goods, projectId } = req.body;

    let totalValue = 0;
    if (type === 'money' && amount) {
      totalValue = amount;
    } else if (type === 'goods' && goods && goods.length > 0) {
      totalValue = goods.reduce((sum, g) => sum + (g.estimatedValue || 0), 0);
    } else {
      res.status(400).json({ success: false, message: '捐赠信息不完整' });
      return;
    }

    const project = projectId ? store.projects.find(p => p.id === projectId) : null;
    const receiptNo = generateReceiptNo();

    const newDonation: Donation = {
      id: generateId('don'),
      donorId: user.id,
      donorName: user.name,
      type,
      amount: type === 'money' ? amount : undefined,
      goods: type === 'goods' ? goods : undefined,
      totalValue,
      projectId: project?.id,
      projectName: project?.name,
      receiptNo,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    store.donations.unshift(newDonation);

    const receipt: Receipt = {
      id: generateId('rcp'),
      donationId: newDonation.id,
      receiptNo,
      donorName: user.name,
      amount: totalValue,
      items: type === 'money' ? '爱心捐款' : (goods || []).map(g => `${g.name} x${g.quantity}${g.unit}`).join('、'),
      issueDate: new Date().toISOString().split('T')[0],
      qrCode: generateQRCode(receiptNo),
    };

    store.receipts.push(receipt);

    if (project) {
      project.raisedAmount += totalValue;
      project.progress = Math.min(100, Number(((project.raisedAmount / project.targetAmount) * 100).toFixed(1)));
    }

    res.json({ success: true, data: newDonation, message: '捐赠成功，电子票据已生成' });
  }
);

router.get('/:id/receipt', authenticate, (req: Request<{ id: string }>, res: Response) => {
  const store = getStore();
  const user = getCurrentUser(req)!;
  const donation = store.donations.find(d => d.id === req.params.id);

  if (!donation) {
    res.status(404).json({ success: false, message: '捐赠记录不存在' });
    return;
  }

  if (user.role === 'donor' && donation.donorId !== user.id) {
    res.status(403).json({ success: false, message: '无权查看此票据' });
    return;
  }

  let receipt = store.receipts.find(r => r.donationId === req.params.id);
  
  if (!receipt) {
    receipt = {
      id: generateId('rcp'),
      donationId: donation.id,
      receiptNo: donation.receiptNo,
      donorName: donation.donorName,
      amount: donation.totalValue,
      items: donation.type === 'money' ? '爱心捐款' : (donation.goods || []).map(g => `${g.name} x${g.quantity}${g.unit}`).join('、'),
      issueDate: new Date().toISOString().split('T')[0],
      qrCode: generateQRCode(donation.receiptNo),
    };
    store.receipts.push(receipt);
  }

  res.json({ success: true, data: receipt });
});

export default router;
