import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0A0A0F' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight"
            style={{ color: '#C8FF00', fontFamily: 'Syne, sans-serif' }}>
            AIS
          </h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            Athlete Intelligence System
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
