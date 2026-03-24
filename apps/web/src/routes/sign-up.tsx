import { Button, Callout, Card, FormGroup, H4, InputGroup } from '@blueprintjs/core'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signUpError } = await authClient.signUp.email({ name, email, password })
    if (signUpError) {
      setError(signUpError.message ?? 'Sign up failed')
      setLoading(false)
      return
    }
    void navigate({ to: '/sign-in' })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 50px)', padding: '2rem' }}>
      <Card style={{ width: 360 }}>
        <H4 style={{ marginTop: 0 }}>Create account</H4>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Name" labelFor="signup-name">
            <InputGroup
              id="signup-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </FormGroup>
          <FormGroup label="Email" labelFor="signup-email">
            <InputGroup
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </FormGroup>
          <FormGroup label="Password" labelFor="signup-password">
            <InputGroup
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
            text="Create account"
            loading={loading}
            fill
          />
        </form>
        <p style={{ marginBottom: 0, marginTop: '1rem', textAlign: 'center' }}>
          Already have an account?
          {' '}
          <Link to="/sign-in">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
