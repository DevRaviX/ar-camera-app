/**
 * Show a toast notification
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date string
 */
export function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Canvas to blob failed')),
            type,
            quality
        );
    });
}
