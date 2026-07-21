# Task Progress

## All Changes Completed ✅

### Step 1: Remove "Free delivery" from AnnouncementBar ✅
- `frontend/src/components/layout/AnnouncementBar.tsx` — removed truck icon + free delivery text

### Step 2: Category dropdown → typeable input with suggestions ✅
- `frontend/src/app/admin/products/new/page.tsx` — replaced `<select>` with `<input list>` + `<datalist>`
- Users can type anything or select from existing categories
- Category name is resolved to numeric ID before saving

### Step 3: RAM/Storage predefined options ✅
- `frontend/src/app/admin/products/new/page.tsx` — RAM: 4GB, 8GB, 16GB, 32GB
- Storage: 128GB, 256GB, 512GB, 1TB, 2TB
- Both remain typeable with suggestions via `<datalist>`

### Step 4: Auto-warranty based on product name & condition ✅
- `frontend/src/app/admin/products/new/page.tsx` — Added `useEffect` that watches product name + condition
- **Refurbished + Monitor** → Warranty = "3 months"
- **Refurbished + Laptop** → Warranty = "6 months"
- **New + Monitor/Laptop** → Warranty = "1 year"
- Other products → warranty left empty (user can type or leave blank)
- Auto-fill only triggers when warranty is empty; user can manually override

