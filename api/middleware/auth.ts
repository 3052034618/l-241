import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../shared/index.js';
import { getStore } from '../data/store.js';

const tokens = new Map<string, { userId: string; expiresAt: number }>();

export const createToken = (userId: string): string => {
  const token = `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  tokens.set(token, { userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return token;
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);
  const tokenData = tokens.get(token);
  
  if (!tokenData) {
    res.status(401).json({ success: false, message: '无效的认证令牌' });
    return;
  }

  if (tokenData.expiresAt < Date.now()) {
    tokens.delete(token);
    res.status(401).json({ success: false, message: '认证令牌已过期' });
    return;
  }

  const store = getStore();
  const user = store.users.find(u => u.id === tokenData.userId);
  
  if (!user) {
    res.status(401).json({ success: false, message: '用户不存在' });
    return;
  }

  (req as Request & { user: typeof user }).user = user;
  next();
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { role: UserRole } }).user;
    
    if (!user) {
      res.status(401).json({ success: false, message: '未认证' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: '权限不足' });
      return;
    }

    next();
  };
};

export const getCurrentUser = (req: Request) => {
  return (req as Request & { user?: { id: string; role: UserRole; name: string } }).user;
};
