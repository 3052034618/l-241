import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { ProcurementRequest, ApiResponse } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status, search } = req.query;

    let requests = [...store.procurementRequests];

    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      requests = requests.filter(r =>
        r.inventoryName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }

    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: { requests } });
  }
);

router.post(
  '/',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<never, ApiResponse<ProcurementRequest>, { inventoryId: string; itemName: string; category: string; quantity: number; unit: string; estimatedPrice: number; totalAmount: number; reason: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const { inventoryId, itemName, category, quantity, unit, estimatedPrice, totalAmount, reason } = req.body;

    const inventoryItem = store.inventory.find(i => i.id === inventoryId);

    const newRequest: ProcurementRequest = {
      id: generateId('proc'),
      inventoryId,
      inventoryName: inventoryItem?.name || itemName,
      itemName,
      category,
      requestedQuantity: quantity,
      quantity,
      unit,
      estimatedPrice,
      estimatedCost: totalAmount,
      totalAmount,
      reason,
      createdByName: user.name,
      status: 'pending_level1',
      budgetLocked: false,
      createdAt: new Date().toISOString(),
    };

    store.procurementRequests.unshift(newRequest);

    res.json({ success: true, data: newRequest, message: '采购申请已提交' });
  }
);

router.put(
  '/:id/approve',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ProcurementRequest>, { level: 1 | 2; comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const request = store.procurementRequests.find(r => r.id === req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: '采购申请不存在' });
      return;
    }

    const { level, comment } = req.body;

    if (level === 1) {
      if (request.status !== 'pending_level1') {
        res.status(400).json({ success: false, message: '当前状态不允许一级审批' });
        return;
      }
      request.status = 'pending_level2';
      request.level1Approver = user.name;
      request.level1ApprovalTime = new Date().toISOString();
      request.level1Comment = comment || '同意采购';
    } else if (level === 2) {
      if (request.status === 'pending_level2') {
        request.status = 'approved';
        request.level2Approver = user.name;
        request.level2ApprovalTime = new Date().toISOString();
        request.level2Comment = comment || '同意采购';
      } else if (request.status === 'approved') {
        request.status = 'budget_locked';
        request.budgetLocked = true;
        request.level2Comment = comment || '预算已锁定';
      } else {
        res.status(400).json({ success: false, message: '当前状态不允许二级审批' });
        return;
      }
    }

    res.json({ success: true, data: request, message: level === 1 ? '一级审批通过' : '二级审批通过' });
  }
);

router.put(
  '/:id/reject',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ProcurementRequest>, { level: 1 | 2; comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const request = store.procurementRequests.find(r => r.id === req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: '采购申请不存在' });
      return;
    }

    if (request.status === 'rejected' || request.status === 'budget_locked' || request.status === 'completed') {
      res.status(400).json({ success: false, message: '当前状态不允许拒绝' });
      return;
    }

    const { level, comment } = req.body;
    const rejectReason = comment || '拒绝采购';

    request.status = 'rejected';
    request.rejectComment = rejectReason;

    if (level === 1) {
      request.level1Approver = user.name;
      request.level1ApprovalTime = new Date().toISOString();
      request.level1Comment = rejectReason;
    } else {
      request.level2Approver = user.name;
      request.level2ApprovalTime = new Date().toISOString();
      request.level2Comment = rejectReason;
    }

    res.json({ success: true, data: request, message: '采购申请已拒绝' });
  }
);

export default router;
