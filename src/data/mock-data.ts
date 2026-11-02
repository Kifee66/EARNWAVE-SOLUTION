export type ActivityKind =
  | 'account'
  | 'package'
  | 'deposit'
  | 'submission'
  | 'earning'
  | 'withdrawal'
  | 'success'

export const publicStats = [
  { label: 'Active publishers', value: '3.8K', trend: '+18%' },
  { label: 'Approved campaigns', value: '1,248', trend: '+12%' },
  { label: 'Avg. payout rate', value: '96.4%', trend: '+2.1%' },
  { label: 'Wallet turnover', value: 'KSh 4.6M', trend: '+9%' },
]

export type PackageOption = {
  id: string
  name: string
  price: number
  description: string
  campaigns: number
  perks: string[]
  badge: string
  featured?: boolean
  rewardPer100Views?: number
  isActive?: boolean
}

export const packageOptions: PackageOption[] = [
  {
    id: 'starter',
    name: 'Starter Boost',
    price: 1500,
    description: 'For publishers testing the platform with a steady first campaign set.',
    campaigns: 5,
    perks: ['5 WhatsApp status ads', 'Basic campaign guidance', 'Unlocks rewards dashboard'],
    badge: 'Best for beginners',
    rewardPer100Views: 18,
  },
  {
    id: 'growth',
    name: 'Growth Plus',
    price: 3500,
    description: 'Balanced package for active publishers scaling up to more campaigns.',
    campaigns: 12,
    perks: ['12 campaign bundles', 'Priority review queue', 'Weekly performance recap'],
    badge: 'Most popular',
    featured: true,
    rewardPer100Views: 32,
  },
  {
    id: 'pro',
    name: 'Pro Reach',
    price: 6200,
    description: 'Premium access for publishers ready to handle larger-volume activity.',
    campaigns: 24,
    perks: ['24 campaign products', 'Enhanced payout priority', 'Dedicated support access'],
    badge: 'High volume',
    rewardPer100Views: 48,
  },
]

export const activityFeed = [
  { id: 1, user: '@Brian254', action: 'created an account', time: '2 min ago', kind: 'account' as ActivityKind },
  { id: 2, user: '@Jane_W', action: 'purchased an advertising package', time: '9 min ago', kind: 'package' as ActivityKind },
  { id: 3, user: '@Faith254', action: 'submitted an advertising screenshot', time: '18 min ago', kind: 'submission' as ActivityKind },
  { id: 4, user: '@DavidK', action: 'received approved rewards', time: '26 min ago', kind: 'earning' as ActivityKind },
  { id: 5, user: '@KevinM', action: 'successfully completed a withdrawal', time: '42 min ago', kind: 'success' as ActivityKind },
  { id: 6, user: '@MaryN', action: 'made a wallet deposit', time: '1 hr ago', kind: 'deposit' as ActivityKind },
]

export const publisherOverview = [
  { label: 'Wallet balance', value: 'KSh 24,500', change: '+KSh 4,200 this month' },
  { label: 'Pending approvals', value: '06', change: '2 require action' },
  { label: 'Available for withdrawal', value: 'KSh 14,800', change: 'Next batch Friday' },
  { label: 'Approved views', value: '18,430', change: '+1,260 today' },
]

export const campaignQueue = [
  { name: 'Solar Water Heater', status: 'Ready to post', due: 'Due today', reward: 'KSh 1,250' },
  { name: 'Basta Food Drive', status: 'Awaiting review', due: 'Due tomorrow', reward: 'KSh 980' },
  { name: 'Mikono Fitness Pack', status: 'Approved', due: 'Reward pending', reward: 'KSh 1,640' },
]

export const recentSubmissions = [
  { id: 'SUB-1208', campaign: 'Airtime Saver', date: '26 Oct 2026', status: 'Approved', amount: 'KSh 760' },
  { id: 'SUB-1204', campaign: 'Golden Health', date: '24 Oct 2026', status: 'Pending', amount: 'KSh 540' },
  { id: 'SUB-1199', campaign: 'Smart Farm Kit', date: '21 Oct 2026', status: 'Rejected', amount: 'KSh 480' },
]

export const withdrawalHistory = [
  { id: 'WD-9001', amount: 'KSh 8,000', status: 'Approved', date: '18 Oct 2026' },
  { id: 'WD-8992', amount: 'KSh 5,400', status: 'Processing', date: '12 Oct 2026' },
  { id: 'WD-8987', amount: 'KSh 3,200', status: 'Completed', date: '09 Oct 2026' },
]

export const adminSummary = [
  { label: 'Total publishers', value: '2,640', change: '+86 this week' },
  { label: 'Wallet inflow', value: 'KSh 8.9M', change: '+12.4% growth' },
  { label: 'Pending review', value: '87', change: '17 high risk' },
  { label: 'Withdrawals', value: 'KSh 3.2M', change: '94% settled' },
]

export const publisherTable = [
  { name: 'Miriam Akinyi', username: '@miriam254', status: 'Active', balance: 'KSh 18,650', risk: 'Low' },
  { name: 'Brian Otieno', username: '@brianot', status: 'Active', balance: 'KSh 9,400', risk: 'Medium' },
  { name: 'Faith Wanjiku', username: '@faitha', status: 'Flagged', balance: 'KSh 2,200', risk: 'High' },
  { name: 'David Kibet', username: '@davidk', status: 'Active', balance: 'KSh 26,330', risk: 'Low' },
]

export const reviewQueue = [
  { id: 'SCR-208', publisher: '@miriam254', campaign: 'Kilimani Growth', status: 'Awaiting review', score: '892 views', amount: 'KSh 1,120' },
  { id: 'SCR-207', publisher: '@faitha', campaign: 'Solar Lift', status: 'Escalated', score: '643 views', amount: 'KSh 860' },
  { id: 'SCR-206', publisher: '@davidk', campaign: 'Aero Kitchen', status: 'Approved', score: '1,240 views', amount: 'KSh 1,480' },
]

export const withdrawalRequests = [
  { id: 'WD-9098', publisher: '@miriam254', amount: 'KSh 12,000', status: 'Pending' },
  { id: 'WD-9094', publisher: '@davidk', amount: 'KSh 8,900', status: 'Processing' },
  { id: 'WD-9087', publisher: '@brianot', amount: 'KSh 5,500', status: 'Pending' },
]

export const platformSteps = [
  { title: 'Create an account', description: 'Register quickly with your details and verify your email address.' },
  { title: 'Purchase a package', description: 'Fund your wallet and unlock campaign bundles aligned to your growth plan.' },
  { title: 'Share on WhatsApp Status', description: 'Post the assigned creative manually in your own WhatsApp Status.' },
  { title: 'Submit evidence', description: 'Upload screenshots for approval and track the status of every submission.' },
  { title: 'Earn after approval', description: 'When views are approved, your earnings become available for withdrawal.' },
]

export const values = [
  { title: 'Transparent approvals', description: 'Every view is subject to review and visible status tracking.' },
  { title: 'Secure wallet flows', description: 'Funds are managed with clear, auditable transaction records.' },
  { title: 'Publisher trust', description: 'We make growth goals, payout rules, and campaign visibility easy to understand.' },
]
