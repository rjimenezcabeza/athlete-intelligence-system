import { LoginForm } from '@/components/auth/LoginForm'
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">AIS</h1>
          <p className="text-muted-foreground text-sm mt-1">Athlete Intelligence System</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
