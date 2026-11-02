import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  LockKeyhole,
  LogIn,
  Menu,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  platformSteps,
  values,
  type PackageOption,
} from './data/content'
import { cn } from './lib/utils'
import { supabase } from './lib/supabase'

type UserRole = 'publisher' | 'admin'

type PackageRecord = {
  id: string
  name: string
  price: number | string
  description: string
  campaigns_count: number
  badge: string | null
  featured: boolean
  reward_per_100_views: number | string
  perks: string[] | null
  image_path: string | null
  is_active: boolean
}

function mapPackageRecord(item: PackageRecord): PackageOption {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price),
    description: item.description,
    campaigns: item.campaigns_count,
    perks: item.perks ?? [],
    badge: item.badge ?? '',
    featured: item.featured,
    rewardPer100Views: Number(item.reward_per_100_views),
    imagePath: item.image_path,
    isActive: item.is_active,
  }
}

type Props = {
  role: UserRole | null
  loggedIn: boolean
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
}

function App() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [packageList, setPackageList] = useState<PackageOption[]>([])
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [packageLoading, setPackageLoading] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState('')
  const [packageError, setPackageError] = useState(supabase ? '' : 'Connect Supabase to load live packages and manage product images.')

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const syncSession = async (session: { user: { id: string } } | null) => {
      if (!session) {
        if (active) {
          setRole(null)
          setLoggedIn(false)
          setAuthError('')
          setAuthLoading(false)
        }
        return
      }

      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!active) return
      if (error || !data || (data.role !== 'publisher' && data.role !== 'admin')) {
        setRole(null)
        setLoggedIn(true)
        setAuthError(error?.message ?? 'Your account profile is missing a valid role. Contact support.')
      } else {
        setRole(data.role)
        setLoggedIn(true)
        setAuthError('')
      }
      setAuthLoading(false)
    }

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncSession(session)
      }, 0)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const loadPackages = async () => {
      const { data, error } = await client
        .from('packages')
        .select('id, name, price, description, campaigns_count, badge, featured, reward_per_100_views, perks, image_path, is_active')
        .order('created_at', { ascending: true })

      if (!active) return
      setPackageLoading(false)
      if (error) {
        setPackageError(`Could not load packages: ${error.message}`)
        return
      }

      setPackageError('')
      setPackageList((data ?? []).map((item) => mapPackageRecord(item as PackageRecord)))
    }

    void loadPackages()
    return () => {
      active = false
    }
  }, [role])

  return (
    <BrowserRouter>
      <AppShell
        role={role}
        loggedIn={loggedIn}
        setRole={setRole}
        setLoggedIn={setLoggedIn}
        authLoading={authLoading}
        authError={authError}
        setAuthError={setAuthError}
        packageError={packageError}
        setPackageError={setPackageError}
        packageLoading={packageLoading}
        packageList={packageList}
        setPackageList={setPackageList}
      />
    </BrowserRouter>
  )
}

