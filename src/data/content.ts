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
  imagePath: string | null
  isActive: boolean
}

export const platformSteps = [
  { title: 'Create an account', description: 'Register with your details and verify your email address.' },
  { title: 'Browse products', description: 'Review the product packages and their published terms.' },
  { title: 'Payments coming later', description: 'Package checkout will be enabled after payment integration.' },
  { title: 'Submit evidence', description: 'When campaigns are available, submit genuine evidence for administrator review.' },
  { title: 'Review and rewards', description: 'Approved views are calculated using the reward rate captured for your submission.' },
]

export const values = [
  { title: 'Transparent approvals', description: 'Every view is subject to review and visible status tracking.' },
  { title: 'Captured reward rates', description: 'Each submission keeps the reward rate used for its calculation.' },
  { title: 'Published package terms', description: 'Product details and reward rules are displayed before checkout is enabled.' },
]
