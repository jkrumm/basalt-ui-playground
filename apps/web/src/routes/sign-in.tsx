import { Button, Callout, Card, FormGroup, H4, InputGroup } from '@blueprintjs/core'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

const SignInSearch = Type.Object({
  redirect: Type.Optional(Type.String()),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>) => {
    const result = Value.Default(SignInSearch, { ...search })
    return Value.Check(SignInSearch, result) ? result : {}
  },
  component: SignInPage,
})

function SignInPage() {
  const { redirect = '/' } = Route.useSearch()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await authClient.signIn.email({ email, password })
    if (signInError) {
      setError(signInError.message ?? 'Sign in failed')
      setLoading(false)
      return
    }
    await router.invalidate()
    window.location.assign(redirect)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 50px)', padding: '2rem' }}>
      <Card style={{ width: 360 }}>
        <H4 style={{ marginTop: 0 }}>Sign in</H4>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Email" labelFor="signin-email">
            <InputGroup
              id="signin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </FormGroup>
          <FormGroup label="Password" labelFor="signin-password">
            <InputGroup
              id="signin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </FormGroup>
          {error && (
            <Callout intent="danger" style={{ marginBottom: '1rem' }}>
              {error}
            </Callout>
          )}
          <Button
            type="submit"
            intent="primary"
            text="Sign in"
            loading={loading}
            fill
          />
        </form>
        <p style={{ marginBottom: 0, marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account?
          {' '}
          <Link to="/sign-up">Sign up</Link>
        </p>
      </Card>
    </div>
  )
}
