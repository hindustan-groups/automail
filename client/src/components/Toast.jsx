import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

function Toast({ message, type }) {
  const styles = {
    success: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10',
    error: 'bg-red-950/80 border-red-500/40 text-red-300 shadow-red-500/10',
    info: 'bg-blue-950/80 border-blue-500/40 text-blue-300 shadow-blue-500/10',
  }

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold min-w-[280px] shadow-2xl backdrop-blur-xl animate-[slide-in-right_0.3s_ease] ${styles[type] || styles.info}`}
    >
      {icons[type] || icons.info}
      <span className="leading-snug">{message}</span>
    </div>
  )
}

export default Toast