function AppShell({
  role,
  loggedIn,
  setRole,
  setLoggedIn,
  authLoading,
  authError,
  setAuthError,
  packageError,
  setPackageError,
  packageLoading,
  packageList,
  setPackageList,
}: Props & {
  authLoading: boolean
  authError: string
  setAuthError: (message: string) => void
  packageError: string
  setPackageError: (message: string) => void
  packageLoading: boolean
  packageList: PackageOption[]
  setPackageList: React.Dispatch<React.SetStateAction<PackageOption[]>>
}) {
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
            {loggedIn ? (
              <>
                <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="secondary-button">
                  {role === 'admin' ? 'Admin panel' : 'Dashboard'}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (!supabase) return
                    const { error } = await supabase.auth.signOut()
                    if (error) setAuthError(error.message)
                  }}
                  className="primary-button"
                >
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

      {authError || packageError ? (
        <div className="section-shell mt-4 space-y-2">
          {authError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{authError}</p> : null}
          {packageError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{packageError}</p> : null}
        </div>
      ) : null}

      <main className="pb-16">
        <Routes>
          <Route path="/" element={<HomePage packageList={packageList} packageLoading={packageLoading} />} />
          <Route path="/packages" element={<PackagesPage packageList={packageList} packageLoading={packageLoading} />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<LegalPage title="Terms and Conditions" />} />
          <Route path="/privacy" element={<LegalPage title="Privacy Policy" />} />
          <Route
            path="/login"
            element={
              <LoginPage
                setRole={setRole}
                setLoggedIn={setLoggedIn}
                authLoading={authLoading}
                setAuthError={setAuthError}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterPage
                setRole={setRole}
                setLoggedIn={setLoggedIn}
                setAuthError={setAuthError}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="publisher" loggedIn={loggedIn} role={role} loading={authLoading}>
                <PublisherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin" loggedIn={loggedIn} role={role} loading={authLoading}>
                <AdminDashboard
                  packageList={packageList}
                  setPackageList={setPackageList}
                  setPackageError={setPackageError}
                />
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
              Product packages with administrator-managed terms and reviewed reward calculations.
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
  loading,
  children,
}: {
  requiredRole: UserRole
  loggedIn: boolean
  role: UserRole | null
  loading: boolean
  children: React.ReactNode
}) {
  if (loading) {
    return <div className="section-shell py-16 text-center text-slate-600">Checking your account…</div>
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (role !== requiredRole) {
    return <Navigate to={requiredRole === 'admin' ? '/' : '/dashboard'} replace />
  }

  return <>{children}</>
}

function HomePage({ packageList, packageLoading }: { packageList: PackageOption[]; packageLoading: boolean }) {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="section-shell py-20 md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-100">
              <ShieldCheck className="h-4 w-4" />
              Product campaigns with administrator review
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Clear product packages. Transparent reward rates.
            </h1>
            <p className="mt-6 max-w-lg text-base text-slate-300 md:text-lg">
              Browse products configured by our administrators. Campaign submissions and rewards are reviewed using recorded rate rules.
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
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Admin-managed pricing</div>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Rate snapshots per submission</div>
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Checkout coming later</div>
            </div>
          </div>
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
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Products configured by our team</h2>
          </div>
          <Link to="/packages" className="hidden items-center gap-2 text-sm font-semibold text-sky-700 md:inline-flex">
            View packages <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {packageList.filter((item) => item.isActive).slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="glass-card flex h-full flex-col overflow-hidden"
            >
              {item.imagePath ? (
                <img src={productImageUrl(item.imagePath)} alt={item.name} className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                  <ImagePlus className="h-10 w-10" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  {item.badge ? <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{item.badge}</div> : <span />}
                  {item.featured ? <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Featured</span> : null}
                </div>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{item.name}</h3>
                <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                <div className="mt-4 text-2xl font-black tracking-tight text-slate-900">KSh {item.price.toLocaleString()}</div>
                <p className="mt-auto pt-5 text-sm text-slate-500">Checkout will be available after payment integration.</p>
              </div>
            </div>
          ))}
        </div>
        {packageLoading ? <p className="mt-6 text-center text-slate-500">Loading products…</p> : null}
        {!packageLoading && packageList.filter((item) => item.isActive).length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
            No products are available yet.
          </p>
        ) : null}
      </section>
    </>
  )
}

function PackagesPage({ packageList, packageLoading }: { packageList: PackageOption[]; packageLoading: boolean }) {
  return (
    <section className="section-shell py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Packages</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Publisher packages</h1>
      </div>
      <ProductList packageList={packageList.filter((item) => item.isActive)} packageLoading={packageLoading} />
      <p className="mt-8 text-center text-sm text-slate-500">Package checkout is not enabled yet; payment integration will be added later.</p>
    </section>
  )
}

