import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { WorkOrder, ApiResponse } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status } = req.query;

    let workOrders = [...store.workOrders];

    if (status) {
      workOrders = workOrders.filter(w => w.status === status);
    }

    workOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: workOrders });
  }
);

router.post(
  '/:id/assign-carrier',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<WorkOrder>, { carrierId?: string }>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status !== 'created') {
      res.status(400).json({ success: false, message: '当前状态不允许指派承运方' });
      return;
    }

    let carrierId = req.body.carrierId;
    if (!carrierId) {
      const availableCarriers = store.carriers.filter(c => c.available);
      if (availableCarriers.length === 0) {
        res.status(400).json({ success: false, message: '没有可用的承运方' });
        return;
      }
      carrierId = availableCarriers[Math.floor(Math.random() * availableCarriers.length)].id;
    }

    const carrier = store.carriers.find(c => c.id === carrierId);
    if (!carrier) {
      res.status(404).json({ success: false, message: '承运方不存在' });
      return;
    }

    workOrder.status = 'assigned';
    workOrder.carrierId = carrier.id;
    workOrder.carrierName = carrier.name;
    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 4);
    workOrder.estimatedDelivery = estimatedDelivery.toISOString();

    res.json({ success: true, data: workOrder, message: `已指派承运方：${carrier.name}` });
  }
);

router.post(
  '/:id/accept-order',
  authenticate,
  (req: Request<{ id: string }, ApiResponse<WorkOrder>, { driverName: string; driverPhone: string }>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status !== 'assigned') {
      res.status(400).json({ success: false, message: '当前状态不允许接单' });
      return;
    }

    const { driverName, driverPhone } = req.body;

    workOrder.status = 'picked_up';
    workOrder.driverId = generateId('dr');
    workOrder.driverName = driverName;
    workOrder.driverPhone = driverPhone;

    setTimeout(() => {
      if (workOrder.status === 'picked_up') {
        workOrder.status = 'in_transit';
        workOrder.currentLocation = {
          lat: 39.9042 + (Math.random() - 0.5) * 0.1,
          lng: 116.4074 + (Math.random() - 0.5) * 0.1,
          timestamp: new Date().toISOString(),
        };
      }
    }, 5000);

    res.json({ success: true, data: workOrder, message: '司机已接单' });
  }
);

router.get(
  '/:id/tracking',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status === 'in_transit' && !workOrder.alternativePlanActivated) {
      const now = new Date();
      const estimated = workOrder.estimatedDelivery ? new Date(workOrder.estimatedDelivery) : null;
      
      if (estimated && now.getTime() > estimated.getTime() + 2 * 60 * 60 * 1000) {
        workOrder.alternativePlanActivated = true;
        workOrder.alternativeReason = '配送超时2小时，启动备选方案';
        workOrder.status = 'alternative';
      } else {
        workOrder.currentLocation = {
          lat: 39.9042 + (Math.random() - 0.5) * 0.05,
          lng: 116.4074 + (Math.random() - 0.5) * 0.05,
          timestamp: now.toISOString(),
        };
      }
    }

    const trackingHistory = workOrder.currentLocation ? [workOrder.currentLocation] : [];

    res.json({ 
      success: true, 
      data: { 
        workOrder, 
        trackingHistory,
        estimatedArrival: workOrder.estimatedDelivery,
        isDelayed: workOrder.alternativePlanActivated,
      } 
    });
  }
);

export default router;
