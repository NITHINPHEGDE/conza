import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
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
            <Mail size={24} className="text-accentAmber" />
          </div>
          <h1 className="text-xl font-bold text-textPrimary">Forgot Password?</h1>
          <p className="text-sm text-textMuted mt-1 text-center">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-success font-medium">Reset link sent!</p>
            <p className="text-sm text-textMuted mt-1">Check your email inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="admin@conza.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
