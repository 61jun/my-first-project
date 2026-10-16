// Public browser configuration, not database passwords or service-role keys.
// Keep the URL and key together so an incomplete deployment cannot mix projects.
const personalProject = {
  url: 'https://gnchomdjicbcjwnsluvq.supabase.co',
  key: 'sb_publishable_Xv08z0tmK-Wk2RI9mKjmkA_AGECfHHX',
};

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();

export const cloudConfig = url && key ? { url, key } : personalProject;
