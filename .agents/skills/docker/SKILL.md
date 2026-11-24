---
name: docker
description: Write, build, run and debug this project's Docker setup (Dockerfile, docker-compose.yml, nginx.conf, .dockerignore) safely with docker compose. Use whenever a task mentions Docker, containers, compose, an image, nginx or deploying the site.
---

# Docker for Ai-Block

Test Docker ONLY through `docker compose` in the repo root. Follow the rules first, then the steps.

## Hard rules (a broken run on 2026-11-24 happened because these were missing)

1. **NEVER mount a folder into a container.** No `-v`, `--volume`, `--mount`, no `$PWD`, no `docker run ... /app`. A container running `npm ci` on a mounted project deletes and replaces the Mac's `node_modules` with Linux files, and lint, build and tests stop working. This happened twice.
2. **Do not run `npm`, `npx` or `node` inside a container against the repo.** The only way to test is `docker compose build` and `docker compose up`.
3. **Only touch what this project's compose started.** Other containers on this machine (postgres, elasticsearch, kibana) belong to other projects. Never run `docker rm`, `docker kill`, `docker stop <name>`, `docker system prune`, `docker volume rm` or `docker image prune`. Stop this project with `docker compose down`.
4. **If the Docker daemon is not running** (`Cannot connect to the Docker daemon`), stop and tell the user to start Docker Desktop. Do not try to start it yourself.
5. Do not edit anything in `tests/`, and do not commit the Docker files unless the user asks.

## Steps

1. Check the daemon: `docker info > /dev/null 2>&1 && echo up || echo DOWN`. If DOWN, follow rule 4.
2. Validate the files: `docker compose config -q`
3. Build, with readable output: `docker compose build --progress=plain 2>&1 | tail -40`
4. Start: `docker compose up -d`
5. Check the pages (all three must print 200; the last one proves the single-page-app fallback works):
   - `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/`
   - `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/devices/1`
   - `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/rentals`
6. If a page is not 200: `docker compose logs --tail 30 web`
7. When finished: `docker compose down` (removes the container, keeps the image).
8. Finally run `npm run verify` to check that the project itself still passes.

## How this setup works

- `Dockerfile` has two stages. Stage 1 (`node:22-alpine`) runs `npm ci --ignore-scripts` and `npm run build`. Stage 2 (`nginx:alpine`) serves the `dist/` folder.
- `--ignore-scripts` is needed because the `prepare` script in `package.json` sets up a git hook, and the image has no git.
- `nginx.conf` sends every unknown path to `/index.html` (`try_files $uri $uri/ /index.html`), so React Router pages like `/rentals` work after a reload. Files in `/assets/` are cached for a year.
- `docker-compose.yml` has one service, `web`, on host port 8080 mapped to container port 80.
- `.dockerignore` keeps `node_modules`, `.git`, `backlog`, `bench` and `tests` out of the build.

## Solved problem: `npm ci` failed inside the build (2026-11-24)

The build stopped at `RUN npm ci` with `npm error Exit handler never called!` after about 70 seconds. That message hides the real cause.

**Real cause:** every download link in `package-lock.json` (the `resolved` fields) points at a company-internal npm registry, because the Mac's npm is configured to use it. A container cannot reach that server, so every download failed with `ENOTFOUND`.

**Fix (already in the Dockerfile):** a `sed` line before `npm ci` rewrites those links to `https://registry.npmjs.org/` inside the image only. The lockfile on disk is not changed, and its checksums still verify every package. Setting `--registry` or `--replace-registry-host` does NOT work: npm keeps the old path (`/artifactory/api/npm/npm/...`), which gives a 404 on the public registry.

If the build fails at `npm ci` again, show npm's own log. Temporarily change the line to `RUN npm ci ... || (tail -60 /root/.npm/_logs/*-debug-0.log; exit 1)`, rebuild with `docker compose build --progress=plain --no-cache`, read the `http fetch` and `error` lines, and remove the extra part again. Do not use a mount (rule 1).

If three tries fail, stop and write what you saw in a `## Notes` section of your task file, or tell the user.