function ProductList({ packageList, packageLoading }: { packageList: PackageOption[]; packageLoading: boolean }) {
  if (packageLoading) {
    return <p className="mt-10 text-center text-slate-500">Loading packages…</p>
  }
  if (packageList.length === 0) {
    return <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No products are available yet.</p>
  }

  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {packageList.map((item) => (
        <article key={item.id} className="glass-card flex flex-col overflow-hidden">
          {item.imagePath ? (
            <img src={productImageUrl(item.imagePath)} alt={item.name} className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center bg-slate-100 text-slate-400">
              <ImagePlus className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-1 flex-col p-6">
            {item.badge ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">{item.badge}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <h2 className="mt-2 text-2xl font-black text-slate-900">{item.name}</h2>
              {item.featured ? <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Featured</span> : null}
            </div>
            <p className="mt-3 text-sm text-slate-600">{item.description}</p>
            <p className="mt-5 text-3xl font-black text-slate-900">KSh {item.price.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-600">{item.campaigns} campaigns included</p>
            <p className="mt-1 text-sm text-slate-600">{formatKsh(item.rewardPer100Views ?? 0)} per 100 approved views</p>
            {item.perks.length > 0 ? (
              <ul className="mt-5 space-y-3 text-sm text-slate-700">
                {item.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {perk}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-auto pt-6 text-sm text-slate-500">Checkout will be available after payment integration.</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function productImageUrl(path: string) {
  return supabase?.storage.from('product-images').getPublicUrl(path).data.publicUrl ?? ''
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
            Earnwave Solution is building a platform for administrators to publish product packages and reward rules, with evidence reviewed before rewards are calculated.
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
      <div className="mx-auto max-w-2xl glass-card p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Contact</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Support details will be added soon.</h1>
        <p className="mt-4 text-slate-600">We have not configured a support address or contact form yet.</p>
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
            Package prices and reward rates are displayed as configured by administrators. Checkout, deposits, and withdrawals are not available yet. Users must ensure that any submitted evidence is genuine and matches the applicable campaign instructions.
          </p>
          <p>
            Administrators reserve the right to reject submissions, suspend accounts, and reverse payments if dishonest conduct, fraudulent evidence, or platform policy violations are detected. Users agree to maintain accurate profile details, including valid Kenyan phone numbers and complete account information.
          </p>
          <p>
            The platform does not automatically retrieve WhatsApp Status views. Submitted views require administrator approval, and any reward calculation uses the rate captured for that submission.
          </p>
        </div>
      </div>
    </section>
  )
}

function LoginPage({
  setRole,
  setLoggedIn,
  authLoading,
  setAuthError,
}: {
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
  authLoading: boolean
  setAuthError: (message: string) => void
}) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setAuthError('')
    if (!supabase) {
      setFormError('Sign-in is unavailable until Supabase is configured.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setFormError(error?.message ?? 'Sign-in failed. Please try again.')
      setIsSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || !profile || (profile.role !== 'publisher' && profile.role !== 'admin')) {
      setFormError(profileError?.message ?? 'Your account does not have a valid profile. Contact support.')
      setIsSubmitting(false)
      return
    }

    setRole(profile.role)
    setLoggedIn(true)
    setIsSubmitting(false)
    navigate(profile.role === 'admin' ? '/admin' : '/dashboard')
  }

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
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Configured reward rates</div>
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Administrator review</div>
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

            <form className="space-y-4" onSubmit={(event) => void handleLogin(event)}>
              <div>
                <label className="text-sm font-semibold text-slate-700">Email address</label>
                <input className="input-field" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input className="input-field pr-11" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Enter your password" />
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

              <button type="submit" disabled={isSubmitting || authLoading} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {formError ? (
              <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}

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
  setAuthError,
}: {
  setRole: (role: UserRole) => void
  setLoggedIn: (loggedIn: boolean) => void
  setAuthError: (message: string) => void
}) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFormMessage('')
    setAuthError('')
    if (!supabase) {
      setFormError('Registration is unavailable until Supabase is configured.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get('full_name') ?? '').trim()
    const username = String(formData.get('username') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirm_password') ?? '')

    if (password !== confirmPassword) {
      setFormError('The passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username, phone } },
    })

    if (error || !data.user) {
      setFormError(error?.message ?? 'Registration failed. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (!data.session) {
      setFormMessage('Account created. Check your email to confirm your address, then sign in.')
      setIsSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || !profile || (profile.role !== 'publisher' && profile.role !== 'admin')) {
      setFormError(profileError?.message ?? 'Your account profile could not be loaded. Contact support.')
      setIsSubmitting(false)
      return
    }

    setRole(profile.role)
    setLoggedIn(true)
    setIsSubmitting(false)
    navigate(profile.role === 'admin' ? '/admin' : '/dashboard')
  }

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

        <form className="grid gap-5 md:grid-cols-2" onSubmit={(event) => void handleRegister(event)}>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Full name</label>
            <input className="input-field" name="full_name" required autoComplete="name" placeholder="Your full name" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Username</label>
            <input className="input-field" name="username" required autoComplete="username" placeholder="jane_w" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Email address</label>
            <input className="input-field" name="email" type="email" required autoComplete="email" placeholder="jane@example.com" />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-semibold text-slate-700">Phone number</label>
            <input className="input-field" name="phone" type="tel" required autoComplete="tel" placeholder="+254712345678" />
          </div>
          <div className="md:col-span-1 relative">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input className="input-field pr-11" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} required placeholder="Create password (12+ characters)" />
            <button type="button" onClick={() => setShowPassword((open) => !open)} className="absolute right-3 top-[2.5rem] text-xs font-semibold text-slate-500">{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div className="md:col-span-1 relative">
            <label className="text-sm font-semibold text-slate-700">Confirm password</label>
            <input className="input-field pr-11" name="confirm_password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" minLength={12} required placeholder="Repeat password" />
            <button type="button" onClick={() => setShowConfirm((open) => !open)} className="absolute right-3 top-[2.5rem] text-xs font-semibold text-slate-500">{showConfirm ? 'Hide' : 'Show'}</button>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
            Choose a password with at least 12 characters.
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" required /> I agree to the terms and privacy policy</label>
            <button type="submit" disabled={isSubmitting} className="primary-button disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Creating account…' : 'Create publisher account'}
            </button>
          </div>

          {formError || formMessage ? (
            <p role={formError ? 'alert' : 'status'} className={`md:col-span-2 rounded-xl border p-3 text-sm ${formError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {formError || formMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}

function PublisherDashboard() {
  const [publisherName, setPublisherName] = useState('')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<PublisherSubmission[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [loadError, setLoadError] = useState(supabase ? '' : 'Connect Supabase to load your account data.')

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      if (!supabase) {
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        if (active) {
          setLoadError(userError?.message ?? 'Could not load your signed-in account.')
          setIsLoading(false)
        }
        return
      }

      const userId = userData.user.id
      const [profileResult, walletResult, submissionResult] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
        supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
        supabase
          .from('submissions')
          .select('id, status, views_count, payout_amount, reward_rate_snapshot, created_at, campaigns(title)')
          .eq('publisher_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (!active) return
      const error = profileResult.error ?? walletResult.error ?? submissionResult.error
      if (error) {
        setLoadError(error.message)
      } else {
        setPublisherName(profileResult.data?.full_name ?? '')
        setWalletBalance(Number(walletResult.data?.balance ?? 0))
        setSubmissions((submissionResult.data ?? []) as PublisherSubmission[])
      }
      setIsLoading(false)
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const approvedSubmissions = submissions.filter((submission) => submission.status === 'approved')
  const pendingCount = submissions.filter((submission) => submission.status === 'pending').length

  return (
    <section className="section-shell py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Publisher dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            {publisherName ? `Welcome, ${publisherName}` : 'Your account'}
          </h1>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Payments coming later</span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Wallet balance" value={walletBalance === null ? '—' : formatKsh(walletBalance)} />
        <DashboardStat label="Submissions" value={isLoading ? '—' : String(submissions.length)} />
        <DashboardStat label="Awaiting review" value={isLoading ? '—' : String(pendingCount)} />
        <DashboardStat
          label="Approved rewards"
          value={isLoading ? '—' : formatKsh(approvedSubmissions.reduce((total, item) => total + Number(item.payout_amount), 0))}
        />
      </div>

      {loadError ? <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</p> : null}
      <div className="mt-8 glass-card p-6">
        <h2 className="text-xl font-bold text-slate-900">Your submissions</h2>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading your submissions…</p> : null}
        {!isLoading && !loadError && submissions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">You do not have any submissions yet.</p>
        ) : null}
        <div className="mt-4 divide-y divide-slate-200">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-slate-900">{submission.campaigns?.[0]?.title ?? 'Campaign submission'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(submission.created_at).toLocaleDateString()} · {submission.views_count.toLocaleString()} approved views
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatKsh(Number(submission.payout_amount))}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">{submission.status.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

type PublisherSubmission = {
  id: string
  status: string
  views_count: number
  payout_amount: number | string
  reward_rate_snapshot: number | string | null
  created_at: string
  campaigns: { title: string }[] | null
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-900">{value}</div>
    </div>
  )
}

function formatKsh(value: number) {
  return `KSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function AdminDashboard({
  packageList,
  setPackageList,
  setPackageError,
}: {
  packageList: PackageOption[]
  setPackageList: React.Dispatch<React.SetStateAction<PackageOption[]>>
  setPackageError: (message: string) => void
}) {
  const emptyPackage = {
    name: '',
    price: '',
    campaigns: '',
    rewardPer100Views: '',
    description: '',
    badge: '',
    featured: false,
  }
  const [newPackage, setNewPackage] = useState({
    ...emptyPackage,
  })
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const handleSavePackage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setPackageError('')
    const packageName = newPackage.name.trim()
    const price = Number(newPackage.price)
    const campaigns = Number(newPackage.campaigns)
    const rewardPer100Views = Number(newPackage.rewardPer100Views)
    if (!packageName || !newPackage.description.trim() || (!imagePath && !selectedImage) || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(campaigns) || campaigns < 1 ||
      !Number.isFinite(rewardPer100Views) || rewardPer100Views < 0) {
      setFormError('Add a name, description, product image, valid price, at least one campaign, and a non-negative reward rate.')
      return
    }

    if (!supabase) {
      setFormError('Package changes require a configured Supabase connection.')
      return
    }

    setIsSaving(true)
    let uploadedImagePath: string | null = null
    const previousImagePath = imagePath

    if (selectedImage) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setFormError(userError?.message ?? 'Could not verify the administrator account.')
        setIsSaving(false)
        return
      }

      const extension = selectedImage.type === 'image/jpeg' ? 'jpg' : selectedImage.type.split('/')[1]
      uploadedImagePath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(uploadedImagePath, selectedImage, { contentType: selectedImage.type, upsert: false })
      if (uploadError) {
        setFormError(`Could not upload the product image: ${uploadError.message}`)
        setIsSaving(false)
        return
      }
    }

    const packageData = {
      name: packageName,
      price,
      description: newPackage.description.trim(),
      campaigns_count: campaigns,
      badge: newPackage.badge.trim() || 'Admin created',
      featured: newPackage.featured,
      reward_per_100_views: rewardPer100Views,
      image_path: uploadedImagePath ?? imagePath,
      perks: [
        `${campaigns} campaign bundles`,
        `${rewardPer100Views} KSh per 100 approved views`,
        'Manual review and approval workflow',
      ],
    }

    const selectedColumns = 'id, name, price, description, campaigns_count, badge, featured, reward_per_100_views, perks, image_path, is_active'
    const result = editingPackageId
      ? await supabase.from('packages').update(packageData).eq('id', editingPackageId).select(selectedColumns).single()
      : await supabase.from('packages').insert({ ...packageData, is_active: true }).select(selectedColumns).single()

    if (result.error || !result.data) {
      let cleanupMessage = ''
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage.from('product-images').remove([uploadedImagePath])
        if (cleanupError) cleanupMessage = ` The uploaded image also needs cleanup: ${cleanupError.message}`
      }
      setFormError(`${result.error?.message ?? 'Could not save this package.'}${cleanupMessage}`)
      setIsSaving(false)
      return
    }

    const savedPackage = mapPackageRecord(result.data as PackageRecord)
    setPackageList((current) => editingPackageId
      ? current.map((item) => item.id === savedPackage.id ? savedPackage : item)
      : [savedPackage, ...current])
    if (uploadedImagePath && previousImagePath) {
      const { error: removeError } = await supabase.storage.from('product-images').remove([previousImagePath])
      if (removeError) setPackageError(`Package saved, but the previous image could not be removed: ${removeError.message}`)
    }
    setEditingPackageId(null)
    setNewPackage({ ...emptyPackage })
    setImagePath(null)
    setSelectedImage(null)
    setImagePreview(null)
    setIsSaving(false)
  }

  const editPackage = (item: PackageOption) => {
    setFormError('')
    setEditingPackageId(item.id)
    setNewPackage({
      name: item.name,
      price: String(item.price),
      campaigns: String(item.campaigns),
      rewardPer100Views: String(item.rewardPer100Views ?? 0),
      description: item.description,
      badge: item.badge,
      featured: Boolean(item.featured),
    })
    setImagePath(item.imagePath)
    setSelectedImage(null)
    setImagePreview(null)
  }

  const togglePackageActive = async (item: PackageOption) => {
    setPackageError('')
    if (!supabase) {
      setPackageError('Package changes require a configured Supabase connection.')
      return
    }

    const isActive = item.isActive === false
    const { data, error } = await supabase
      .from('packages')
      .update({ is_active: isActive })
      .eq('id', item.id)
      .select('id')
      .maybeSingle()
    if (error || !data) {
      setPackageError(`Could not ${isActive ? 'activate' : 'deactivate'} ${item.name}: ${error?.message ?? 'No package row was updated.'}`)
      return
    }
    setPackageList((current) => current.map((entry) => entry.id === item.id ? { ...entry, isActive } : entry))
  }

  return (
    <section className="section-shell py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Admin dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Products and submission reviews</h1>
        </div>
      </div>

      <div className="mt-8">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Package management</h2>
            <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
              {packageList.filter((item) => item.isActive !== false).length} active
            </span>
          </div>

          <form onSubmit={(event) => void handleSavePackage(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Package name</label>
              <input
                className="input-field"
                required
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
                min="0.01"
                step="0.01"
                required
                value={newPackage.price}
                onChange={(event) => setNewPackage((current) => ({ ...current, price: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Campaigns included</label>
              <input
                className="input-field"
                type="number"
                min="1"
                step="1"
                required
                value={newPackage.campaigns}
                onChange={(event) => setNewPackage((current) => ({ ...current, campaigns: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Reward per 100 views</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                required
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
                required
                value={newPackage.description}
                onChange={(event) => setNewPackage((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe package benefits and who it is for"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Product image</label>
              <input
                className="input-field"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={!imagePath}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    setFormError('Choose a JPEG, PNG, or WebP image.')
                    event.target.value = ''
                    return
                  }
                  if (file && file.size > 5 * 1024 * 1024) {
                    setFormError('Product images must be 5 MB or smaller.')
                    event.target.value = ''
                    return
                  }
                  setFormError('')
                  setSelectedImage(file)
                  setImagePreview(file ? URL.createObjectURL(file) : null)
                }}
              />
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP. Maximum file size: 5 MB.</p>
              {imagePreview || imagePath ? (
                <img
                  src={imagePreview ?? productImageUrl(imagePath ?? '')}
                  alt="Selected product preview"
                  className="mt-3 h-40 w-full rounded-xl object-cover md:max-w-sm"
                />
              ) : null}
            </div>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={newPackage.featured}
              onChange={(event) => setNewPackage((current) => ({ ...current, featured: event.target.checked }))}
            />
            Feature this package publicly
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={isSaving} className="primary-button disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? 'Saving…' : editingPackageId ? 'Save package changes' : 'Create package'}
            </button>
            {editingPackageId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPackageId(null)
                  setNewPackage({ ...emptyPackage })
                  setImagePath(null)
                  setSelectedImage(null)
                  setImagePreview(null)
                  setFormError('')
                }}
                className="secondary-button"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          {formError ? <p role="alert" className="mt-3 text-sm text-rose-700">{formError}</p> : null}
          </form>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Reward rule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packageList.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 text-sm">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-slate-500">{item.badge}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.imagePath ? (
                        <img src={productImageUrl(item.imagePath)} alt="" className="h-12 w-16 rounded-lg object-cover" />
                      ) : <span className="text-slate-400">No image</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">KSh {item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{item.rewardPer100Views ?? 0} KSh / 100 views</td>
                    <td className="px-4 py-3 text-slate-700">{item.isActive === false ? 'Inactive' : 'Active'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => editPackage(item)} className="secondary-button px-3 py-2 text-xs">
                          Edit
                        </button>
                        <button type="button" onClick={() => void togglePackageActive(item)} className="secondary-button px-3 py-2 text-xs">
                          {item.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packageList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No packages yet. Create the first one above.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <SubmissionReviewQueue />
      <PricingAuditLog />
    </section>
  )
}

type ReviewSubmission = {
  id: string
  publisher_id: string
  image_url: string | null
  notes: string | null
  status: string
  created_at: string
  reward_rate_snapshot: number | string | null
  publisher: { full_name: string; username: string }[] | null
  campaigns: { title: string }[] | null
}

function SubmissionReviewQueue() {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([])
  const [viewsBySubmission, setViewsBySubmission] = useState<Record<string, string>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState(supabase ? '' : 'Connect Supabase to review submissions.')
  const [successMessage, setSuccessMessage] = useState('')

  const loadSubmissions = async () => {
    if (!supabase) {
      return
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('id, publisher_id, image_url, notes, status, created_at, reward_rate_snapshot, publisher:profiles!submissions_publisher_id_fkey(full_name, username), campaigns(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setErrorMessage('')
      setSubmissions((data ?? []) as ReviewSubmission[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadSubmissions(), 0)
    return () => window.clearTimeout(timerId)
  }, [])

  const submitReview = async (submission: ReviewSubmission, decision: 'approved' | 'rejected') => {
    setErrorMessage('')
    setSuccessMessage('')
    if (!supabase) {
      setErrorMessage('Connect Supabase to review submissions.')
      return
    }

    const rawViews = viewsBySubmission[submission.id] ?? ''
    const views = Number(rawViews)
    if (decision === 'approved' && (!rawViews.trim() || !Number.isInteger(views) || views < 0)) {
      setErrorMessage('Enter a non-negative whole number of approved views.')
      return
    }

    setBusySubmissionId(submission.id)
    const { data, error } = await supabase.rpc('review_submission', {
      p_submission_id: submission.id,
      p_decision: decision,
      p_views_count: decision === 'approved' ? views : 0,
      p_review_notes: reviewNotes[submission.id]?.trim() || null,
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage(decision === 'approved'
        ? `Submission approved. Server-calculated reward: ${formatKsh(Number(data ?? 0))}.`
        : 'Submission rejected.')
      await loadSubmissions()
    }
    setBusySubmissionId(null)
  }

  return (
    <section className="mt-8 glass-card p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Submission review</h2>
        <p className="mt-1 text-sm text-slate-500">The server calculates approved rewards using the rate captured when evidence was submitted.</p>
      </div>
      {errorMessage ? <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading pending submissions…</p> : null}
      {!isLoading && !errorMessage && submissions.length === 0 ? (
        <p className="text-sm text-slate-500">There are no pending submissions.</p>
      ) : null}
      <div className="space-y-4">
        {submissions.map((submission) => (
          <article key={submission.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{submission.campaigns?.[0]?.title ?? 'Campaign submission'}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {submission.publisher?.[0]?.full_name ?? submission.publisher?.[0]?.username ?? 'Publisher'} · {new Date(submission.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {submission.reward_rate_snapshot === null
                    ? 'Reward rate snapshot unavailable'
                    : `Captured rate: ${formatKsh(Number(submission.reward_rate_snapshot))} per 100 views`}
                </p>
                {submission.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{submission.notes}</p> : null}
              </div>
              {submission.image_url ? (
                <a href={submission.image_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-700">
                  View submitted evidence
                </a>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto_auto] md:items-end">
              <label className="text-sm font-semibold text-slate-700">
                Approved views
                <input
                  className="input-field mt-1"
                  type="number"
                  min="0"
                  step="1"
                  value={viewsBySubmission[submission.id] ?? ''}
                  onChange={(event) => setViewsBySubmission((current) => ({ ...current, [submission.id]: event.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Review notes
                <input
                  className="input-field mt-1"
                  value={reviewNotes[submission.id] ?? ''}
                  onChange={(event) => setReviewNotes((current) => ({ ...current, [submission.id]: event.target.value }))}
                  placeholder="Optional"
                />
              </label>
              <button
                type="button"
                disabled={busySubmissionId === submission.id}
                onClick={() => void submitReview(submission, 'approved')}
                className="primary-button disabled:opacity-60"
              >
                Approve and calculate
              </button>
              <button
                type="button"
                disabled={busySubmissionId === submission.id}
                onClick={() => void submitReview(submission, 'rejected')}
                className="secondary-button disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

type PackageRateAuditRecord = {
  id: string
  package_name: string
  action: 'created' | 'rate_changed'
  old_price: number | string | null
  new_price: number | string
  old_reward_rate: number | string | null
  new_reward_rate: number | string
  created_at: string
  profiles: { full_name: string; username: string }[] | null
}

function PricingAuditLog() {
  const [records, setRecords] = useState<PackageRateAuditRecord[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [errorMessage, setErrorMessage] = useState(supabase ? '' : 'Connect Supabase to view pricing history.')

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (!supabase) return
      void supabase
        .from('package_rate_audit')
        .select('id, package_name, action, old_price, new_price, old_reward_rate, new_reward_rate, created_at, profiles!package_rate_audit_actor_id_fkey(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(25)
        .then(({ data, error }) => {
          if (error) {
            setErrorMessage(error.message)
          } else {
            setErrorMessage('')
            setRecords((data ?? []) as PackageRateAuditRecord[])
          }
          setIsLoading(false)
        })
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [])

  return (
    <section className="mt-8 glass-card p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Package pricing history</h2>
        <p className="mt-1 text-sm text-slate-500">The database keeps this record append-only. Showing the most recent 25 entries.</p>
      </div>
      {errorMessage ? <p role="alert" className="mb-4 text-sm text-rose-700">{errorMessage}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading pricing history…</p> : null}
      {!isLoading && !errorMessage && records.length === 0 ? <p className="text-sm text-slate-500">No package pricing changes have been recorded.</p> : null}
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">Change</th>
                <th className="px-3 py-3">Price (KSh)</th>
                <th className="px-3 py-3">Reward / 100 views</th>
                <th className="px-3 py-3">Changed by</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-semibold text-slate-900">{record.package_name}</td>
                  <td className="px-3 py-3 capitalize text-slate-600">{record.action.replace('_', ' ')}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {record.old_price === null ? '—' : Number(record.old_price).toLocaleString()} → {Number(record.new_price).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {record.old_reward_rate === null ? '—' : Number(record.old_reward_rate).toLocaleString()} → {Number(record.new_reward_rate).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{record.profiles?.[0]?.full_name ?? record.profiles?.[0]?.username ?? 'Database operation'}</td>
                  <td className="px-3 py-3 text-slate-600">{new Date(record.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default App
