# Mathogic Mock Test Frontend

React 19 and Vite frontend for the Mathogic timed practice-test application.

## Run locally

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:5000`.
For a separately hosted API, set `VITE_API_BASE_URL` to the API base URL before
building, for example `https://api.example.com`.

## Validate changes

```powershell
npm run lint
npm run build
```

See the repository [README](../README.md) for backend configuration and local
development instructions.
