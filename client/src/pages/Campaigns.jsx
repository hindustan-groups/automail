import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket,
  Plus,
  Play,
  Square,
  BarChart2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react'

function Campaigns({ addToast }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [contactsList, setContactsList] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [campaignToLaunch, setCampaignToLaunch] = useState(null)


  useEffect(() => {
    fetchCampaigns()
    const interval = setInterval(fetchCampaigns, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      setCampaigns(data)
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    } finally {
      setLoading(false)
    }
  }
  const handleLaunchClick = async (c) => {
    setCampaignToLaunch(c)
    setShowModal(true)
    try {
      // Fetch up to 10,000 contacts for the checklist
      const res = await fetch('/api/contacts?limit=10000')
      const data = await res.json()
      setContactsList(data.contacts)
      // Select all by default
      setSelectedIds(data.contacts.map(contact => contact.id))
    } catch (err) {
      addToast('Failed to load contacts', 'error')
    }
  }

  // replace the sendcommapign

  const confirmAndSend = async () => {
    if (!campaignToLaunch) return
    setSendingId(campaignToLaunch.id)
    setShowModal(false)
    try {
      const res = await fetch(`/api/send/${campaignToLaunch.id}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedIds })
      })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message || "Campaign started!")
        fetchCampaigns()
      } else {
        addToast(data.error || "Failed to start campaign", "error")
      }


    } catch (error) {
      addToast(error.message || 'failed to start campaign', "error")
    } finally {
      setSendingId(null)
      setCampaignToLaunch(null)
    }
  }

  const sendCampaign = async (id, name) => {
    if (!confirm(`Launch campaign "${name}" via Hostinger SMTP to ALL contacts?`)) return
    setSendingId(id)
    try {
      const res = await fetch(`/api/send/${id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')
        fetchCampaigns()
      } else {
        addToast(data.error || 'Failed to start campaign', 'error')
      }
    } catch (err) {
      addToast('Failed to send campaign', 'error')
    } finally {
      setSendingId(null)
    }
  }

  const stopCampaign = async () => {
    try {
      const res = await fetch('/api/send/stop/current', { method: 'POST' })
      const data = await res.json()
      addToast(data.message, 'info')
      fetchCampaigns()
    } catch (err) {
      addToast('Failed to stop sending', 'error')
    }
  }

  const deleteCampaign = async (id, name) => {
    if (!confirm(`Delete campaign "${name}"?`)) return
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      addToast(`Campaign "${name}" deleted`, 'success')
      fetchCampaigns()
    } catch (err) {
      addToast('Failed to delete campaign', 'error')
    }
  }

  const getProgress = (c) => {
    if (!c.total_recipients) return 0
    return Math.round(((c.sent_count + c.failed_count) / c.total_recipients) * 100)
  }

  const statusBadge = (status) => {
    switch (status) {
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            Sending
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Paused
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">
            Draft
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-gray-400">Loading campaigns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Email Campaigns</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage, launch, and monitor transmission progress</p>
        </div>
        <Link
          to="/compose"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all no-underline"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </Link>
      </div>

      {/* Campaign Cards List */}
      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/40 rounded-2xl border border-gray-200 dark:border-dashed dark:border-gray-800/80">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No campaigns created yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            Compose your first email campaign to start reaching out to your audience.
          </p>
          <Link
            to="/compose"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all no-underline"
          >
            Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#0f172a]/70 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl transition-all hover:border-indigo-500/40 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight mb-0.5">{c.name}</h3>
                  <p className="text-xs text-gray-900 dark:text-gray-300 truncate max-w-lg">
                    Subject: <span className="text-gray-900 dark:text-gray-200 font-medium">{c.subject}</span>
                  </p>
                </div>
                <div>{statusBadge(c.status)}</div>
              </div>

              {/* Progress Indicator */}
              {(c.status === 'sending' || c.status === 'completed' || c.status === 'paused') && c.total_recipients > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {c.sent_count} Delivered
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {c.failed_count} Failed
                    </span>
                    <span className="text-gray-400 font-mono">Total: {c.total_recipients}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${getProgress(c)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  {(c.status === 'draft' || c.status === 'paused') && (
                    <button
                      onClick={() => handleLaunchClick(c)}
                      disabled={sendingId === c.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                    >
                      {sendingId === c.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Launch Campaign</span>
                        </>
                      )}
                    </button>
                  )}

                  {c.status === 'sending' && (
                    <button
                      onClick={stopCampaign}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Transmission</span>
                    </button>
                  )}

                  <Link
                    to={`/campaigns/${c.id}/report`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold no-underline transition-all"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Analytics Report</span>
                  </Link>

                  {c.status !== 'sending' && (
                    <button
                      onClick={() => deleteCampaign(c.id, c.name)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs transition-all"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 font-mono">
                  Created: {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {
        showModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-lg'>
            <div className='bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-xl'>
              <div className='p-4 border-b border-gray-200 dark:border-gray-800 '>
                <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                  select contacts
                </h3>
                <p className='text-xs text-gray-500 dark:text-gray-400'>{campaignToLaunch.name}</p>
              </div>
              <div className='p-4 flex-1 overflow-y-auto space-y-2'>
                <div className='flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2'>
                  <input type='checkbox'
                    checked={selectedIds.length === contactsList.length && contactsList.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(contactsList.map((c) => c.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className='w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 dark:text-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800' />
                  <span className='text-sm font-bold text-gray-900 dark:text-white'>Select All({contactsList.length})</span>
                </div>
                {
                  contactsList.map(contact => (
                    <label key={contact.id} className='flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors'>
                      <input type='checkbox'
                        checked={selectedIds.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, contact.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== contact.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 dark:text-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      />
                      <div className='flex flex-col'>
                        <span className='text-sm text-gray-900 dark:text-gray-200'>
                          {contact.name || 'no name'}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {contact.email}
                        </span>
                      </div>
                    </label>
                  ))
                }
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                <button onClick={() => setShowModal(false)} className='px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'>
                  Cancel
                </button>
                <button
                  onClick={confirmAndSend}
                  disabled={selectedIds.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >Launch to {selectedIds.length} contacts</button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default Campaigns
