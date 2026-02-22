import { showToast, canvasToBlob } from '../lib/utils';
import { uploadFile } from '../lib/storage';

let videoStream: MediaStream | null = null;
let facingMode: 'user' | 'environment' = 'environment';

export function renderCamera(container: HTMLElement) {
    container.innerHTML = `
    <div class="camera-container" id="camera-view">
      <video id="camera-feed" autoplay playsinline muted></video>
      <canvas id="capture-canvas" style="display:none;"></canvas>
      <div class="camera-controls">
        <button class="camera-switch-btn" id="switch-cam-btn" title="Switch Camera">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/><polyline points="14 12 20 12 20 6"/><polyline points="10 12 4 12 4 18"/><path d="M15 4.5A9 9 0 0 0 3 12"/><path d="M9 19.5A9 9 0 0 0 21 12"/></svg>
        </button>
        <button class="capture-btn" id="capture-btn" title="Take Photo"></button>
        <div style="width:44px;"></div>
      </div>
    </div>
  `;

    startCamera();

    document.getElementById('capture-btn')?.addEventListener('click', capturePhoto);
    document.getElementById('switch-cam-btn')?.addEventListener('click', switchCamera);
}

async function startCamera() {
    try {
        // Stop existing stream
        if (videoStream) {
            videoStream.getTracks().forEach(t => t.stop());
        }

        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
            },
            audio: false,
        });

        const video = document.getElementById('camera-feed') as HTMLVideoElement;
        if (video) {
            video.srcObject = videoStream;
        }
    } catch (err: any) {
        console.error('Camera error:', err);
        showToast('Camera access denied. Please allow camera permission.', 'error');
    }
}

function switchCamera() {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
}

async function capturePhoto() {
    const video = document.getElementById('camera-feed') as HTMLVideoElement;
    const canvas = document.getElementById('capture-canvas') as HTMLCanvasElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    // Flash effet
    const flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0.7;z-index:50;pointer-events:none;transition:opacity 0.3s;';
    document.getElementById('camera-view')?.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; }, 50);
    setTimeout(() => flash.remove(), 400);

    try {
        const blob = await canvasToBlob(canvas);
        const fileName = `photo_${Date.now()}.jpg`;
        showToast('Uploading photo...', 'info');
        const res = await uploadFile('photos', blob, fileName, 'photo');
        if (res.success) {
            showToast('Photo saved! ✨', 'success');
        } else {
            showToast(res.error || 'Upload failed', 'error');
        }
    } catch (err: any) {
        showToast('Capture failed', 'error');
    }
}

export function cleanupCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
    }
}
