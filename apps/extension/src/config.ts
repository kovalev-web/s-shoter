// Single source of truth for where the app lives. When moving off local dev to
// staging/prod, change THIS line (and the matching host_permissions in
// public/manifest.json) — both the API calls and the board link follow it.
export const API_BASE_URL = "http://localhost:3000";

export const BOARD_URL = `${API_BASE_URL}/board`;
