// Helper for the server tests: starts an Express app on a free port.
//   const api = await listen(createApp(db))
//   const res = await fetch(`${api.url}/api/devices`)
//   await api.close()
export async function listen(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

// A logged-in client for tests of the rentals routes.
// When the API has accounts it registers a new user and returns the headers to send (the session cookie).
// Before accounts exist (the register address answers 404) it returns no extra headers.
let counter = 0
export async function authHeaders(api, { name = 'Test User', password = 'correct horse battery' } = {}) {
  counter += 1
  const res = await fetch(`${api.url}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `test${counter}-${Date.now()}@example.com`, name, password }),
  })
  if (res.status === 404) return {}
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
  return { Cookie: cookie }
}
