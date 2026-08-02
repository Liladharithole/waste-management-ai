# Google Maps Platform Integration & Cost Optimization Guidelines

This guide establishes the mandatory engineering standards and best practices for integrating Google Maps Platform APIs (Maps, Places, Routes, Geocoding) cost-effectively and securely within the Waste Management AI project.

---

## 💰 1. Billing & Cost Architecture (Avoiding High Charges)

Google Maps Platform charges per request, and some SKUs (like Places details or Autocomplete) can become highly expensive under high traffic. All developers and AI agents must implement these optimization guidelines.

### A. Autocomplete Session Tokens (Mandatory)

- **The Problem**: If every keypress in a search bar fires a separate request to the Places Autocomplete API, searching for "Mumbai" (6 characters) will bill you for **6 separate API calls**.
- **The Solution (Session Tokens)**: Always use an `AutocompleteSessionToken` (supported natively in the Places JS SDK or generated as a UUID on the server/client).
  - A **Session Token** groups the autocomplete typing phase and the final selection phase (fetching coordinates/place details) into a **single billing transaction**.
  - **Rule**: Generate a session token when the user starts typing. Pass this token with all autocomplete requests and the final place details lookup request. Once the user selects a place, discard the token.

### B. Client-Side Debouncing (Mandatory)

- **Rule**: Never trigger an address autocomplete API call on every keystroke.
- **Implementation**: Implement a debouncer on the input handler with a minimum wait time of **300ms** to **500ms**. If the user keeps typing, the timer resets, preventing API spam.
  ```javascript
  // Example React/JS Debounce Hook / Handler
  let debounceTimeout;
  const onInputChange = (input) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchSuggestions(input);
    }, 400); // Wait 400ms after last keystroke before calling server proxy
  };
  ```

### C. Field Masking (Places API New)

- **Rule**: When requesting detailed place information (e.g., retrieving coordinates for a Place ID), **never request all fields**. Use **Field Masks** to request _only_ the specific fields needed (e.g. `formattedAddress`, `location`).
- **Why**: Google bills based on the fields you request. Requesting reviews, photos, or operational hours places you in the expensive "Atmosphere" and "Contact" tiers. Requesting only coordinates keeps you in the lower "Basic" tier.

---

## 📍 2. Optimization by Use Case

### A. Selecting Location by Dragging a Map Point

- **The Problem**: Triggering a Reverse Geocoding API call (converting lat/lng to text address) on every pixel of a map drag will trigger hundreds of billing calls.
- **The Solution**:
  1. Only render the visual marker moving in real-time (purely client-side, zero cost).
  2. Only trigger the Reverse Geocoding API call on the **`dragend`** event (when the user stops dragging and releases the mouse/pointer).
  3. Throttle the `drag` coordinates update if you must display real-time values, or prefer showing "Pin dropped at: {lat, lng}" until drag ends, then query the address.

### B. Route Tracking & Directions

- **The Problem**: Sending coordinates every 5 seconds to calculate distance or directions will cause astronomical bills.
- **The Solution**:
  1. For displaying real-time movement, calculate distances client-side using spherical geometry (e.g., Haversine formula) in JavaScript.
  2. Only query the Google Routes API when the trip begins (to draw the path) and when a major route deviation occurs.

---

## 🛡️ 3. Security & Key Safeguards

### A. Avoid CORS Traps & Secure API Keys

- **Rule**: Never make direct `fetch()` calls to Google REST endpoints (Routes, Geocoding, Places) from the frontend web browser.
  - These endpoints do not have CORS headers, causing browsers to block requests.
  - Direct frontend calls require exposing your unrestricted Google API key in the public bundle, exposing you to quota scraping.
- **The Solution**:
  1. Use official Google Web Component SDKs (which handle authentication securely under the hood).
  2. Use a **server-side proxy route** (like `/organizations/address-suggestions`) in NestJS. This keeps your API key secure on the backend and bypasses browser CORS.

### B. API Key Restrictions

- Ensure all production API keys are restricted in the Google Cloud Console:
  - **HTTP Referrer restrictions**: Limit client keys to your specific domains (e.g. `*.wastemanagement.ai`).
  - **API restrictions**: Limit keys so they can _only_ invoke the specific APIs they need (e.g. a key for Autocomplete should only be allowed to call the Places API).

---

## 🚀 Checklist for Developers & AI Agents

- [ ] Autocomplete searches are debounced by at least 400ms on the frontend.
- [ ] Session tokens are used to group autocomplete typing and place selection.
- [ ] Field masks restrict Place Details to only requested fields.
- [ ] Reverse Geocoding is restricted to the `dragend` marker event.
- [ ] All keys are kept secure on the backend or restricted by Referrer/API.
