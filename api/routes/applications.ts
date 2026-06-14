import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { AssistanceApplication, MaterialPlanItem, ApiResponse, UrgencyLevel } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status, urgencyLevel } = req.query;

    let applications = [...store.applications];

    if (status) {
      applications = applications.filter(a => a.status === status);
    }
    if (urgencyLevel) {
      applications = applications.filter(a => a.urgency === urgencyLevel);
    }

    applications.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { urgent: 0, critical: 0, high: 1, medium: 2, low: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ success: true, data: applications });
  }
);

router.post(
  '/',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<never, ApiResponse<AssistanceApplication>, Omit<AssistanceApplication, 'id' | 'status' | 'recommendedPlan' | 'firstReviewer' | 'firstReviewTime' | 'firstReviewComment' | 'secondReviewer' | 'secondReviewTime' | 'secondReviewComment' | 'escalated' | 'createdAt'>>, res: Response) => {
    const store = getStore();

    const newApplication: AssistanceApplication = {
      id: generateId('app'),
      ...req.body,
      status: 'pending',
      escalated: false,
      createdAt: new Date().toISOString(),
    };

    store.applications.unshift(newApplication);

    res.json({ success: true, data: newApplication, message: '受助申请已提交' });
  }
);

router.post(
  '/:id/recommend',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }>, res: Response) => {
    const store = getStore();
    const application = store.applications.find(a => a.id === req.params.id);

    if (!application) {
      res.status(404).json({ success: false, message: '申请不存在' });
      return;
    }

    const needs = application.needsDescription.toLowerCase();
    const urgencyMultiplier: Record<string, number> = { low: 1, medium: 1.5, high: 2, critical: 3, urgent: 3 };
    const familyMultiplier = Math.ceil(application.familyMembers.length / 2);

    const recommendedPlan: MaterialPlanItem[] = [];

    if (needs.includes('大米') || needs.includes('粮') || needs.includes('食品') || needs.includes('生活')) {
      const rice = store.inventory.find(i => i.name === '大米');
      if (rice && rice.quantity > 0) {
        recommendedPlan.push({
          inventoryId: rice.id,
          name: rice.name,
          quantity: Math.min(2 * familyMultiplier * urgencyMultiplier, rice.quantity),
          unit: rice.unit,
          available: true,
        });
      }
    }

    if (needs.includes('食用油') || needs.includes('油') || needs.includes('食品') || needs.includes('生活')) {
      const oil = store.inventory.find(i => i.name === '食用油');
      if (oil && oil.quantity > 0) {
        recommendedPlan.push({
          inventoryId: oil.id,
          name: oil.name,
          quantity: Math.min(2 * familyMultiplier, oil.quantity),
          unit: oil.unit,
          available: true,
        });
      }
    }

    if (needs.includes('棉被') || needs.includes('被子') || needs.includes('保暖') || needs.includes('生活')) {
      const blanket = store.inventory.find(i => i.name === '棉被');
      if (blanket && blanket.quantity > 0) {
        recommendedPlan.push({
          inventoryId: blanket.id,
          name: blanket.name,
          quantity: Math.min(2 * familyMultiplier, blanket.quantity),
          unit: blanket.unit,
          available: blanket.quantity >= 2 * familyMultiplier,
        });
      }
    }

    if (needs.includes('书包') || needs.includes('文具') || needs.includes('学习') || needs.includes('教育')) {
      const bag = store.inventory.find(i => i.name === '书包');
      if (bag && bag.quantity > 0) {
        recommendedPlan.push({
          inventoryId: bag.id,
          name: bag.name,
          quantity: Math.min(2, bag.quantity),
          unit: bag.unit,
          available: true,
        });
      }
    }

    if (needs.includes('校服') || needs.includes('服装') || needs.includes('学习')) {
      const uniform = store.inventory.find(i => i.name === '夏季校服');
      if (uniform && uniform.quantity > 0) {
        recommendedPlan.push({
          inventoryId: uniform.id,
          name: uniform.name,
          quantity: Math.min(2, uniform.quantity),
          unit: uniform.unit,
          available: uniform.quantity >= 2,
        });
      }
    }

    if (needs.includes('急救') || needs.includes('药品') || needs.includes('医疗') || needs.includes('健康')) {
      const kit = store.inventory.find(i => i.name === '急救包');
      if (kit && kit.quantity > 0) {
        recommendedPlan.push({
          inventoryId: kit.id,
          name: kit.name,
          quantity: 1,
          unit: kit.unit,
          available: true,
        });
      }
    }

    if (needs.includes('牛奶') || needs.includes('营养') || needs.includes('老人') || needs.includes('孩子')) {
      const milk = store.inventory.find(i => i.name === '牛奶');
      if (milk && milk.quantity > 0) {
        recommendedPlan.push({
          inventoryId: milk.id,
          name: milk.name,
          quantity: Math.min(2 * familyMultiplier, milk.quantity),
          unit: milk.unit,
          available: milk.quantity >= 2 * familyMultiplier,
        });
      }
    }

    if (needs.includes('口罩') || needs.includes('防疫') || needs.includes('医疗')) {
      const mask = store.inventory.find(i => i.name === '口罩');
      if (mask && mask.quantity > 0) {
        recommendedPlan.push({
          inventoryId: mask.id,
          name: mask.name,
          quantity: Math.min(2, mask.quantity),
          unit: mask.unit,
          available: mask.quantity >= 2,
        });
      }
    }

    if (recommendedPlan.length === 0) {
      const rice = store.inventory.find(i => i.name === '大米');
      if (rice) {
        recommendedPlan.push({
          inventoryId: rice.id,
          name: rice.name,
          quantity: Math.min(2 * familyMultiplier, rice.quantity),
          unit: rice.unit,
          available: true,
        });
      }
    }

    application.recommendedPlan = {
      items: recommendedPlan,
      totalValue: recommendedPlan.reduce((sum, item) => sum + (item.estimatedValue || 0), 0),
      reason: '根据申请人需求智能推荐'
    };
    application.status = 'pending';

    res.json({ success: true, data: { application, recommendedPlan }, message: '智能推荐方案已生成' });
  }
);

