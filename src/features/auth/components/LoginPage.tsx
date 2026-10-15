import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendPasswordReset,
} from '@/services/firebase/auth'
import { Button, Input, toast } from '@/shared/ui'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mapAuthError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = String((err as { code: string }).code)
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return 'Incorrect email or password.'
      }
      if (code === 'auth/user-not-found') {
        return 'No account found with this email.'
      }
      if (code === 'auth/email-already-in-use') {
        return 'An account already exists with this email. Try logging in.'
      }
      if (code === 'auth/weak-password') {
        return 'Password should be at least 6 characters long.'
      }
      if (code === 'auth/popup-closed-by-user') {
        return 'Google sign-in popup was closed before completion.'
      }
      if (code === 'auth/popup-blocked') {
        return 'Popups were blocked by your browser. Please allow popups.'
      }
      if (code === 'auth/network-request-failed') {
        return 'Network connection failed. Please check your internet.'
      }
    }
    return 'Authentication failed. Please check your inputs and try again.'
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(mapAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    try {
      if (isRegister) {
        await registerWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(mapAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email above first to receive password reset instructions.')
      return
    }
    try {
      await sendPasswordReset(email)
      toast.info(`Password reset email sent to ${email}`)
    } catch (err) {
      setErrorMsg(mapAuthError(err))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdropPattern} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1 className={styles.title}>CineTrack</h1>
          <p className={styles.subtitle}>Track. Rate. Remember.</p>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <Button
          variant="secondary"
          className={styles.googleBtn}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          leftIcon={
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
          }
        >
          Continue with Google
        </Button>

        <div className={styles.divider}>or with email</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            startIcon={<Mail size={16} />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            startIcon={<Lock size={16} />}
          />

          {!isRegister && (
            <button
              type="button"
              className={styles.forgotBtn}
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.switchMode}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className={styles.switchLink}
            onClick={() => {
              setIsRegister(!isRegister)
              setErrorMsg(null)
            }}
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
