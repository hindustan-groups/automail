import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PenSquare, 
  Eye, 
  Save, 
  Code, 
  Tag, 
  ArrowLeft,
  Loader2
} from 'lucide-react'

function Compose({ addToast }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const navigate = useNavigate()

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name || !subject) {
      addToast('Campaign name and subject are required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          sender_name: senderName,
          sender_email: senderEmail,
          html_body: htmlBody,
          text_body: htmlBody.replace(/<[^>]*>/g, ''),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        addToast(`Campaign "${name}" created successfully!`, 'success')
        navigate('/campaigns')
      } else {
        addToast(data.error || 'Failed to create campaign', 'error')
      }
    } catch (err) {
      addToast('Failed to create campaign', 'error')
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (variable) => {
    setHtmlBody((prev) => prev + ` ${variable} `)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Compose Email Campaign</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Design your HTML email and personalize with dynamic variables</p>
        </div>
        <button
          onClick={() => navigate('/campaigns')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#0f172a]/70 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-lg dark:shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              placeholder="e.g. September Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Email Subject Line *
            </label>
            <input
              type="text"
              placeholder="e.g. Exclusive updates inside for {{name}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Custom Sender Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sales Team"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Custom Sender Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. sales@hindustanprojects.in"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Dynamic Variable Helper Toolbar */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <Tag className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Insert Personalization Tags:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => insertVariable('{{name}}')}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-mono font-semibold transition-all"
            >
              + {'{{name}}'}
            </button>
            <button
              type="button"
              onClick={() => insertVariable('{{email}}')}
              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-mono font-semibold transition-all"
            >
              + {'{{email}}'}
            </button>
          </div>
        </div>

        {/* Body Editor Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Email Content (HTML)</span>
            </label>

            {/* Toggle Preview Button */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !showPreview ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>Code Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showPreview ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>

          {/* Editor vs Preview Display */}
          {showPreview ? (
            <div className="bg-white text-gray-900 rounded-xl p-8 min-h-[300px] border border-gray-300 shadow-inner overflow-y-auto max-h-[500px]">
              <div className="pb-4 mb-4 border-b border-gray-200 text-xs text-gray-500 font-sans">
                <p><strong>From:</strong> {senderName || 'Hindustan Projects'} &lt;{senderEmail || 'info@hindustanprojects.in'}&gt;</p>
                <p><strong>Subject:</strong> {subject || '(No subject provided)'}</p>
              </div>
              <div 
                className="prose max-w-none text-sm font-sans"
                dangerouslySetInnerHTML={{ 
                  __html: htmlBody || '<p style="color: #999; text-align: center; padding: 40px;">No HTML content written yet...</p>' 
                }} 
              />
            </div>
          ) : (
            <textarea
              placeholder={`<h2 style="color: #3b82f6;">Hello {{name}}!</h2>\n<p>We are thrilled to share our latest updates with you.</p>\n<a href="https://yourwebsite.com" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Visit Website</a>`}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={12}
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y min-h-[260px] leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-700"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-800/80">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Campaign...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Campaign</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Compose
