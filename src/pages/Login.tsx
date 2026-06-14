import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, roleNames } from '../store/authStore.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import Select from '../components/ui/Select.js';
import Card from '../components/ui/Card.js';

const roleOptions = [
  { value: 'donor', label: '捐赠人' },
  { value: 'project_admin', label: '项目管理员' },
  { value: 'inventory_admin', label: '物资管理员' },
  { value: 'foundation_admin', label: '基金会负责人' },
];

const demoAccounts = [
  { username: 'donor1', role: 'donor', name: '张三（捐赠人）' },
  { username: 'project_admin', role: 'project_admin', name: '王经理（项目管理员）' },
  { username: 'inventory_admin', role: 'inventory_admin', name: '赵主管（物资管理员）' },
  { username: 'foundation_admin', role: 'foundation_admin', name: '刘主任（基金会负责人）' },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, user, checkAuth, clearError } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState('donor');
  const [username, setUsername] = useState('donor1');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const authenticated = await checkAuth();
      if (authenticated && user) {
        navigate(user.role === 'donor' ? '/donations' : '/dashboard', { replace: true });
      }
      setIsChecking(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const account = demoAccounts.find(a => a.role === selectedRole);
    if (account) {
      setUsername(account.username);
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login({ username, password });
    if (success) {
      const role = useAuthStore.getState().user?.role || 'donor';
      navigate(role === 'donor' ? '/donations' : '/dashboard', { replace: true });
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 flex items-center justify-center">
        <div className="animate-pulse text-white text-lg">正在加载...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 mb-4">
              <Heart size={32} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-800 font-serif mb-2">
              智慧慈善捐赠与物资管理平台
            </h1>
            <p className="text-secondary-500 text-sm">
              请选择角色并登录系统
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Select
                label="登录角色"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={roleOptions}
                required
              />
            </div>

            <div>
              <Input
                label="用户名"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div className="relative">
              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-9 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              {isLoading ? '登录中...' : '登 录'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
            <p className="text-xs text-secondary-500 mb-2">演示账号（密码均为 123456）：</p>
            <div className="text-xs text-secondary-600 space-y-1">
              {demoAccounts.map(account => (
                <div key={account.username} className="flex justify-between">
                  <span>{account.name}</span>
                  <span className="text-secondary-400">{account.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
