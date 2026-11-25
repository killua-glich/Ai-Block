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
