import { renderLogin } from './views/login';
import { renderCamera, cleanupCamera } from './views/camera';
import { renderAR, cleanupAR } from './views/ar';
import { renderGallery } from './views/gallery';
import { renderSettings } from './views/settings';

type ViewName = 'camera' | 'ar' | 'gallery' | 'settings';

let currentView: ViewName | 'login' = 'login';
let cleanupFn: (() => void) | null = null;

/**
 * Navigate to a view
 */
export function navigateTo(view: ViewName | 'login') {
    // Cleanup previous view
    if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
    }
    if (currentView === 'camera') cleanupCamera();
    if (currentView === 'ar') cleanupAR();

    currentView = view;
    const container = document.getElementById('view-container')!;
    const nav = document.getElementById('bottom-nav')!;

    if (view === 'login') {
        nav.classList.add('hidden');
        renderLogin(container);
        return;
    }

    // Show nav
    nav.classList.remove('hidden');

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
    });

    // Render view
    switch (view) {
        case 'camera':
            renderCamera(container);
            break;
        case 'ar':
            renderAR(container);
            break;
        case 'gallery':
            renderGallery(container);
            break;
        case 'settings':
            renderSettings(container);
            break;
    }
}

export function getCurrentView() {
    return currentView;
}
