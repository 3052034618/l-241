import { Router, Request, Response } from 'express';
import { getStore } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { ApprovalRule, ApiResponse } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    res.json({ success: true, data: store.approvalRules });
  }
);

router.put(
  '/:id',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<ApprovalRule>, Partial<ApprovalRule>>, res: Response) => {
    const store = getStore();
    const rule = store.approvalRules.find(r => r.id === req.params.id);

    if (!rule) {
      res.status(404).json({ success: false, message: '审批规则不存在' });
      return;
    }

    Object.assign(rule, req.body);
    rule.updatedAt = new Date().toISOString();

    res.json({ success: true, data: rule, message: '审批规则更新成功' });
  }
);

export default router;
