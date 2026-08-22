import { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  X, 
  Mail, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react'

function Contacts({ addToast }) {
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchContacts()
  }, [page, search])

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?page=${page}&limit=20&search=${search}`)
      const data = await res.json()
      setContacts(data.contacts)
      setTotal(data.total)
    } catch (err) {
      addToast('Failed to load contacts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!newEmail) return
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName }),
      })
      const data = await res.json()
      if (res.ok) {
        addToast(`Contact ${newEmail} added!`, 'success')
        setNewEmail('')
        setNewName('')
        setShowModal(false)
        fetchContacts()
      } else {
        addToast(data.error || 'Failed to add contact', 'error')
      }
    } catch (err) {
      addToast('Failed to add contact', 'error')
    }
  }

  const deleteContact = async (id, email) => {
    if (!confirm(`Delete ${email}?`)) return
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      addToast(`Deleted ${email}`, 'success')
      fetchContacts()
    } catch (err) {
      addToast('Failed to delete contact', 'error')
    }
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        addToast(`Imported ${data.inserted} contacts! (${data.duplicatesSkipped} duplicates skipped)`, 'success')
        fetchContacts()
      } else {
        addToast(data.error || 'Import failed', 'error')
      }
    } catch (err) {
      addToast('Failed to import CSV', 'error')
    }
    e.target.value = ''
  }

  const deleteAll = async () => {
    if (!confirm('Delete ALL contacts? This action cannot be undone.')) return
    try {
      await fetch('/api/contacts', { method: 'DELETE' })
      addToast('All contacts deleted', 'success')
      fetchContacts()
    } catch (err) {
      addToast('Failed to delete contacts', 'error')
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email ? email[0].toUpperCase() : '?'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Contact Audience</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage subscriber lists and import contacts via CSV</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import CSV</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />

          {total > 0 && (
            <button
              onClick={deleteAll}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Total Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0f172a]/70 p-4 border border-gray-200 dark:border-gray-800/80 rounded-2xl backdrop-blur-xl shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold self-end sm:self-center">
          Total Subscribers: <span className="text-gray-900 dark:text-white font-bold">{total}</span>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-gray-400">Loading contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0f172a]/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No contacts found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Start building your subscriber list by adding contacts manually or importing a CSV file.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            Add First Contact
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0f172a]/70 backdrop-blur-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscriber</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Added</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-600/30 dark:to-indigo-600/30 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                          {getInitials(c.name, c.email)}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 font-medium">{c.name || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-medium">
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteContact(c.id, c.email)}
                        className="p-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs transition-all"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 font-medium">
              Page {page} of {Math.ceil(total / 20) || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Contact Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Subscriber</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  type="email"
                  placeholder="subscriber@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contacts
