import { supabase } from '../lib/supabase';
import { showToast } from '../lib/utils';

export function renderLogin(container: HTMLElement) {
    let isSignUp = false;

    function render() {
        container.innerHTML = `
      <div class="login-view">
        <div class="login-card glass-card">
          <div class="login-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h1>AR Camera</h1>
          <p style="margin-top: 8px;">Capture, create in AR, sync across devices</p>
          
          <form class="login-form" id="login-form">
            <div class="input-group">
              <label for="email">Email</label>
              <input class="input-field" id="email" type="email" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="input-group">
              <label for="password">Password</label>
              <input class="input-field" id="password" type="password" placeholder="••••••••" required minlength="6" autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-full" id="login-submit">
              ${isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div class="login-toggle">
            ${isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button id="toggle-auth">${isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </div>
        </div>
      </div>
    `;

        document.getElementById('toggle-auth')?.addEventListener('click', () => {
            isSignUp = !isSignUp;
            render();
        });

        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (document.getElementById('email') as HTMLInputElement).value.trim();
            const password = (document.getElementById('password') as HTMLInputElement).value;
            const btn = document.getElementById('login-submit') as HTMLButtonElement;

            btn.disabled = true;
            btn.textContent = isSignUp ? 'Creating...' : 'Signing in...';

            try {
                if (isSignUp) {
                    const { error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    showToast('Account created! Check email to confirm.', 'success');
                } else {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    showToast('Welcome back!', 'success');
                }
            } catch (err: any) {
                showToast(err.message || 'Auth failed', 'error');
                btn.disabled = false;
                btn.textContent = isSignUp ? 'Create Account' : 'Sign In';
            }
        });
    }

    render();
}
