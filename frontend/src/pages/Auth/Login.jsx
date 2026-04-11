import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const login = useAppStore((state) => state.login)
  const { register, handleSubmit } = useForm()

  const onSubmit = (values) => {
    login('demo-token', { name: values.name || 'Exporter' })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 sm:px-6">
        <div className="rounded-[2rem] bg-white p-10 shadow-soft">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Secure exporter login</h1>
            <p className="mt-2 text-sm text-slate-500">Use your workspace account to manage AI product operations.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Email or username
              <input
                {...register('name')}
                placeholder="emma@email.com"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to the platform?{' '}
            <Link to="/signup" className="font-semibold text-slate-900 hover:text-slate-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
