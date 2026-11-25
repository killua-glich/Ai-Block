# 032 — Docker: run the API and the database as a second service

**Type:** feature
**Depends on:** 031
**Files:** `Dockerfile.api` (new), `docker-compose.yml`, `nginx.conf`, `.dockerignore`

## Goal

`docker compose up` starts two services: the web site (nginx) and the API with its SQLite database in a volume. nginx forwards every `/api` request to the API.

## Acceptance criteria

- [x] New `Dockerfile.api`: Node 24 image, installs only the production packages, copies `server/` and `src/data/devices.js`, sets `DB_PATH=/data/ai-block.db`, starts `node server/index.js`
- [x] `docker-compose.yml` has the `web` service (port 8080, waits for `api`) and the `api` service (built from `Dockerfile.api`, no published port, volume `db-data` mounted at `/data`)
- [x] `nginx.conf` has a `location /api/` block that does `proxy_pass http://api:3001;`; the rest stays as it is
- [x] `.dockerignore` lists `data`, so a local database file is never copied into an image
- [x] `npm run verify -- 032` passes (tests: `tests/task-032*.test.*`)

## Hints

- Do not change the existing `Dockerfile`: it builds the web site and stays as it is.
- Inside the Docker network the API is reached by its service name: `http://api:3001`.
- The test only reads the files. To try it for real after the task: `docker compose up --build`, then open http://localhost:8080 and rent a device.

## Prompt

Run `pi` (or `opencode`) in the repo root, then paste:

````text
Context: AGENTS.md (already loaded) has the stack, the conventions, the editing rules and a project map. Use it. Do NOT list or scan the project. Open only the files named below.
Rules: only change the files listed. Do not touch tests/. Do not write files with heredocs. Write each file only once; do not write the same file again and again.

First: `git mv backlog/todo/032-docker-api.md backlog/in-progress/032-docker-api.md`. (If it says the file is not there, it is already moved: go on.)

Task: `docker compose up` starts two services: the web site (nginx) and the API with its SQLite database in a volume. nginx forwards every `/api` request to the API.

Read first: `docker-compose.yml`, `nginx.conf`.
Edit or create: `Dockerfile.api` (new), `docker-compose.yml`, `nginx.conf`, `.dockerignore`.

Steps:
1. Write the complete file `Dockerfile.api` with the write tool, with exactly this content:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
# --omit=dev: the server needs only express. --ignore-scripts: the image has no git for the "prepare" hook.
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY server ./server
# The server fills an empty database with the built-in device list.
COPY src/data/devices.js ./src/data/devices.js
ENV PORT=3001 DB_PATH=/data/ai-block.db
VOLUME /data
EXPOSE 3001
CMD ["node", "server/index.js"]
```
2. Write the complete file `docker-compose.yml` with the write tool, with exactly this content:
```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    volumes:
      - db-data:/data
    restart: unless-stopped

volumes:
  db-data:
```
3. Change `nginx.conf` with ONE call of the edit tool (do not rewrite the file). oldText:
```text
  location / {
    try_files $uri $uri/ /index.html;

```
   newText:
```text
  location /api/ {
    proxy_pass http://api:3001;
    proxy_set_header Host $host;
  }

  location / {
    try_files $uri $uri/ /index.html;

```
4. Change `.dockerignore` with ONE call of the edit tool (do not rewrite the file). oldText:
```text
backlog

```
   newText:
```text
backlog
data

```

When done:
- Run `npm run verify -- 032`. If it says FAIL: read the lines under FAIL, fix the files, and run it again. Repeat until the last line is `VERIFY PASSED`.
- NEVER edit files in `tests/`, `package.json` or files the task does not list.
- Tick the checkboxes with this one command: `sed -i '' 's/- \[ \]/- [x]/' backlog/in-progress/032-docker-api.md`, then `git mv backlog/in-progress/032-docker-api.md backlog/done/032-docker-api.md`.
- `git add -A && git commit -m "task 032: Docker: API and database as a second service"`
If something is unclear or verify fails 3 times in a row: add a `## Notes` section to the task file explaining the problem and stop.
````
