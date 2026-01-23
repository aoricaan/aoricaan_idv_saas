import { useState, useEffect } from 'react'
import StepRenderer from './components/StepRenderer'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [nextStep, setNextStep] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const fetchSession = async () => {
      // 1. Get Token from URL
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      setToken(token)

      if (!token) {
        setError('No Session Token Found')
        setLoading(false)
        return
      }

      try {
        // 2. Call Backend
        // Note: in prod this URL should be env var
        const res = await fetch(`http://localhost:8080/api/v1/sessions?token=${token}`)

        if (!res.ok) {
          throw new Error('Invalid or Expired Session')
        }

        const data = await res.json()
        setSession(data.session)
        setNextStep(data.next_step)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  const handleStepComplete = async (stepData) => {
    // alert("Step Completed! (Logic to submit to backend goes here)")
    setLoading(true)
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    try {
      const res = await fetch(`http://localhost:8080/api/v1/sessions/submit?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: stepData || {} })
      })

      if (!res.ok) throw new Error('Failed to submit step')

      const data = await res.json()
      setSession(data.session)
      setNextStep(data.next_step)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={styles.container}>Loading secure session...</div>
  if (error) return <div style={{ ...styles.container, color: 'red' }}>Error: {error}</div>

  return (
    <div style={styles.container}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h1>IDV SaaS</h1>
        <small>Session: {session.user_reference}</small>
      </header>

      <main>
        {nextStep ? (
          <StepRenderer step={nextStep} token={token} onStepComplete={handleStepComplete} />
        ) : (
          <div style={{ padding: '20px', background: '#d4edda', color: '#155724' }}>
            <h2>Verification Complete!</h2>
            <p>All steps finished.</p>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    textAlign: 'center'
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px'
  }
}

export default App
