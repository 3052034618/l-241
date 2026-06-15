import { Router, Request, Response } from 'express';
import { getStore } from '../data/store.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { WorkOrder, LocationUpdate, ApiResponse } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status, search, logistics } = req.query;

    let workOrders = [...store.workOrders];

    if (status) {
      workOrders = workOrders.filter(w => w.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      workOrders = workOrders.filter(w =>
        w.id.toLowerCase().includes(q) ||
        w.beneficiaryName.toLowerCase().includes(q) ||
        (w.driverName && w.driverName.toLowerCase().includes(q))
      );
    }
    if (logistics === 'true') {
      const logisticsStatuses = ['assigned', 'accepted', 'in_transit', 'delivered'];
      workOrders = workOrders.filter(w => logisticsStatuses.includes(w.status));
    }

    workOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: { workOrders } });
  }
);

router.get(
  '/carriers',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (_req: Request, res: Response) => {
    const store = getStore();
    const carriers = store.carriers.filter(c => c.available);

    res.json({ success: true, data: { carriers } });
  }
);

router.put(
  '/:id/assign',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<WorkOrder>, { carrierId: string }>, res: Response) => {
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

    const carrier = store.carriers.find(c => c.id === req.body.carrierId);
    if (!carrier) {
      res.status(404).json({ success: false, message: '承运方不存在' });
      return;
    }

    workOrder.status = 'assigned';
    workOrder.carrierId = carrier.id;
    workOrder.carrierName = carrier.name;
    workOrder.driverName = carrier.driverName;
    workOrder.driverPhone = carrier.phone;
    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 4);
    workOrder.estimatedDelivery = estimatedDelivery.toISOString();

    res.json({ success: true, data: workOrder, message: `已指派承运方：${carrier.name}` });
  }
);

router.put(
  '/:id/accept',
  authenticate,
  (req: Request<{ id: string }, ApiResponse<WorkOrder>>, res: Response) => {
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

    workOrder.status = 'accepted';

    res.json({ success: true, data: workOrder, message: '司机已接单' });
  }
);

router.put(
  '/:id/start-transit',
  authenticate,
  (req: Request<{ id: string }, ApiResponse<WorkOrder>>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status !== 'accepted') {
      res.status(400).json({ success: false, message: '当前状态不允许开始配送' });
      return;
    }

    workOrder.status = 'in_transit';

    res.json({ success: true, data: workOrder, message: '已开始配送' });
  }
);

router.put(
  '/:id/delivered',
  authenticate,
  (req: Request<{ id: string }, ApiResponse<WorkOrder>>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status !== 'accepted' && workOrder.status !== 'in_transit') {
      res.status(400).json({ success: false, message: '当前状态不允许确认送达' });
      return;
    }

    workOrder.status = 'delivered';
    workOrder.deliveryTime = new Date().toISOString();

    res.json({ success: true, data: workOrder, message: '已确认送达' });
  }
);

router.put(
  '/:id/complete',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<WorkOrder>>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (workOrder.status !== 'delivered') {
      res.status(400).json({ success: false, message: '当前状态不允许完成工单' });
      return;
    }

    workOrder.status = 'completed';

    res.json({ success: true, data: workOrder, message: '工单已完成' });
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

    const now = new Date();
    let isTimeout = false;

    if (workOrder.estimatedDelivery && (workOrder.status === 'accepted' || workOrder.status === 'in_transit')) {
      const estimated = new Date(workOrder.estimatedDelivery);
      if (now.getTime() > estimated.getTime() + 2 * 60 * 60 * 1000) {
        isTimeout = true;
      }
    }

    const updates: LocationUpdate[] = [];

    if (workOrder.status === 'assigned' || workOrder.status === 'accepted' || workOrder.status === 'in_transit' || workOrder.status === 'delivered') {
      const baseLocations = [
        { location: '仓库已出发', status: '已取货', lat: 39.9142, lng: 116.4074 },
        { location: '朝阳区建国路', status: '配送中', lat: 39.9082, lng: 116.4174 },
        { location: '东城区东直门', status: '配送中', lat: 39.9422, lng: 116.4274 },
        { location: '西城区平安里', status: '即将送达', lat: 39.9322, lng: 116.3674 },
        { location: '目的地附近', status: '已到达', lat: 39.9342, lng: 116.3574 },
      ];

      let numUpdates = 1;
      if (workOrder.status === 'delivered') numUpdates = 5;
      else if (workOrder.status === 'in_transit') numUpdates = 4;
      else if (workOrder.status === 'accepted') numUpdates = 2;
      else if (workOrder.status === 'assigned') numUpdates = 1;

      const startTime = new Date(workOrder.createdAt);
      startTime.setHours(startTime.getHours() + 1);

      for (let i = 0; i < numUpdates; i++) {
        const updateTime = new Date(startTime.getTime() + i * 30 * 60 * 1000);
        updates.push({
          ...baseLocations[i],
          timestamp: updateTime.toISOString(),
        });
      }
    }

    const backupCarriers = isTimeout
      ? store.carriers.filter(c => c.available && c.id !== workOrder.carrierId)
      : [];

    res.json({
      success: true,
      data: {
        updates,
        isTimeout,
        backupCarriers,
      },
    });
  }
);

router.put(
  '/:id/switch-carrier',
  authenticate,
  requireRoles(['project_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<WorkOrder>, { newCarrierId: string; reason: string }>, res: Response) => {
    const store = getStore();
    const workOrder = store.workOrders.find(w => w.id === req.params.id);

    if (!workOrder) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    const carrier = store.carriers.find(c => c.id === req.body.newCarrierId);
    if (!carrier) {
      res.status(404).json({ success: false, message: '承运方不存在' });
      return;
    }

    workOrder.carrierId = carrier.id;
    workOrder.carrierName = carrier.name;
    workOrder.driverName = carrier.driverName;
    workOrder.driverPhone = carrier.phone;
    workOrder.alternativePlanActivated = true;
    workOrder.alternativeReason = req.body.reason || '切换承运方';
    const estimatedDelivery = new Date();
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 4);
    workOrder.estimatedDelivery = estimatedDelivery.toISOString();

    res.json({ success: true, data: workOrder, message: `已切换承运方：${carrier.name}` });
  }
);

export default router;
