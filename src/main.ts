import { supabase } from './lib/supabase';
import { navigateTo } from './router';

// Initialize app
async function init() {
  // Set up auth state listener
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      navigateTo('camera');
    } else {
      navigateTo('login');
    }
  });

  // Check initial session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    navigateTo('camera');
  } else {
    navigateTo('login');
  }

  // Set up nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = (btn as HTMLElement).dataset.view as 'camera' | 'ar' | 'gallery' | 'settings';
      if (view) navigateTo(view);
    });
  });
}

init();
