import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { Inventory, ApiResponse, InventoryStatus } from '../../shared/index.js';

const router = Router();

const getInventoryStatus = (quantity: number, safetyStock: number, expiryDate?: string): InventoryStatus => {
  if (quantity === 0) return 'out_of_stock';
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= 30) return 'expiring';
  }
  if (quantity <= safetyStock) return 'warning';
  return 'normal';
};

router.get(
  '/',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { status, category } = req.query;

    let inventory = [...store.inventory];

    if (status) {
      inventory = inventory.filter(i => i.status === status);
    }
    if (category) {
      inventory = inventory.filter(i => i.category === category);
    }

    res.json({ success: true, data: inventory });
  }
);

router.post(
  '/',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<never, ApiResponse<Inventory>, Omit<Inventory, 'id' | 'status' | 'totalValue' | 'lastUpdated'>>, res: Response) => {
    const store = getStore();
    const { name, category, quantity, unit, safetyStock, expiryDate, unitPrice } = req.body;

    const status = getInventoryStatus(quantity, safetyStock, expiryDate);
    const totalValue = quantity * unitPrice;

    const newItem: Inventory = {
      id: generateId('inv'),
      name,
      category,
      quantity,
      unit,
      safetyStock,
      expiryDate,
      unitPrice,
      totalValue,
      status,
      lastUpdated: new Date().toISOString(),
    };

    store.inventory.unshift(newItem);

    res.json({ success: true, data: newItem, message: '物资入库成功' });
  }
);

router.put(
  '/:id',
  authenticate,
  requireRoles(['inventory_admin', 'foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<Inventory>, Partial<Omit<Inventory, 'id' | 'status' | 'totalValue' | 'lastUpdated'>>>, res: Response) => {
    const store = getStore();
    const item = store.inventory.find(i => i.id === req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: '物资不存在' });
      return;
    }

    Object.assign(item, req.body);
    
    if (req.body.quantity !== undefined || req.body.safetyStock !== undefined || req.body.expiryDate !== undefined) {
      item.status = getInventoryStatus(
        req.body.quantity ?? item.quantity,
        req.body.safetyStock ?? item.safetyStock,
        req.body.expiryDate ?? item.expiryDate
      );
    }
    
    if (req.body.quantity !== undefined || req.body.unitPrice !== undefined) {
      item.totalValue = (req.body.quantity ?? item.quantity) * (req.body.unitPrice ?? item.unitPrice);
    }
    
    item.lastUpdated = new Date().toISOString();

    res.json({ success: true, data: item, message: '物资信息更新成功' });
  }
);

export default router;
