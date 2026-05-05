# FoodConnect - Bug Fixes Summary

## Issues Fixed (May 4, 2026)

### 1️⃣ Delete Listing Error ✅
**Problem:** 
- When deleting a food item that had orders, got error: `NOT NULL constraint failed: orders.food_item_id`
- SQLite foreign key constraint prevented deletion

**Fix:**
- Added check before deletion to prevent deleting items with existing orders
- Returns HTTP 400 error with message: `"Cannot delete this listing. It has X order(s). You can mark it as unavailable instead."`
- Preserves data integrity

**File:** `backend/routers/food.py`

---

### 2️⃣ Chat Infinite Loop ✅
**Problem:**
- Chat page made endless API requests (GET /chat/order + PUT /chat/read) every few milliseconds
- Caused by useEffect dependency on `selectedConversation` object causing re-renders

**Fix:**
- Changed from storing full conversation object to just `selectedOrderId` (string)
- Wrapped `fetchMessages` and `fetchConversations` in `useCallback` hooks
- Fixed dependency arrays to prevent infinite loops
- Conversations list now looks up data from state using selectedOrderId

**Changes:**
- `selectedConversation` → `selectedOrderId`
- Added `useCallback` for memoization
- Fixed all component references

**File:** `frontend/src/pages/Chat.jsx`

---

### 3️⃣ Filters Not Working ✅
**Problem:**
- Filters (food type, price range) required clicking "Apply Filters" button
- Not intuitive - users expected instant filtering

**Fix:**
- **Auto-apply filters** when changed (except keyword search)
- Improved price parsing to handle empty strings properly
- Remove undefined/empty values from API request
- Removed redundant "Apply Filters" button
- Kept "Clear All Filters" button for convenience

**Changes:**
- Modified `handleFilterChange` to auto-fetch when non-keyword filters change
- Enhanced `fetchListings` to properly parse and clean filter parameters
- Simplified filter UI

**File:** `frontend/src/pages/BrowseListings.jsx`

---

## Testing Checklist

- [x] Delete food items without orders - works
- [x] Try to delete food items with orders - shows proper error
- [x] Chat page doesn't spam API requests
- [x] Chat messages load correctly
- [x] Food type filter applies instantly
- [x] Price range filter applies instantly
- [x] Keyword search works with button
- [x] Clear filters resets all filters

---

## Related Files Changed

### Backend
- `backend/routers/food.py` - Added order check before deletion

### Frontend
- `frontend/src/pages/Chat.jsx` - Fixed infinite loop with useCallback
- `frontend/src/pages/BrowseListings.jsx` - Auto-apply filters

---

## Previous Fixes (Session)

1. **Bcrypt compatibility** - Fixed passlib/bcrypt version mismatch
2. **Negative quantities** - Fixed over-selling causing negative inventory
3. **Password hashing** - Fixed 72-byte bcrypt limitation
4. **Pydantic validation** - Allow quantity >= 0 for sold-out items
5. **Order update validation** - Prevent accepting orders with insufficient quantity

---

**Status:** All critical bugs resolved ✅
**Date:** May 4, 2026
**Next:** Test full user flow (register → list → order → chat → delete)
