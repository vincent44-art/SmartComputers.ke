# TODO

- [ ] Update `backend/app/api/admin.py` to filter out empty image URLs before inserting `ProductImage` rows during product create/update.
- [ ] Add server-side validation to require at least one non-empty image URL.
- [ ] Smoke test: save a product from `/admin/products/new` and ensure 201 response.
- [x] Smoke test code compile: `python3 -m py_compile backend/app/api/admin.py`


