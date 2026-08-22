import { Routes, Route, NavLink, useLocation, Link } from 'react-router-dom'
import { useState,useEffect} from 'react'

import { 
  LayoutDashboard, 
  PenSquare, 
  Users, 
  Rocket, 
  Mail, 
  Plus, 
  Search, 
  Sun,
  Moon,
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Compose from './pages/Compose'
import Campaigns from './pages/Campaigns'
import CampaignReport from './pages/CampaignReport'
import Toast from './components/Toast'

function App() {
  const [toasts, setToasts] = useState([])
  const location = useLocation()
  const [isDarkMode,setIsDarkMode] = useState(false)
  useEffect(()=>{
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }else{
      document.documentElement.classList.remove('dark')
    }
  },[isDarkMode])
  const toggletheme = () => setIsDarkMode(!isDarkMode)
  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/compose', icon: PenSquare, label: 'Compose' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns', icon: Rocket, label: 'Campaigns' },
  ]

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard Overview'
    if (location.pathname === '/compose') return 'Compose Email'
    if (location.pathname === '/contacts') return 'Contact Audience'
    if (location.pathname === '/campaigns') return 'Campaign Management'
    if (location.pathname.includes('/report')) return 'Campaign Analytics'
    return 'Automail'
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-gray-900 dark:text-gray-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800/60 p-5 flex flex-col fixed top-0 left-0 h-screen z-50 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-gray-200 dark:border-gray-800/60 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Mail className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-300 dark:via-indigo-200 dark:to-purple-300 bg-clip-text text-transparent tracking-tight">
              Automail
            </h1>
            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-300 tracking-wider bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/30">
              Hostinger SMTP
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/15 text-blue-600 dark:text-blue-600 border border-blue-200 dark:border-blue-500/30 shadow-sm dark:shadow-md dark:shadow-blue-500/5'
                      : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-white'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-400"></span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* System Status Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800/60 pt-4 mt-auto">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate">info@hindustanprojects.in</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">SMTP Ready (Port 465)</p>
            </div>
          </div>
          <button 
            onClick={toggletheme}
            className='p-2 mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-yellow-400 transition-colors'
          >
            {isDarkMode ? <Sun className='w-4 h-4 '/>:<Moon className='w-4 h-4' />}
            <span className="text-xs font-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hostinger SMTP Verified</span>
            </div>

            <Link
              to="/compose"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 no-underline"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Campaign</span>
            </Link>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard addToast={addToast} />} />
            <Route path="/compose" element={<Compose addToast={addToast} />} />
            <Route path="/contacts" element={<Contacts addToast={addToast} />} />
            <Route path="/campaigns" element={<Campaigns addToast={addToast} />} />
            <Route path="/campaigns/:id/report" element={<CampaignReport addToast={addToast} />} />
          </Routes>
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[2000] flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}

export default App
