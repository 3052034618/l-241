import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Heart,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  FolderKanban,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore, roleNames } from '../store/authStore.js';
import { cn } from '@/lib/utils.js';

interface MenuItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: '首页大屏',
    icon: <LayoutDashboard size={20} />,
    roles: ['project_admin', 'inventory_admin', 'foundation_admin'],
  },
  {
    path: '/donations',
    label: '捐赠管理',
    icon: <Heart size={20} />,
    roles: ['donor', 'project_admin', 'inventory_admin', 'foundation_admin'],
  },
  {
    path: '/donations/new',
    label: '发起捐赠',
    icon: <Heart size={20} />,
    roles: ['donor'],
  },
  {
    path: '/inventory',
    label: '物资库存',
    icon: <Package size={20} />,
    roles: ['inventory_admin', 'foundation_admin'],
  },
  {
    path: '/procurement',
    label: '采购审批',
    icon: <ShoppingCart size={20} />,
    roles: ['inventory_admin', 'foundation_admin'],
  },
  {
    path: '/applications',
    label: '受助申请',
    icon: <FileText size={20} />,
    roles: ['project_admin', 'foundation_admin'],
  },
  {
    path: '/workorders',
    label: '分配工单',
    icon: <FileText size={20} />,
    roles: ['project_admin', 'foundation_admin'],
  },
  {
    path: '/logistics',
    label: '物流追踪',
    icon: <Truck size={20} />,
    roles: ['project_admin', 'foundation_admin'],
  },
  {
    path: '/projects',
    label: '项目管理',
    icon: <FolderKanban size={20} />,
    roles: ['project_admin', 'foundation_admin'],
  },
  {
    path: '/approval-rules',
    label: '审批规则',
    icon: <Settings size={20} />,
    roles: ['foundation_admin'],
  },
  {
    path: '/users',
    label: '用户管理',
    icon: <Users size={20} />,
    roles: ['foundation_admin'],
  },
];

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 bg-white border-r border-secondary-200 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <Heart size={18} fill="currentColor" />
              </div>
              <span className="font-semibold text-secondary-800 font-serif">慈善管理平台</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <Heart size={18} fill="currentColor" />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-500 transition-colors"
          >
            {sidebarOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-secondary-600 hover:bg-secondary-100',
                      !sidebarOpen && 'justify-center'
                    )
                  }
                >
                  {item.icon}
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-secondary-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600 font-semibold">
              {user.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-800 truncate">{user.name}</p>
                <p className="text-xs text-secondary-500">{roleNames[user.role]}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-20')}>
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-semibold text-secondary-800 font-serif">
              {filteredMenuItems.find(item => window.location.pathname === item.path)?.label || '慈善管理平台'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-500">
              今天是 {formatDate(new Date().toISOString())}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
