# Deploy MLT on Render

Render can host this project as two services:

- `mlt-backend`: Docker Web Service for the FastAPI backend
- `mlt-frontend`: Static Site for the Vite React frontend

The frontend calls the backend through `VITE_API_URL`. For the default
Blueprint in this repo, that value is:

```text
https://mlt-backend.onrender.com
```

If Render gives the backend a different URL, update `VITE_API_URL` in
`render.yaml` or in the frontend service Environment settings, then redeploy
the frontend.

## Steps

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, choose `New` > `Blueprint`.
3. Connect the repository.
4. Use the default Blueprint path: `render.yaml`.
5. Deploy the Blueprint.
6. After deploy, open the frontend service URL.

## Custom domains

For production, a clean setup is:

- Frontend: `https://mlt.company.com`
- Backend/API: `https://api.mlt.company.com`

After adding those custom domains in Render, set the frontend environment
variable:

```text
VITE_API_URL=https://api.mlt.company.com
```

Then redeploy the frontend because Vite bakes `VITE_API_URL` into the built
JavaScript bundle.

## Notes

- No VPS, Nginx, Certbot, or manual SSL setup is needed on Render.
- Do not use Render's free instance type for real customer usage. A sleeping
  backend feels broken to users.
- The backend uses temporary files only. If the app later needs saved uploads,
  add a database or object storage instead of relying on the local filesystem.
