import { Router, Request, Response } from 'express';
import { getStore } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { DashboardStats, ApiResponse } from '../../shared/index.js';

const router = Router();

router.get(
  '/stats',
  authenticate,
  requireRoles(['project_admin', 'inventory_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { projectType, startDate, endDate } = req.query;

    let filteredDonations = store.donations.filter(d => d.status === 'completed');

    if (startDate) {
      filteredDonations = filteredDonations.filter(d => new Date(d.createdAt) >= new Date(startDate as string));
    }
    if (endDate) {
      filteredDonations = filteredDonations.filter(d => new Date(d.createdAt) <= new Date(endDate as string));
    }
    if (projectType) {
      const projects = store.projects.filter(p => p.type === projectType);
      const projectIds = projects.map(p => p.id);
      filteredDonations = filteredDonations.filter(d => d.projectId && projectIds.includes(d.projectId));
    }

    const totalDonations = filteredDonations.reduce((sum, d) => sum + d.totalValue, 0);

    const totalInventoryValue = store.inventory.reduce((sum, i) => sum + i.totalValue, 0);
    const inventoryTurnover = totalDonations > 0 
      ? Number((totalDonations / (totalInventoryValue || 1)).toFixed(2)) 
      : 0;

    const completedProjects = store.projects.filter(p => p.status === 'completed').length;
    const totalProjects = store.projects.length;
    const projectCompletionRate = totalProjects > 0 
      ? Number(((completedProjects / totalProjects) * 100).toFixed(1)) 
      : 0;

    const beneficiarySatisfaction = 92.5;

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayDonations = store.donations
        .filter(d => d.status === 'completed' && d.createdAt.startsWith(dateStr))
        .reduce((sum, d) => sum + d.totalValue, 0);
      return { date: dateStr, amount: dayDonations };
    });

    const projectTypeStats = [
      { type: '助学', completed: store.projects.filter(p => p.type === 'education' && p.status === 'completed').length, ongoing: store.projects.filter(p => p.type === 'education' && p.status === 'active').length },
      { type: '助困', completed: store.projects.filter(p => p.type === 'poverty' && p.status === 'completed').length, ongoing: store.projects.filter(p => p.type === 'poverty' && p.status === 'active').length },
      { type: '救灾', completed: store.projects.filter(p => p.type === 'disaster' && p.status === 'completed').length, ongoing: store.projects.filter(p => p.type === 'disaster' && p.status === 'active').length },
      { type: '医疗', completed: store.projects.filter(p => p.type === 'medical' && p.status === 'completed').length, ongoing: store.projects.filter(p => p.type === 'medical' && p.status === 'active').length },
    ];

    const lowStockItems = store.inventory.filter(i => i.status === 'warning' || i.status === 'out_of_stock' || i.status === 'expiring');

    const recentDonations = [...store.donations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const stats: DashboardStats = {
      totalDonations,
      totalDonationsYoY: 12.5,
      inventoryTurnover,
      inventoryTurnoverYoY: 8.3,
      projectCompletionRate,
      projectCompletionRateYoY: 5.2,
      beneficiarySatisfaction,
      beneficiarySatisfactionYoY: 2.1,
      donationTrend: last30Days,
      projectStats: projectTypeStats,
      recentDonations,
      lowStockItems,
    };

    res.json({ success: true, data: stats });
  }
);

export default router;
