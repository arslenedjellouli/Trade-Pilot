import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../components/ui/Button'

export default function Signup() {
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
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Create account</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Start your exporter workspace</h1>
            <p className="mt-2 text-sm text-slate-500">Sign up to build AI-powered product catalogs and compliance workflows.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                {...register('name')}
                placeholder="Emma Exporter"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Business email
              <input
                type="email"
                {...register('email')}
                placeholder="emma@exportco.com"
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
            <Button type="submit" className="w-full">Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