router.post(
  '/:id/first-review',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<AssistanceApplication>, { approved: boolean; comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const application = store.applications.find(a => a.id === req.params.id);

    if (!application) {
      res.status(404).json({ success: false, message: '申请不存在' });
      return;
    }

    if (application.status !== 'recommended' && application.status !== 'first_review') {
      res.status(400).json({ success: false, message: '当前状态不允许初审' });
      return;
    }

    const { approved, comment } = req.body;

    if (approved) {
      application.status = 'second_review';
    } else {
      application.status = 'rejected';
    }

    application.firstReviewer = user.name;
    application.firstReviewTime = new Date().toISOString();
    application.firstReviewComment = comment || (approved ? '初审通过' : '初审拒绝');

    res.json({ success: true, data: application, message: approved ? '初审通过，进入复审' : '初审拒绝' });
  }
);

router.post(
  '/:id/second-review',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<AssistanceApplication>, { approved: boolean; comment?: string }>, res: Response) => {
    const store = getStore();
    const user = getCurrentUser(req)!;
    const application = store.applications.find(a => a.id === req.params.id);

    if (!application) {
      res.status(404).json({ success: false, message: '申请不存在' });
      return;
    }

    if (application.status !== 'second_review') {
      res.status(400).json({ success: false, message: '当前状态不允许复审' });
      return;
    }

    const { approved, comment } = req.body;

    if (approved) {
      application.status = 'approved';

      const workOrder = {
        id: generateId('wo'),
        applicationId: application.id,
        applicantName: application.applicantName,
        beneficiaryName: application.applicantName,
        address: application.address,
        deliveryAddress: application.address,
        phone: application.contactPhone,
        contactPhone: application.contactPhone,
        items: application.recommendedPlan?.items || [],
        totalValue: application.recommendedPlan?.totalValue || 0,
        status: 'created',
        alternativePlanActivated: false,
        createdAt: new Date().toISOString(),
      };

      store.workOrders.unshift(workOrder);

      if (application.recommendedPlan?.items) {
        application.recommendedPlan.items.forEach(item => {
          const inventory = store.inventory.find(i => i.id === item.inventoryId);
          if (inventory) {
            inventory.quantity = Math.max(0, inventory.quantity - item.quantity);
            inventory.totalValue = inventory.quantity * inventory.unitPrice;
            inventory.lastUpdated = new Date().toISOString();
          }
        });
      }
    } else {
      application.status = 'rejected';
    }

    application.secondReviewer = user.name;
    application.secondReviewTime = new Date().toISOString();
    application.secondReviewComment = comment || (approved ? '复审通过' : '复审拒绝');

    res.json({ success: true, data: application, message: approved ? '复审通过，已生成分配工单' : '复审拒绝' });
  }
);

export default router;
