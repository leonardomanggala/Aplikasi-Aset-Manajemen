import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { User } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  appLogo?: string | null;
}

export default function Login({ users, onLoginSuccess, appLogo }: LoginProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const sanitizedUsername = usernameInput.trim().toLowerCase();
      const sanitizedPassword = passwordInput.trim();

      if (!sanitizedUsername || !sanitizedPassword) {
        setErrorMsg('Username dan password harus diisi');
        setIsSubmitting(false);
        return;
      }

      const matchedUser = users.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uPass = u.password || '123';
        return uName === sanitizedUsername && uPass === sanitizedPassword;
      });

      if (matchedUser) {
        onLoginSuccess(matchedUser);
      } else {
        setErrorMsg('Username atau password salah! Silakan coba lagi.');
      }
      setIsSubmitting(false);
    }, 450);
  };

  const logoSrc = appLogo || '/pw.png';

  return (
    <main id="login-container" className="min-h-screen w-full bg-background text-foreground lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-primary-950 lg:block">
        <img
          src="/login-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 text-white xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur">
              <img src={logoSrc} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">SIMAS Paroki</p>
              <p className="text-xs text-white/70">Sistem Manajemen Aset</p>
            </div>
          </div>

          <div className="max-w-xl pb-6">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/75">
              Paroki Pringwulung
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Penatausahaan Aset
              <br />
              Paroki Pringwulung
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
              Sistem informasi terpadu untuk pencatatan, pemantauan, dan pemeliharaan
              inventaris Gereja Santo Yohanes Rasul.
            </p>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Tim Aset Paroki
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background px-5 py-10 sm:px-8">
        <Card className="w-full max-w-[420px] border-border/80 bg-card shadow-lg shadow-foreground/5">
          <CardHeader className="space-y-5">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted p-2.5 lg:hidden">
              <img src={logoSrc} alt="Logo Paroki" className="h-full w-full object-contain" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Selamat datang
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Masuk menggunakan akun Anda untuk melanjutkan ke workspace aset.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Gagal masuk</p>
                  <p className="mt-1 opacity-90">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-username" className="text-sm font-medium leading-none">
                  Username
                </label>
                <Input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium leading-none">
                  Kata sandi
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    onClick={() => setShowPassword(show => !show)}
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Masuk ke workspace
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Diberdayakan oleh Tim Aset Paroki
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
