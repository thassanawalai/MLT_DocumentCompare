# Deploy MLT on Render

Render can host this project as two services:

- `mlt-backend`: Docker Web Service for the FastAPI backend
- `mlt-frontend`: Static Site for the Vite React frontend

The frontend calls the backend through `VITE_API_URL`. For the default
Blueprint in this repo, that value is:

```text
https://mlt-backend-bufr.onrender.com
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

## Customer Directory data

The backend pre-deploy command runs migrations and imports
`backend/master_data/customer_import_template.xlsx` only when the production
customer table is empty. This keeps normal deployments from replacing customer
edits. Importing the workbook into local Docker PostgreSQL does not change the
Render production database.

To deliberately refresh an existing production customer dataset, first review
the workbook and then run this command from the Render backend Shell:

```sh
python scripts/seed_customers.py --workbook /import-data/customer_import_template.xlsx --replace
```

`--replace` removes the existing customer rows and their related addresses,
contacts, banks, and identifiers before importing the workbook.

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
