import type {
  User,
  Donation,
  Inventory,
  ProcurementRequest,
  AssistanceApplication,
  WorkOrder,
  Carrier,
  Project,
  ApprovalRule,
  Receipt,
} from '../../shared/index.js';
import {
  initialUsers,
  initialDonations,
  initialInventory,
  initialProcurementRequests,
  initialApplications,
  initialWorkOrders,
  initialCarriers,
  initialProjects,
  initialApprovalRules,
  userPasswords,
} from './mockData.js';

interface DataStore {
  users: User[];
  donations: Donation[];
  inventory: Inventory[];
  procurementRequests: ProcurementRequest[];
  applications: AssistanceApplication[];
  workOrders: WorkOrder[];
  carriers: Carrier[];
  projects: Project[];
  approvalRules: ApprovalRule[];
  receipts: Receipt[];
  passwords: Record<string, string>;
}

let store: DataStore = {
  users: [...initialUsers],
  donations: [...initialDonations],
  inventory: [...initialInventory],
  procurementRequests: [...initialProcurementRequests],
  applications: [...initialApplications],
  workOrders: [...initialWorkOrders],
  carriers: [...initialCarriers],
  projects: [...initialProjects],
  approvalRules: [...initialApprovalRules],
  receipts: [],
  passwords: { ...userPasswords },
};

export const getStore = (): DataStore => store;

export const resetStore = (): void => {
  store = {
    users: [...initialUsers],
    donations: [...initialDonations],
    inventory: [...initialInventory],
    procurementRequests: [...initialProcurementRequests],
    applications: [...initialApplications],
    workOrders: [...initialWorkOrders],
    carriers: [...initialCarriers],
    projects: [...initialProjects],
    approvalRules: [...initialApprovalRules],
    receipts: [],
    passwords: { ...userPasswords },
  };
};

export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

export const generateReceiptNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CS${year}${month}${day}${random}`;
};

export const generateQRCode = (data: string): string => {
  return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIj7wn5iPC90ZXh0Pjwvc3ZnPg==`;
};
