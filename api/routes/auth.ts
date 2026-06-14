import { Router, Request, Response } from 'express';
import { getStore, generateReceiptNo, generateQRCode } from '../data/store.js';
import { createToken, authenticate, getCurrentUser } from '../middleware/auth.js';
import type { LoginRequest, LoginResponse, ApiResponse, Receipt } from '../../shared/index.js';

const router = Router();

router.post('/login', (req: Request<never, LoginResponse, LoginRequest>, res: Response) => {
  const { username, password } = req.body;
  const store = getStore();

  const user = store.users.find(u => u.username === username);
  if (!user) {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
    return;
  }

  const storedPassword = store.passwords[username];
  if (storedPassword !== password) {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
    return;
  }

  const token = createToken(user.id);
  res.json({ success: true, data: { token, user } });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  res.json({ success: true, data: user });
});

router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.json({ success: true, message: '已退出登录' });
});

export default router;
