import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [done, setDone] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setDone(true)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-textMuted hover:text-textPrimary mb-6">
          <ArrowLeft size={16} />
          Back to login
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-accentYellowSoft flex items-center justify-center mb-4">
            <Lock size={24} className="text-accentAmber" />
          </div>
          <h1 className="text-xl font-bold text-textPrimary">Reset Password</h1>
          <p className="text-sm text-textMuted mt-1 text-center">
            Create a new password for your account.
          </p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="text-success font-medium">Password updated!</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="New Password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
