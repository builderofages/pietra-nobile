# Pietra Nobile

Luxury hand-carved marble — statues, fountains, fireplaces, architectural stonework.

## Structure

```
pietra-nobile/
├── index.html          # Public site
├── css/main.css        # Public site styles
├── js/config.js        # Central config (Supabase URL/key, hero video)
├── js/main.js          # Public site behavior + inquiry form
├── admin/
│   ├── index.html      # Staff portal (login required)
│   ├── css/admin.css   # Staff portal styles
│   └── js/admin.js     # Auth, inquiries, orders, KPIs
└── README.md
```

## Backend (Supabase)

- `pn_inquiries` — consultation form submissions (public can insert only)
- `pn_orders` — orders pipeline (staff only)
- `pn_staff` — staff email allowlist; all reads/writes gated by RLS
- Staff portal: `/admin/` — sign in with a staff account

## Deploy

GitHub Pages from `main` branch root. No build step.
