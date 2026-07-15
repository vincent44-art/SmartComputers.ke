# TODO

## Admin 401 Unauthorized fix
- [x] Investigated admin backend guard (`admin_required`) and admin role logic (`User.is_admin`).
- [x] Confirmed seed creates `role="admin"` user.
- [x] Checked frontend admin pages call `/api/admin/*` endpoints.
- [x] Verified Axios auth header wiring in `frontend/src/lib/api.ts`.
- [x] Identified admin layout gating is based on `useAuthStore` role.
- [x] Add a server-verified auth check in `frontend/src/app/admin/layout.tsx` via `/api/auth/me` and redirect/clear tokens on 401.





