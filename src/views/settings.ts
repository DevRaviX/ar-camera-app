import { supabase } from '../lib/supabase';
import { showToast } from '../lib/utils';

export function renderSettings(container: HTMLElement) {
    renderSettingsContent(container);
}

async function renderSettingsContent(container: HTMLElement) {
    const { data: { user } } = await supabase.auth.getUser();

    container.innerHTML = `
    <div class="view" id="settings-view">
      <div class="view-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div class="glass-card" style="margin-bottom: var(--space-md);">
        <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Account</h3>
        <div class="settings-item">
          <span class="settings-label">Email</span>
          <span class="settings-value">${user?.email || 'Unknown'}</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">User ID</span>
          <span class="settings-value" style="font-size:0.7rem;word-break:break-all;">${user?.id?.slice(0, 16) || '...'}...</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Joined</span>
          <span class="settings-value">${user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
        </div>
      </div>

      <div class="glass-card" style="margin-bottom: var(--space-md);">
        <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Cross-Device Sync</h3>
        <div class="settings-item">
          <span class="settings-label">Status</span>
          <span class="settings-value" style="color: var(--success);">● Active</span>
        </div>
        <p style="margin-top: var(--space-sm); font-size: 0.8rem;">
          Login with the same email on any device or desktop browser to access your files.
        </p>
      </div>

      <div class="glass-card" style="margin-bottom: var(--space-md);">
        <h3 style="margin-bottom: var(--space-md); color: var(--text-secondary);">About</h3>
        <div class="settings-item">
          <span class="settings-label">App</span>
          <span class="settings-value">AR Camera v1.0.0</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Engine</span>
          <span class="settings-value">Three.js + WebXR</span>
        </div>
        <div class="settings-item">
          <span class="settings-label">Backend</span>
          <span class="settings-value">Supabase</span>
        </div>
      </div>

      <button class="btn btn-danger btn-full btn-lg" id="logout-btn" style="margin-top: var(--space-lg);">
        Sign Out
      </button>
    </div>
  `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showToast('Sign out failed', 'error');
        } else {
            showToast('Signed out', 'info');
        }
    });
}
