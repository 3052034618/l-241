export type UserRole = 'donor' | 'project_admin' | 'inventory_admin' | 'foundation_admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  password?: string;
  createdAt: string;
}

export type DonationType = 'money' | 'goods';
export type DonationStatus = 'completed' | 'pending' | 'cancelled';

export interface DonationGood {
  name: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
}

export interface DonationItemCreate {
  name: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
}

export interface DonationCreate {
  type: DonationType;
  totalValue: number;
  projectId?: string;
  amount?: number;
  goods?: DonationItemCreate[];
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  type: DonationType;
  amount?: number;
  goods?: DonationGood[];
  totalValue: number;
  projectId?: string;
  projectName?: string;
  receiptNo: string;
  status: DonationStatus;
  createdAt: string;
}

export interface Receipt {
  id: string;
  donationId: string;
  receiptNo: string;
  donorName: string;
  amount: number;
  items: string;
  issueDate: string;
  qrCode: string;
}

export type InventoryStatus = 'normal' | 'warning' | 'expiring' | 'out_of_stock';

export interface Inventory {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  safetyStock: number;
  expiryDate?: string;
  unitPrice: number;
  totalValue: number;
  lastUpdated: string;
  status: InventoryStatus;
  warning?: boolean;
}

export type ProcurementStatus = 'pending' | 'pending_level1' | 'pending_level2' | 'approved' | 'approved_level1' | 'approved_level2' | 'rejected' | 'budget_locked' | 'completed';

export interface ProcurementRequest {
  id: string;
  inventoryId: string;
  inventoryName: string;
  itemName?: string;
  category?: string;
  requestedQuantity: number;
  quantity?: number;
  unit: string;
  estimatedPrice: number;
  estimatedCost?: number;
  totalAmount: number;
  reason: string;
  createdByName?: string;
  rejectComment?: string;
  status: ProcurementStatus;
  level1Approver?: string;
  level1ApprovalTime?: string;
  level1Comment?: string;
  level2Approver?: string;
  level2ApprovalTime?: string;
  level2Comment?: string;
  budgetLocked: boolean;
  createdAt: string;
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApplicationStatus = 'pending' | 'recommended' | 'first_review' | 'second_review' | 'approved' | 'rejected' | 'escalated';

export interface MaterialPlanItem {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
  available: boolean;
  estimatedValue?: number;
  unitPrice?: number;
}

export interface AssistanceApplication {
  id: string;
  applicantName: string;
  idCard: string;
  phone: string;
  address: string;
  familyMembers: number;
  familyIncome: number;
  specialSituation?: string;
  needs: string;
  urgencyLevel: UrgencyLevel;
  recommendedPlan?: MaterialPlanItem[];
  status: ApplicationStatus;
  firstReviewer?: string;
  firstReviewTime?: string;
  firstReviewComment?: string;
  secondReviewer?: string;
  secondReviewTime?: string;
  secondReviewComment?: string;
  escalated: boolean;
  createdAt: string;
}

export type WorkOrderStatus = 'pending' | 'created' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'alternative' | 'completed';

export interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  applicationId: string;
  applicantName: string;
  beneficiaryName: string;
  address: string;
  deliveryAddress: string;
  phone: string;
  contactPhone: string;
  items: MaterialPlanItem[];
  totalValue: number;
  status: WorkOrderStatus;
  carrierId?: string;
  carrierName?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDelivery?: string;
  currentLocation?: Location;
  deliveryTime?: string;
  alternativePlanActivated: boolean;
  alternativeReason?: string;
  createdAt: string;
}

export interface Carrier {
  id: string;
  name: string;
  contactPerson: string;
  driverName: string;
  phone: string;
  address: string;
  coverageArea: string;
  rating: number;
  available: boolean;
  isNearest?: boolean;
  distance?: number;
}

export type ProjectType = 'education' | 'poverty' | 'disaster' | 'medical' | 'other';
export type ProjectStatus = 'active' | 'completed' | 'suspended';

export interface FundUsage {
  date: string;
  amount: number;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  typeName: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currentRaised?: number;
  fundraisingGoal?: number;
  progress: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  fundUsage: FundUsage[];
  fundUsageTrend?: { date: string; amount: number }[];
  managerName?: string;
  beneficiaryCount?: number;
  createdAt: string;
}

export type ApprovalRuleType = 'procurement' | 'assistance';
export type ApprovalSignType = 'all' | 'any';

export interface ApprovalRule {
  id: string;
  ruleName: string;
  ruleType: ApprovalRuleType;
  description: string;
  minAmount?: number;
  maxAmount?: number;
  firstLevelApproverRole: string;
  secondLevelApproverRole: string;
  signType: ApprovalSignType;
  autoEscalationHours: number;
  deliveryTimeoutHours: number;
  stockWarningThreshold: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalDonations: number;
  totalDonationsYoY: number;
  inventoryTurnover: number;
  inventoryTurnoverYoY: number;
  projectCompletionRate: number;
  projectCompletionRateYoY: number;
  beneficiarySatisfaction: number;
  beneficiarySatisfactionYoY: number;
  donationTrend: { date: string; amount: number }[];
  projectStats: { type: string; completed: number; ongoing: number }[];
  recentDonations: Donation[];
  lowStockItems: Inventory[];
}

export interface ExportRequest {
  type: 'monthly_report' | 'distribution_detail';
  startDate: string;
  endDate: string;
  projectType?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
