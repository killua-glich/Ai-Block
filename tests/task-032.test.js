// @vitest-environment node
// Docker: the API runs as a second service, and nginx forwards /api to it.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')

describe('032 Docker setup', () => {
  const compose = read('docker-compose.yml')
  const apiPart = compose.slice(compose.indexOf('\n  api:'), compose.indexOf('\nvolumes:'))

  it('compose has a web service and an api service', () => {
    expect(compose).toMatch(/^ {2}web:/m)
    expect(compose).toMatch(/^ {2}api:/m)
  })

  it('the web site is still on port 8080 and waits for the api', () => {
    expect(compose).toMatch(/"8080:80"/)
    expect(compose).toMatch(/depends_on:\s*\n\s+- api/)
  })

  it('the api is built from Dockerfile.api and is not published to the outside', () => {
    expect(apiPart).toMatch(/dockerfile: Dockerfile\.api/)
    expect(apiPart).not.toMatch(/ports:/)
  })

  it('the database lives in a named volume, so it survives a rebuild', () => {
    expect(apiPart).toMatch(/- db-data:\/data/)
    expect(compose).toMatch(/^volumes:\s*\n\s+db-data:/m)
  })

  it('Dockerfile.api runs the server on Node 24 with only the packages it needs', () => {
    const file = read('Dockerfile.api')
    expect(file).toMatch(/^FROM node:24/m)
    expect(file).toMatch(/npm ci --omit=dev/)
    expect(file).toMatch(/COPY server \.\/server/)
    expect(file).toMatch(/COPY src\/data\/devices\.js \.\/src\/data\/devices\.js/)
    expect(file).toMatch(/DB_PATH=\/data\/ai-block\.db/)
    expect(file).toMatch(/CMD \["node", "server\/index\.js"\]/)
  })

  it('nginx forwards /api to the api service, and still serves the web site', () => {
    const conf = read('nginx.conf')
    expect(conf).toMatch(/location \/api\/ \{[^}]*proxy_pass http:\/\/api:3001;/)
    expect(conf).toMatch(/try_files \$uri \$uri\/ \/index\.html;/)
  })

  it('the build leaves the local database file out of the images', () => {
    expect(read('.dockerignore')).toMatch(/^data$/m)
  })

  it('the web image is still the nginx build of the site', () => {
    const file = read('Dockerfile')
    expect(file).toMatch(/npm run build/)
    expect(file).toMatch(/FROM nginx:alpine/)
  })
})
