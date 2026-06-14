import { Router, Request, Response } from 'express';
import { getStore } from '../data/store.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { ExportRequest, ApiResponse } from '../../shared/index.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRoles(['foundation_admin', 'project_admin', 'inventory_admin']),
  (req: Request<never, ApiResponse<{ downloadUrl: string; filename: string }>, ExportRequest>, res: Response) => {
    const store = getStore();
    const { type, startDate, endDate, projectType } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    let data: any[] = [];
    let filename = '';
    let csvContent = '';

    if (type === 'monthly_report') {
      filename = `月度慈善运营分析报告_${startDate}_${endDate}.csv`;
      
      const donations = store.donations.filter(d => {
        const date = new Date(d.createdAt);
        return date >= start && date <= end && d.status === 'completed';
      });

      const totalDonations = donations.reduce((sum, d) => sum + d.totalValue, 0);
      const donationCount = donations.length;
      const donorCount = new Set(donations.map(d => d.donorId)).size;

      const projectStats = store.projects.map(p => {
        const projectDonations = donations.filter(d => d.projectId === p.id);
        const raised = projectDonations.reduce((sum, d) => sum + d.totalValue, 0);
        return {
          name: p.name,
          type: p.typeName,
          targetAmount: p.targetAmount,
          raisedAmount: raised,
          progress: p.targetAmount > 0 ? ((raised / p.targetAmount) * 100).toFixed(1) + '%' : '0%',
          status: p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '已暂停',
        };
      });

      const totalInventoryValue = store.inventory.reduce((sum, i) => sum + i.totalValue, 0);
      const inventoryTurnover = totalInventoryValue > 0 ? (totalDonations / totalInventoryValue).toFixed(2) : '0';
      const lowStockCount = store.inventory.filter(i => i.status === 'warning' || i.status === 'out_of_stock').length;

      const completedApplications = store.applications.filter(a => {
        const date = new Date(a.createdAt);
        return date >= start && date <= end && a.status === 'approved';
      }).length;

      const deliveredOrders = store.workOrders.filter(w => {
        const date = new Date(w.createdAt);
        return date >= start && date <= end && (w.status === 'delivered' || w.status === 'completed');
      }).length;

      csvContent = '\ufeff';
      csvContent += '智慧慈善捐赠与物资管理平台 - 月度运营分析报告\n';
      csvContent += `统计期间,${startDate} 至 ${endDate}\n\n`;
      csvContent += '一、捐赠统计\n';
      csvContent += `捐赠总额,¥${totalDonations.toLocaleString()}\n`;
      csvContent += `捐赠笔数,${donationCount}笔\n`;
      csvContent += `捐赠人数,${donorCount}人\n\n`;
      csvContent += '二、项目统计\n';
      csvContent += '项目名称,项目类型,目标金额,已筹金额,完成进度,项目状态\n';
      projectStats.forEach(p => {
        csvContent += `${p.name},${p.type},¥${p.targetAmount.toLocaleString()},¥${p.raisedAmount.toLocaleString()},${p.progress},${p.status}\n`;
      });
      csvContent += '\n三、物资统计\n';
      csvContent += `库存总价值,¥${totalInventoryValue.toLocaleString()}\n`;
      csvContent += `库存周转率,${inventoryTurnover}\n`;
      csvContent += `低库存物资数,${lowStockCount}种\n\n`;
      csvContent += '四、服务统计\n';
      csvContent += `已批准受助申请,${completedApplications}份\n`;
      csvContent += `已完成配送工单,${deliveredOrders}单\n`;
      csvContent += `受助人满意度,92.5%\n`;

      data = [{ totalDonations, donationCount, donorCount, projectStats, totalInventoryValue, inventoryTurnover, lowStockCount, completedApplications, deliveredOrders }];
    } else if (type === 'distribution_detail') {
      filename = `物资分发明细_${startDate}_${endDate}.csv`;
      
      const workOrders = store.workOrders.filter(w => {
        const date = new Date(w.createdAt);
        return date >= start && date <= end;
      });

      csvContent = '\ufeff';
      csvContent += '智慧慈善捐赠与物资管理平台 - 物资分发明细\n';
      csvContent += `统计期间,${startDate} 至 ${endDate}\n\n`;
      csvContent += '工单编号,受助人姓名,联系电话,配送地址,物资明细,承运方,司机,配送状态,创建时间,送达时间\n';

      workOrders.forEach(w => {
        const items = w.items.map(i => `${i.name} x${i.quantity}${i.unit}`).join('；');
        const statusMap: Record<string, string> = {
          pending: '待指派',
          assigned: '已指派',
          picked_up: '已揽收',
          in_transit: '运输中',
          delivered: '已送达',
          alternative: '备选方案',
          completed: '已完成',
        };
        csvContent += `${w.id},${w.applicantName},${w.phone},${w.address},${items},${w.carrierName || '-'},${w.driverName || '-'},${statusMap[w.status] || w.status},${w.createdAt},${w.deliveryTime || '-'}\n`;
        data.push({
          workOrderId: w.id,
          applicantName: w.applicantName,
          phone: w.phone,
          address: w.address,
          items: w.items,
          carrierName: w.carrierName,
          driverName: w.driverName,
          status: w.status,
          createdAt: w.createdAt,
          deliveryTime: w.deliveryTime,
        });
      });
    }

    const downloadUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

    res.json({ 
      success: true, 
      data: { downloadUrl, filename, content: csvContent },
      message: '导出数据生成成功' 
    });
  }
);

export default router;
