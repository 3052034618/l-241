import { Router, Request, Response } from 'express';
import { getStore, generateId } from '../data/store.js';
import { authenticate, requireRoles, getCurrentUser } from '../middleware/auth.js';
import type { User, ApiResponse, UserRole } from '../../shared/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request, res: Response) => {
    const store = getStore();
    const { role } = req.query;

    let users = [...store.users];

    if (role) {
      users = users.filter(u => u.role === role);
    }

    res.json({ success: true, data: users });
  }
);

router.post(
  '/',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<never, ApiResponse<User>, Omit<User, 'id' | 'createdAt'> & { password: string }>, res: Response) => {
    const store = getStore();
    const { username, name, role, phone, email, password } = req.body;

    if (store.users.find(u => u.username === username)) {
      res.status(400).json({ success: false, message: '用户名已存在' });
      return;
    }

    const newUser: User = {
      id: generateId('user'),
      username,
      name,
      role,
      phone,
      email,
      status: 'active',
      password,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    store.passwords[username] = password || '123456';

    res.json({ success: true, data: newUser, message: '用户创建成功' });
  }
);

router.put(
  '/:id',
  authenticate,
  requireRoles(['foundation_admin']),
  (req: Request<{ id: string }, ApiResponse<User>, Partial<Omit<User, 'id' | 'createdAt'>> & { password?: string }>, res: Response) => {
    const store = getStore();
    const user = store.users.find(u => u.id === req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    const { password, ...userData } = req.body;
    Object.assign(user, userData);

    if (password) {
      store.passwords[user.username] = password;
    }

    res.json({ success: true, data: user, message: '用户信息更新成功' });
  }
);

export default router;
