# Implementation Plan - Unify Ratings Page with ShowDetail

Make the `/ratings/:slug` page completely identical to `ShowDetail`—retaining the exact layout, dimensions, metadata, episode list, cast, media, and design, while ensuring the interactive Ratings Graph and dedicated ratings link are active.

---

## User Review Required

> [!IMPORTANT]
> The `/ratings/:slug` URL will render the complete `ShowDetail` page without stripping descriptions, cast, or media. It will activate the **"Ratings Graph"** tab by default when accessed via a ratings link, allowing full access to both the interactive episode ratings graph and the complete episode list.

---

## Proposed Changes

### Core Routing & View Resolution

#### [`App.tsx`](file:///App.tsx)
- Update the `/ratings/:slug` route handler to render the standard `ShowDetail` component directly instead of the stripped-down `ShowRatingsPage`.
- Pass `initialTab="ratings-graph"` to `ShowDetail` when accessed via `/ratings/...`, ensuring the ratings graph is immediately visible while keeping all other tabs, descriptions, cast lists, and episode lists intact.
- Ensure all props (`allShows`, `onNavigate`, `userList`, `userFavorites`, `userCharacters`, `handleUpdateListStatus`, `handleToggleFavorite`, `currentUser`, `notifications`, `handleToggleEpisode`) are passed to `ShowDetail` consistently.

---

### Component Configuration

#### [`pages/ShowDetail.tsx`](file:///pages/ShowDetail.tsx)
- Accept an optional `initialTab?: 'episodes' | 'ratings-graph'` prop.
- Initialize `activeMainTab` to `initialTab || 'episodes'`.
- Retain all existing ShowDetail features completely unchanged:
  - Full hero backdrop, poster, title, rating, genres, badges, and metadata
  - Story overview, synopsis, cast section, videos, and recommendations
  - Episode season selector and full episode list with watch-status tracking
  - Ratings Graph tab with the dedicated URL banner (`www.watchlistey.com/ratings/{slug}`) and vertical season columns

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to ensure TypeScript compilation passes.
- Run `lint_applet` to verify no lint or type errors.

### Manual Verification
- Navigate to `/ratings/attack-on-titan` and verify it displays the full `ShowDetail` layout with all lists, sizes, and styling identical to `/tv/attack-on-titan`.
- Verify the **Ratings Graph** tab is active and renders the vertical episode columns.
- Verify users can toggle back to the **Episodes** tab to see the full episode list and track watched episodes.
- Verify the dedicated ratings link box is displayed with instant copy functionality.
