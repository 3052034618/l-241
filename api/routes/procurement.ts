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
    const { status } = req.query;

    let requests = [...store.procurementRequests];

    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: requests });
  }
);

router.post(
  '/:id/approve-level1',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ProcurementRequest>, { comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const request = store.procurementRequests.find(r => r.id === req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: '采购申请不存在' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, message: '当前状态不允许一级审批' });
      return;
    }

    request.status = 'approved_level1';
    request.level1Approver = user.name;
    request.level1ApprovalTime = new Date().toISOString();
    request.level1Comment = req.body.comment || '同意采购';

    res.json({ success: true, data: request, message: '一级审批通过' });
  }
);

router.post(
  '/:id/approve-level2',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ProcurementRequest>, { comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const request = store.procurementRequests.find(r => r.id === req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: '采购申请不存在' });
      return;
    }

    if (request.status !== 'approved_level1') {
      res.status(400).json({ success: false, message: '当前状态不允许二级审批' });
      return;
    }

    request.status = 'approved_level2';
    request.level2Approver = user.name;
    request.level2ApprovalTime = new Date().toISOString();
    request.level2Comment = req.body.comment || '同意采购';
    request.budgetLocked = true;
    request.status = 'budget_locked';

    res.json({ success: true, data: request, message: '二级审批通过，预算已锁定' });
  }
);

router.post(
  '/:id/reject',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ProcurementRequest>, { comment?: string }>, res: Response) => {
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

    const originalStatus = request.status;
    request.status = 'rejected';
    if (originalStatus === 'pending_level1') {
      request.level1Approver = user.name;
      request.level1ApprovalTime = new Date().toISOString();
      request.level1Comment = req.body.comment || '拒绝采购';
    } else {
      request.level2Approver = user.name;
      request.level2ApprovalTime = new Date().toISOString();
      request.level2Comment = req.body.comment || '拒绝采购';
    }
    request.rejectComment = req.body.comment || '拒绝采购';

    res.json({ success: true, data: request, message: '采购申请已拒绝' });
  }
);

export default router;
