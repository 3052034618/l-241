import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { Project, ApiResponse, ProjectType } from '../../shared/index.js';

const router = Router();

const projectTypeNames: Record<ProjectType, string> = {
  education: '助学',
  poverty: '助困',
  disaster: '救灾',
  medical: '医疗',
  other: '其他',
};

router.get(
  '/',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status, type } = req.query;

    let projects = [...store.projects];

    if (status) {
      projects = projects.filter(p => p.status === status);
    }
    if (type) {
      projects = projects.filter(p => p.type === type);
    }

    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: { projects } });
  }
);

router.post(
  '/',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<never, ApiResponse<Project>, Omit<Project, 'id' | 'typeName' | 'progress' | 'fundUsage' | 'createdAt'>>, res: Response) => {
    const store = getStore();
    const { name, type, description, targetAmount, raisedAmount, startDate, endDate, status } = req.body;

    const progress = targetAmount > 0 ? Math.min(100, Math.round(((raisedAmount || 0) / targetAmount) * 1000) / 10) : 0;

    const newProject: Project = {
      id: generateId('proj'),
      name,
      type,
      typeName: projectTypeNames[type],
      description,
      targetAmount,
      raisedAmount: raisedAmount || 0,
      currentRaised: raisedAmount || 0,
      fundraisingGoal: targetAmount,
      progress,
      startDate,
      endDate,
      status: status || 'active',
      fundUsage: [],
      fundUsageTrend: [],
      managerName: getCurrentUser(req)?.name || '',
      beneficiaryCount: 0,
      createdAt: new Date().toISOString(),
    };

    store.projects.unshift(newProject);

    res.json({ success: true, data: newProject, message: '项目创建成功' });
  }
);

router.get(
  '/:id/fund-usage',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }>, res: Response) => {
    const store = getStore();
    const project = store.projects.find(p => p.id === req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: '项目不存在' });
      return;
    }

    res.json({ success: true, data: project.fundUsage });
  }
);

export default router;
