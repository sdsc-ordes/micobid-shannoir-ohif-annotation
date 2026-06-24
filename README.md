# MicoBID / Shanoir Annotation Panel

A web UI for managing annotation tasks across Shanoir + OHIF — built to be
embedded in VIP as a button before annotation, or to provide deep links into
OHIF once an annotator is logged in.

## Run

```sh
# 1. Create your credentials file
cp caddy/auth.env.example caddy/auth.env

# 2. Generate a bcrypt hash for your password
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'your-password'

# 3. Paste the hash into caddy/auth.env as BASIC_AUTH_HASH, then bring it up
docker compose up -d --build

# 4. Open http://localhost:8080  (basic auth: admin / your-password)
```

`caddy/auth.env` is gitignored. Update `BASIC_AUTH_USER` / `BASIC_AUTH_HASH`
to rotate credentials and `docker compose restart caddy` to apply.

## Architecture

```
host:8080  →  caddy (basic auth)  →  app:5173  (Vite + React)
```

Caddy fronts the Vite dev server with HTTP Basic Auth. The app container is
not bound to the host — Caddy is the only public entry point.

## Layout

```
app/                  React app (Vite + Tailwind)
  src/
    components/       Masthead, Sidebar, Overview, TaskTable,
                      BulkActionBar, ReviewDrawer, AssignNewDialog
    data/mockData.js  Mock Shanoir study, users, series, tasks, templates
caddy/
  Caddyfile           Reverse proxy + basic auth
  auth.env.example    Credentials template (copy to auth.env, gitignored)
docker-compose.yml    Two services: app + caddy
```
