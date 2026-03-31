import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Panel } from '../components/ui'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    if (!email) return
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Panel title="Password Recovery">
          <form className="space-y-3" onSubmit={submit}>
            <Input placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Button className="w-full" type="submit">Send Reset Link</Button>
          </form>
          {sent ? <p className="mt-3 text-xs text-emerald-600">Reset link sent to {email}.</p> : null}
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-brand-600">Back to login</Link>
          </p>
        </Panel>
      </div>
    </div>
  )
}
