import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  FileText,
  Gauge,
  LockKeyhole,
  LogIn,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UploadCloud,
  UserPlus,
  WalletCards,
} from 'lucide-react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  activityFeed,
  adminSummary,
  campaignQueue,
  packageOptions,
  platformSteps,
  publicStats,
  publisherOverview,
  publisherTable,
  recentSubmissions,
  reviewQueue,
  withdrawalHistory,
  withdrawalRequests,
  values,
  type PackageOption,
} from './data/mock-data'
import { cn } from './lib/utils'

type UserRole = 'publisher' | 'admin'

type Props = {
  role: UserRole
  loggedIn: boolean
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
}

function App() {
  const [role, setRole] = useState<UserRole>('publisher')
  const [loggedIn, setLoggedIn] = useState(false)
  const [packageList, setPackageList] = useState<PackageOption[]>(packageOptions)

  return (
    <BrowserRouter>
      <AppShell
        role={role}
        loggedIn={loggedIn}
        setRole={setRole}
        setLoggedIn={setLoggedIn}
        packageList={packageList}
        setPackageList={setPackageList}
      />
    </BrowserRouter>
  )
}

function AppShell({ role, loggedIn, setRole, setLoggedIn, packageList, setPackageList }: Props & { packageList: PackageOption[]; setPackageList: React.Dispatch<React.SetStateAction<PackageOption[]>> }) {
  const location = useLocation()
  const mainLinks = [
    { label: 'Home', path: '/' },
    { label: 'Packages', path: '/packages' },
    { label: 'How it works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-teal-500 text-lg font-bold text-white shadow-lg shadow-sky-500/30">
              E
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900">Earnwave</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Solutions</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {mainLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => cn('nav-link', isActive && 'active')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setRole(role === 'publisher' ? 'admin' : 'publisher')}
              className="secondary-button"
            >
              Demo: {role === 'publisher' ? 'Publisher' : 'Admin'}
            </button>
            {loggedIn ? (
              <>
                <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="secondary-button">
                  {role === 'admin' ? 'Admin panel' : 'Dashboard'}
                </Link>
                <button type="button" onClick={() => setLoggedIn(false)} className="primary-button">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-button">
                  Login
                </Link>
                <Link to="/register" className="primary-button">
                  Register
                </Link>
              </>
            )}
          </div>

          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="pb-16">
        <Routes>
          <Route path="/" element={<HomePage packageList={packageList} />} />
          <Route path="/packages" element={<PackagesPage packageList={packageList} />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<LegalPage title="Terms and Conditions" />} />
          <Route path="/privacy" element={<LegalPage title="Privacy Policy" />} />
          <Route
            path="/login"
            element={<LoginPage setRole={setRole} setLoggedIn={setLoggedIn} role={role} />}
          />
          <Route
            path="/register"
            element={<RegisterPage setRole={setRole} setLoggedIn={setLoggedIn} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="publisher" loggedIn={loggedIn} role={role}>
                <PublisherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin" loggedIn={loggedIn} role={role}>
                <AdminDashboard packageList={packageList} setPackageList={setPackageList} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="section-shell grid gap-8 py-12 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-teal-500 text-lg font-bold text-white">
                E
              </div>
              <div>
                <div className="text-lg font-black text-white">Earnwave</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Solutions</div>
              </div>
            </div>
            <p className="max-w-sm text-sm text-slate-400">
              A fintech-styled publisher growth platform for manual WhatsApp Status advertising and review-based rewards.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Platform</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/packages">Packages</Link></li>
              <li><Link to="/how-it-works">How it works</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/terms">Terms and Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
      </footer>
      {location.pathname === '/' ? <div className="h-10" /> : null}
    </div>
  )
}

function ProtectedRoute({
  requiredRole,
  loggedIn,
  role,
  children,
}: {
  requiredRole: UserRole
  loggedIn: boolean
  role: UserRole
  children: React.ReactNode
}) {
  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (role !== requiredRole) {
    return <Navigate to={requiredRole === 'admin' ? '/' : '/dashboard'} replace />
  }

  return <>{children}</>
}

function HomePage({ packageList }: { packageList: PackageOption[] }) {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="section-shell grid gap-10 py-18 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-100">
              <ShieldCheck className="h-4 w-4" />
              Manual WhatsApp Status advertising, reviewed by admins
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Turn your status views into a verified income stream.
            </h1>
            <p className="mt-6 max-w-lg text-base text-slate-300 md:text-lg">
              Earnwave connects publishers with campaigns, wallet funding, and fair approval workflows built for WhatsApp Status marketing.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="primary-button bg-sky-500 hover:bg-sky-400">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/login" className="secondary-button border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
                Login
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Secure wallet operations</div>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Manual review approval</div>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Real payouts</div>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card border-slate-700 bg-slate-900/90 p-5 text-slate-50 shadow-2xl shadow-sky-500/10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Publisher overview</p>
                  <h2 className="mt-2 text-2xl font-bold">Wallet health</h2>
                </div>
                <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-800 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Available balance</span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">+12.4%</span>
                  </div>
                  <div className="mt-3 text-3xl font-black text-white">KSh 24,500</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <StatsTile label="Approved views" value="18.4K" accent="sky" />
                  <StatsTile label="Pending review" value="06" accent="amber" />
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>Campaign completion</span>
                    <span className="font-semibold text-sky-300">82%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
                    <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-sky-500 to-teal-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Platform stats</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Built for transparent growth</h2>
          </div>
          <Link to="/packages" className="hidden items-center gap-2 text-sm font-semibold text-sky-700 md:inline-flex">
            View packages <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {publicStats.map((item) => (
            <div key={item.label} className="stat-card">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{item.value}</div>
              <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{item.trend}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Simple flow. Visible rewards.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-5">
            {platformSteps.map((step, index) => (
              <div key={step.title} className="glass-card p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Packages</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Choose the right plan</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {packageList.map((item) => (
            <div
              key={item.id}
              className={cn(
                'glass-card flex h-full flex-col p-6',
                item.featured && 'border-sky-300 bg-sky-50/80 shadow-xl shadow-sky-100',
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{item.badge}</div>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{item.name}</h3>
                </div>
                {item.featured ? <div className="rounded-full bg-sky-600 px-2 py-1 text-xs font-semibold text-white">Popular</div> : null}
              </div>
              <div className="mb-4 text-4xl font-black tracking-tight text-slate-900">
                KSh {item.price.toLocaleString()}
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                <BriefcaseBusiness className="h-4 w-4 text-sky-600" />
                <span>{item.campaigns} advertising products</span>
              </div>
              <ul className="mt-5 space-y-3">
                {item.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex items-center gap-3 pt-4">
                <Link to="/register" className="primary-button flex-1">
                  Purchase plan
                </Link>
                <button type="button" className="secondary-button flex-1">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Live activity feed</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Recent platform activity</h2>
            <p className="mt-3 max-w-md text-slate-300">
              This demonstration feed is intentionally fictional and structured so genuine events can later be connected to Supabase Realtime.
            </p>
          </div>

          <div className="glass-card border-slate-700 bg-slate-900/70 p-5 text-white shadow-2xl shadow-sky-500/10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Bell className="h-4 w-4 text-sky-400" /> Activity stream
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400" /> Live demo
              </div>
            </div>

            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
                    {item.kind === 'account' ? <UserPlus className="h-4 w-4" /> : null}
                    {item.kind === 'package' ? <BriefcaseBusiness className="h-4 w-4" /> : null}
                    {item.kind === 'deposit' ? <CreditCard className="h-4 w-4" /> : null}
                    {item.kind === 'submission' ? <UploadCloud className="h-4 w-4" /> : null}
                    {item.kind === 'earning' ? <CircleDollarSign className="h-4 w-4" /> : null}
                    {item.kind === 'success' ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-100">
                      <span className="font-semibold text-white">{item.user}</span> {item.action}
                    </p>
                    <div className="mt-1 text-xs text-slate-400">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function PackagesPage({ packageList }: { packageList: PackageOption[] }) {
  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Packages</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Publisher packages</h1>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {packageList.map((item) => (
          <div key={item.id} className="glass-card p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{item.badge}</div>
            <h2 className="mt-3 text-3xl font-black text-slate-900">KSh {item.price.toLocaleString()}</h2>
            <div className="mt-2 text-xl font-bold text-slate-800">{item.name}</div>
            <p className="mt-4 text-sm text-slate-600">{item.description}</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {item.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {perk}
                </li>
              ))}
            </ul>
            <button type="button" className="primary-button mt-7 w-full">
              Purchase {item.name}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorksPage() {
  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">How it works</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">A clear path to earning</h1>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {platformSteps.map((step, index) => (
          <div key={step.title} className="glass-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">{index + 1}</div>
            <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AboutPage() {
  return (
    <section className="section-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">About us</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Built for trust, growth, and clear rewards.</h1>
          <p className="mt-5 text-lg text-slate-600">
            Earnwave Solution helps marketers and publishers coordinate ad campaigns without ambiguity. Publishers purchase packages, share branded materials through WhatsApp Status, and submit proof for manual review before earnings are approved.
          </p>
        </div>

        <div className="grid gap-4">
          {values.map((item) => (
            <div key={item.title} className="glass-card p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactPage() {
  return (
    <section className="section-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Contact us</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">We are here to help.</h1>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-sky-600" /> support@earnwave.co.ke</div>
            <div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-sky-600" /> +254 700 123 456</div>
            <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-sky-600" /> Nairobi, Kenya</div>
          </div>
        </div>

        <div className="glass-card p-6">
          <form className="grid gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">Full name</label>
              <input className="input-field" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input className="input-field" type="email" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Message</label>
              <textarea className="input-field min-h-28" placeholder="How can we help you?" />
            </div>
            <button type="button" className="primary-button w-full md:w-auto">Send message</button>
          </form>
        </div>
      </div>
    </section>
  )
}

function LegalPage({ title }: { title: string }) {
  return (
    <section className="section-shell py-16">
      <div className="glass-card p-8 md:p-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          <p>
            Earnwave Solutions is a digital platform that connects publishers with campaign opportunities and review-based reward flows. The platform is intended for users to purchase packages, share assigned materials on their WhatsApp Status, and submit evidence for administrator review.
          </p>
          <p>
            All payments, deposits, and withdrawal requests are subject to verification, anti-fraud checks, and administrative approval. Users must ensure that screenshots and evidence are genuine, matching platform instructions, and not manipulated in any way.
          </p>
          <p>
            Administrators reserve the right to reject submissions, suspend accounts, and reverse payments if dishonest conduct, fraudulent evidence, or platform policy violations are detected. Users agree to maintain accurate profile details, including valid Kenyan phone numbers and complete account information.
          </p>
          <p>
            The platform does not automatically retrieve WhatsApp Status views. Manual status posting is required and all views only become eligible for payout after administrative approval. The demonstration content on this site uses sample activity and fictional user identifiers for design testing and launch previews.
          </p>
        </div>
      </div>
    </section>
  )
}

function LoginPage({
  setRole,
  setLoggedIn,
  role,
}: {
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
  role: UserRole
}) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-5xl grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-700 via-sky-600 to-teal-500 p-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Welcome back to Earnwave.</h1>
          <p className="mt-4 max-w-md text-sky-100">
            Manage your wallet, keep track of packages, and review campaign activity from your publisher dashboard.
          </p>
          <div className="mt-8 space-y-4 text-sm text-sky-50">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Secure account access</div>
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Real-time reward tracking</div>
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Simple submission review</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-2">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Login</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">Publish with confidence</h2>
              </div>
              <div className="rounded-full bg-sky-100 p-2 text-sky-700"><LogIn className="h-5 w-5" /></div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-sm font-semibold text-slate-700">Sign in as</label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('publisher')}
                  className={cn(
                    'flex-1 rounded-full border px-3 py-2 text-sm font-semibold',
                    role === 'publisher' ? 'border-sky-500 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-700',
                  )}
                >
                  Publisher
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={cn(
                    'flex-1 rounded-full border px-3 py-2 text-sm font-semibold',
                    role === 'admin' ? 'border-sky-500 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-700',
                  )}
                >
                  Admin
                </button>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Email address</label>
                <input className="input-field" type="email" placeholder="publisher@earnwave.co.ke" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input className="input-field pr-11" type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((open) => !open)}
                    className="absolute right-3 top-[0.9rem] text-xs font-semibold text-slate-500"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <label className="inline-flex items-center gap-2"><input type="checkbox" /> Remember me</label>
                <Link to="/" className="font-semibold text-sky-700">Forgot password?</Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoggedIn(true)
                  navigate(role === 'admin' ? '/admin' : '/dashboard')
                }}
                className="primary-button w-full"
              >
                Sign in to {role === 'admin' ? 'admin' : 'publisher'} dashboard
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account? <Link to="/register" className="font-semibold text-sky-700">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RegisterPage({
  setRole,
  setLoggedIn,
}: {
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
}) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Register</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Create your publisher account</h1>
          </div>
          <div className="rounded-full bg-sky-100 p-3 text-sky-700"><UserPlus className="h-6 w-6" /></div>
        </div>

        <form className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Full name</label>
            <input className="input-field" placeholder="Jane Wanjiku" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Username</label>
            <input className="input-field" placeholder="@jane_w" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Email address</label>
            <input className="input-field" type="email" placeholder="jane@example.com" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Phone number</label>
            <input className="input-field" placeholder="+254712345678" />
          </div>
          <div className="md:col-span-1 relative">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input className="input-field pr-11" type={showPassword ? 'text' : 'password'} placeholder="Create password" />
            <button type="button" onClick={() => setShowPassword((open) => !open)} className="absolute right-3 top-[2.5rem] text-xs font-semibold text-slate-500">{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div className="md:col-span-1 relative">
            <label className="text-sm font-semibold text-slate-700">Confirm password</label>
            <input className="input-field pr-11" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" />
            <button type="button" onClick={() => setShowConfirm((open) => !open)} className="absolute right-3 top-[2.5rem] text-xs font-semibold text-slate-500">{showConfirm ? 'Hide' : 'Show'}</button>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Password strength: strong • 12+ chars • includes number and symbol
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" /> I agree to the terms and privacy policy</label>
            <button
              type="button"
              onClick={() => {
                setRole('publisher')
                setLoggedIn(true)
                navigate('/dashboard')
              }}
              className="primary-button"
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function PublisherDashboard() {
  return (
    <section className="section-shell py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Publisher dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Welcome back, Miriam</h1>
        </div>
        <button type="button" className="primary-button">
          <WalletCards className="mr-2 h-4 w-4" /> Wallet top-up
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {publisherOverview.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-2xl font-black text-slate-900">{item.value}</div>
            <div className="mt-2 text-xs text-slate-500">{item.change}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Campaign queue</h2>
            <button type="button" className="secondary-button">View all</button>
          </div>
          <div className="space-y-4">
            {campaignQueue.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.status} • {item.due}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-sky-700">{item.reward}</div>
                  <button type="button" className="mt-2 secondary-button px-3 py-2 text-xs">Open</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
          </div>
          <div className="space-y-3">
            <button type="button" className="secondary-button w-full justify-between"><span>Submit evidence</span><UploadCloud className="h-4 w-4" /></button>
            <button type="button" className="secondary-button w-full justify-between"><span>View downloadable assets</span><Download className="h-4 w-4" /></button>
            <button type="button" className="secondary-button w-full justify-between"><span>Request withdrawal</span><CircleDollarSign className="h-4 w-4" /></button>
            <button type="button" className="secondary-button w-full justify-between"><span>Campaign performance</span><BarChart3 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent submissions</h2>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Needs attention</span>
          </div>
          <div className="space-y-3">
            {recentSubmissions.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <div className="font-semibold text-slate-900">{item.campaign}</div>
                  <div className="text-xs text-slate-500">{item.id} • {item.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{item.amount}</div>
                  <div className={cn('mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold', item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Withdrawal history</h2>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700"><Gauge className="h-4 w-4" /> Fast lane</span>
          </div>
          <div className="space-y-3">
            {withdrawalHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <div className="font-semibold text-slate-900">{item.id}</div>
                  <div className="text-xs text-slate-500">{item.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{item.amount}</div>
                  <div className="text-xs text-slate-500">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminDashboard({ packageList, setPackageList }: { packageList: PackageOption[]; setPackageList: React.Dispatch<React.SetStateAction<PackageOption[]>> }) {
  const [newPackage, setNewPackage] = useState({
    name: '',
    price: '1500',
    campaigns: '5',
    rewardPer100Views: '18',
    description: '',
    badge: 'Admin created',
  })

  const handleCreatePackage = () => {
    const packageName = newPackage.name.trim()
    if (!packageName) return

    const createdPackage: PackageOption = {
      id: `${packageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: packageName,
      price: Number(newPackage.price) || 0,
      description:
        newPackage.description.trim() ||
        'Custom package configured and approved by the administrator.',
      campaigns: Number(newPackage.campaigns) || 0,
      badge: newPackage.badge.trim() || 'Admin created',
      rewardPer100Views: Number(newPackage.rewardPer100Views) || 0,
      perks: [
        `${Number(newPackage.campaigns) || 0} campaign bundles`,
        `${Number(newPackage.rewardPer100Views) || 0} KSh per 100 approved views`,
        'Manual review and approval workflow',
      ],
    }

    setPackageList((prev) => [createdPackage, ...prev])
    setNewPackage({
      name: '',
      price: '1500',
      campaigns: '5',
      rewardPer100Views: '18',
      description: '',
      badge: 'Admin created',
    })
  }

  return (
    <section className="section-shell py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Platform oversight</h1>
        </div>
        <button type="button" className="primary-button"><FileText className="mr-2 h-4 w-4" /> Create campaign</button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminSummary.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-2xl font-black text-slate-900">{item.value}</div>
            <div className="mt-2 text-xs text-slate-500">{item.change}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Package management</h2>
            <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{packageList.length} active</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Package name</label>
              <input
                className="input-field"
                value={newPackage.name}
                onChange={(event) => setNewPackage((current) => ({ ...current, name: event.target.value }))}
                placeholder="Premium Reach"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Price (KSh)</label>
              <input
                className="input-field"
                type="number"
                value={newPackage.price}
                onChange={(event) => setNewPackage((current) => ({ ...current, price: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Campaigns included</label>
              <input
                className="input-field"
                type="number"
                value={newPackage.campaigns}
                onChange={(event) => setNewPackage((current) => ({ ...current, campaigns: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Reward per 100 views</label>
              <input
                className="input-field"
                type="number"
                value={newPackage.rewardPer100Views}
                onChange={(event) => setNewPackage((current) => ({ ...current, rewardPer100Views: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Badge label</label>
              <input
                className="input-field"
                value={newPackage.badge}
                onChange={(event) => setNewPackage((current) => ({ ...current, badge: event.target.value }))}
                placeholder="Most popular"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                className="input-field min-h-24"
                value={newPackage.description}
                onChange={(event) => setNewPackage((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe package benefits and who it is for"
              />
            </div>
          </div>

          <button type="button" onClick={handleCreatePackage} className="primary-button mt-5">
            Save package and reward rule
          </button>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Reward rule</th>
                </tr>
              </thead>
              <tbody>
                {packageList.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 text-sm">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-slate-500">{item.badge}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">KSh {item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{item.rewardPer100Views ?? 0} KSh / 100 views</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Publisher management</h2>
              <div className="relative w-44">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input className="input-field pl-9" placeholder="Search publishers" />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Publisher</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {publisherTable.map((publisher) => (
                    <tr key={publisher.username} className="border-t border-slate-200 text-sm">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{publisher.name}</div>
                        <div className="text-slate-500">{publisher.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2 py-1 font-semibold', publisher.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{publisher.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{publisher.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Review queue</h2>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700"><Eye className="h-3.5 w-3.5" /> 87 pending</span>
            </div>
            <div className="space-y-3">
              {reviewQueue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{item.publisher}</div>
                    <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold', item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Escalated' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{item.status}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{item.campaign}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.score}</span>
                    <span>{item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Withdrawal approvals</h2>
            <button type="button" className="secondary-button">Export</button>
          </div>
          <div className="space-y-3">
            {withdrawalRequests.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <div className="font-semibold text-slate-900">{item.publisher}</div>
                  <div className="text-xs text-slate-500">{item.id}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{item.amount}</div>
                  <div className={cn('mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold', item.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700')}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Fraud and policy checks</h2>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Operational</div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Approval accuracy</span>
                <span className="font-semibold text-slate-900">96.4%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Manual review SLA</span>
                <span className="font-semibold text-slate-900">3.2 hrs</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Fraud alerts</span>
                <span className="font-semibold text-slate-900">07</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[52%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsTile({ label, value, accent }: { label: string; value: string; accent: 'sky' | 'amber' }) {
  return (
    <div className={cn('rounded-2xl p-4', accent === 'sky' ? 'bg-sky-500/10 text-sky-200' : 'bg-amber-500/10 text-amber-200')}>
      <div className="text-xs uppercase tracking-[0.2em] text-current/80">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

export default App
