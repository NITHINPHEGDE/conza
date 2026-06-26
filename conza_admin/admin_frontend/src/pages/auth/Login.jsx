import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import useAuthStore from '../../store/auth/useAuthStore'
import authService from '../../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.login(form)
      if (res.success) {
        login(res.admin, res.token)
        navigate('/')
      } else {
        alert(res.message || 'Login failed. Check your credentials.')
      }
    } catch (err) {
      alert('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-accentYellow flex items-center justify-center mb-4">
            <HardHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-textPrimary">Conza Admin</h1>
          <p className="text-sm text-textMuted mt-1">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@conza.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-textSecondary">
              <input type="checkbox" className="rounded border-border" />
              Remember me
            </label>
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-accentAmber hover:underline">
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
