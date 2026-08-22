import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart2, 
  AlertTriangle 
} from 'lucide-react'

function CampaignReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
    const interval = setInterval(fetchReport, 5000)
    return () => clearInterval(interval)
  }, [id])

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/stats/campaign/${id}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-gray-400">Loading campaign report...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-20 bg-white dark:bg-[#0f172a]/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Campaign Not Found</h3>
        <Link
          to="/campaigns"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold no-underline"
        >
          Return to Campaigns
        </Link>
      </div>
    )
  }

  const { campaign, summary, logs } = report

  const summaryCards = [
    { icon: Mail, value: summary.total, label: 'Total Recipients', color: 'text-blue-400' },
    { icon: CheckCircle2, value: summary.sent, label: 'Delivered', color: 'text-emerald-400' },
    { icon: XCircle, value: summary.failed, label: 'Failed', color: 'text-red-400' },
    { icon: Clock, value: summary.queued, label: 'Queued', color: 'text-amber-400' },
  ]

  const progress = summary.total > 0 ? ((summary.sent + summary.failed) / summary.total) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 no-underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{campaign.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Subject: <span className="text-gray-700 dark:text-gray-300 font-medium">{campaign.subject}</span>
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Metric</span>
              </div>
              <div className={`text-3xl font-extrabold tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {card.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Bar Card */}
      {summary.total > 0 && (
        <div className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-900 dark:text-white">Overall Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Transmission Log Table */}
      <div className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Transmission Log</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Detailed recipient delivery status</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recipient Email</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details / Error</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{log.contact_email}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{log.contact_name || '—'}</td>
                  <td className="px-5 py-3.5">
                    {log.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Delivered
                      </span>
                    ) : log.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        Queued
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-red-400 max-w-[240px] truncate font-mono">
                    {log.error || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                    {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CampaignReport
