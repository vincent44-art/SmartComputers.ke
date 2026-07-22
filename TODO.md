# Shopping Cart Improvements

## Steps
1. ✅ **Plan approved by user**
2. ✅ Update `frontend/src/lib/format.ts` — Add missing currency symbols (EUR, GBP, AED) and use Intl.NumberFormat
3. ✅ Update `frontend/src/app/cart/page.tsx` — Remove Shipping & VAT rows, set Total = Subtotal, pass `currency` to all `formatCurrency()` calls
4. ✅ Update `frontend/src/components/cart/CartDrawer.tsx` — Import currency from store and pass to `formatCurrency()` calls

