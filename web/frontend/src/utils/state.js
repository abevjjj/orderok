// Simple shared state object.
// Pages import this and mutate it; nav re-renders on login.

export const state = {
  me: null,       // { user_id, display_name, is_admin, perms }
  users: [],      // cached user list
}

export function canRead(module)  { return state.me?.is_admin || state.me?.perms?.[module]?.read }
export function canWrite(module) { return state.me?.is_admin || state.me?.perms?.[module]?.write }
