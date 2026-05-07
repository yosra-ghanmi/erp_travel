import { Link } from 'react-router-dom'
import { Panel } from '../components/ui'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Panel title="Unauthorized">
          <p className="text-sm text-slate-600 dark:text-slate-300">You do not have permission to access this page.</p>
          <Link className="mt-4 inline-block text-sm font-medium text-brand-600" to="/">Go to allowed workspace</Link>
        </Panel>
      </div>
    </div>
  )
}
