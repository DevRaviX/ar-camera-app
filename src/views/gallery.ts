import { listFiles, getFileUrl, deleteFile } from '../lib/storage';
import { uploadFile } from '../lib/storage';
import { showToast, formatFileSize, formatDate } from '../lib/utils';

type FileRecord = {
  id: string;
  file_name: string;
  file_type: string;
  bucket: string;
  storage_path: string;
  file_size: number;
  created_at: string;
};

let activeTab: 'photo' | 'pdf' = 'photo';

export function renderGallery(container: HTMLElement) {
  container.innerHTML = `
    <div class="view" id="gallery-view">
      <div class="view-header">
        <h1>Gallery</h1>
        <p>Your photos & documents, synced across devices</p>
      </div>
      
      <div class="tabs">
        <button class="tab-btn ${activeTab === 'photo' ? 'active' : ''}" data-tab="photo">📸 Photos</button>
        <button class="tab-btn ${activeTab === 'pdf' ? 'active' : ''}" data-tab="pdf">📄 PDFs</button>
      </div>

      <div id="gallery-content">
        <div class="loading-overlay" style="position:relative;min-height:200px;">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Upload FAB -->
      <button class="fab" id="upload-fab" title="Upload File">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <input type="file" id="file-input" style="display:none;" />
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = (btn as HTMLElement).dataset.tab as 'photo' | 'pdf';
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadFiles();
    });
  });

  // Upload FAB
  document.getElementById('upload-fab')?.addEventListener('click', () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (activeTab === 'pdf') {
      input.accept = 'application/pdf';
    } else {
      input.accept = 'image/*';
    }
    input.click();
  });

  document.getElementById('file-input')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const bucket = file.type === 'application/pdf' ? 'documents' : 'photos';
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'photo';

    showToast(`Uploading ${file.name}...`, 'info');
    const res = await uploadFile(bucket, file, file.name, fileType as 'photo' | 'pdf');
    if (res.success) {
      showToast('File uploaded! ✨', 'success');
      loadFiles();
    } else {
      showToast(res.error || 'Upload failed', 'error');
    }
    (e.target as HTMLInputElement).value = '';
  });

  loadFiles();
}

async function loadFiles() {
  const content = document.getElementById('gallery-content');
  if (!content) return;

  content.innerHTML = `<div class="loading-overlay" style="position:relative;min-height:200px;"><div class="spinner"></div></div>`;

  const files = await listFiles(activeTab);

  if (files.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          ${activeTab === 'photo'
        ? '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'
        : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
      }
        </svg>
        <p>No ${activeTab === 'photo' ? 'photos' : 'PDFs'} yet. Tap + to upload or use the camera!</p>
      </div>
    `;
    return;
  }

  if (activeTab === 'photo') {
    renderPhotoGrid(content, files);
  } else {
    renderPDFList(content, files);
  }
}

async function renderPhotoGrid(container: HTMLElement, files: FileRecord[]) {
  container.innerHTML = '<div class="gallery-grid" id="photo-grid"></div>';
  const grid = document.getElementById('photo-grid')!;

  for (const file of files) {
    const url = await getFileUrl(file.bucket, file.storage_path);
    if (!url) continue;

    const item = document.createElement('div');
    item.className = 'gallery-item fade-in';
    item.innerHTML = `
      <img src="${url}" alt="${file.file_name}" loading="lazy" />
      <div class="overlay"></div>
    `;
    item.addEventListener('click', () => showImagePreview(url, file));
    grid.appendChild(item);
  }
}

function renderPDFList(container: HTMLElement, files: FileRecord[]) {
  container.innerHTML = '<div class="pdf-list" id="pdf-list"></div>';
  const list = document.getElementById('pdf-list')!;

  for (const file of files) {
    const item = document.createElement('div');
    item.className = 'pdf-item fade-in';
    item.innerHTML = `
      <div class="pdf-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="pdf-info">
        <div class="name">${file.file_name}</div>
        <div class="meta">${formatFileSize(file.file_size)} · ${formatDate(file.created_at)}</div>
      </div>
      <button class="btn btn-danger btn-icon" data-delete="${file.id}" title="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    `;

    // Open PDF in-app
    item.addEventListener('click', async (e) => {
      if ((e.target as HTMLElement).closest('[data-delete]')) return;
      const url = await getFileUrl(file.bucket, file.storage_path);
      if (url) showPDFViewer(url, file);
    });

    // Delete button
    item.querySelector('[data-delete]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${file.file_name}"?`)) return;
      const res = await deleteFile(file.id, file.bucket, file.storage_path);
      if (res.success) {
        showToast('File deleted', 'success');
        loadFiles();
      } else {
        showToast('Delete failed', 'error');
      }
    });

    list.appendChild(item);
  }
}

function showImagePreview(url: string, file: FileRecord) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <button class="modal-close">&times;</button>
    <img src="${url}" alt="${file.file_name}" />
    <div class="modal-actions">
      <button class="btn btn-secondary" id="preview-download">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
      <button class="btn btn-danger" id="preview-delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Delete
      </button>
    </div>
  `;

  overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Download
  overlay.querySelector('#preview-download')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    a.target = '_blank';
    a.click();
  });

  // Delete
  overlay.querySelector('#preview-delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    const res = await deleteFile(file.id, file.bucket, file.storage_path);
    if (res.success) {
      showToast('Photo deleted', 'success');
      overlay.remove();
      loadFiles();
    } else {
      showToast('Delete failed', 'error');
    }
  });

  document.body.appendChild(overlay);
}

function showPDFViewer(url: string, file: FileRecord) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.flexDirection = 'column';
  overlay.style.padding = '0';
  overlay.innerHTML = `
    <div class="pdf-viewer-header">
      <button class="modal-close" id="pdf-close">&times;</button>
      <span class="pdf-viewer-title">${file.file_name}</span>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary" id="pdf-download" style="padding:6px 12px;font-size:0.8rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Save
        </button>
        <button class="btn btn-danger" id="pdf-delete" style="padding:6px 12px;font-size:0.8rem;">
          Delete
        </button>
      </div>
    </div>
    <iframe src="${url}" class="pdf-viewer-frame" title="${file.file_name}"></iframe>
  `;

  overlay.querySelector('#pdf-close')?.addEventListener('click', () => overlay.remove());

  overlay.querySelector('#pdf-download')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    a.target = '_blank';
    a.click();
  });

  overlay.querySelector('#pdf-delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    const res = await deleteFile(file.id, file.bucket, file.storage_path);
    if (res.success) {
      showToast('PDF deleted', 'success');
      overlay.remove();
      loadFiles();
    } else {
      showToast('Delete failed', 'error');
    }
  });

  document.body.appendChild(overlay);
}
