import { RegisterForm } from '@/components/auth/RegisterForm'
export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">AIS</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea tu cuenta de atleta</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  )
}
