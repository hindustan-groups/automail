import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Rocket, 
  Send, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/dashboard')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-400 font-medium">Loading analytics...</p>
      </div>
    )
  }

  const statCards = [
    { 
      icon: Users, 
      value: stats?.totalContacts || 0, 
      label: 'Total Audience',
      accent: 'from-blue-500/20 to-cyan-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'group-hover:border-blue-500/40'
    },
    { 
      icon: Rocket, 
      value: stats?.totalCampaigns || 0, 
      label: 'Campaigns Created',
      accent: 'from-purple-500/20 to-pink-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'group-hover:border-purple-500/40'
    },
    { 
      icon: Send, 
      value: stats?.totalSent || 0, 
      label: 'Emails Delivered',
      accent: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
      borderColor: 'group-hover:border-emerald-500/40'
    },
    { 
      icon: TrendingUp, 
      value: `${stats?.successRate || 0}%`, 
      label: 'Delivery Success Rate',
      accent: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
      borderColor: 'group-hover:border-amber-500/40'
    },
  ]

  const usagePercent = Math.min(((stats?.sentToday || 0) / (stats?.dailyLimit || 200)) * 100, 100)

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0f172a]/80 dark:bg-gradient-to-r dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 p-6 border border-gray-200 dark:border-blue-500/20 rounded-2xl backdrop-blur-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">Welcome back to Automail</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor campaign output and Hostinger SMTP delivery health</p>
        </div>
        <Link
          to="/compose"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all no-underline"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div 
              key={i} 
              className={`group relative bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl overflow-hidden shadow-sm ${card.borderColor}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accent} rounded-bl-full pointer-events-none opacity-60`}></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 ${card.iconColor}`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live</span>
              </div>

              <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Usage Meter Card */}
      <div className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Daily Quota Tracker</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hostinger email limit monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{stats?.sentToday || 0}</span>
            <span className="text-xs text-gray-500"> / {stats?.dailyLimit || 200} sent</span>
          </div>
        </div>

        <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800/80">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/30"
            style={{ width: `${usagePercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>Resets daily at 00:00 UTC</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{Math.round(usagePercent)}% Used</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Send Activity</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">7-day transmission breakdown</p>
            </div>
          </div>

          <Link to="/campaigns" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1 no-underline">
            <span>View Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentStats?.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivered</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Failed</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {stats.recentStats.map((day) => (
                  <tr key={day.date} className="hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-gray-200">{day.date}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{day.total_sent}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-red-500 dark:text-red-400">
                      {day.total_failed > 0 ? (
                        <span className="flex items-center gap-2 text-red-500 dark:text-red-400">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>{day.total_failed}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium">No sending activity logged yet.</p>
            <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Create and launch your first email campaign to see real-time metrics!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
