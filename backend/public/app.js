// Visual Debugging Assistant Client-side Controller

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const urlForm = document.getElementById('urlForm');
  const targetUrlInput = document.getElementById('targetUrl');
  const openBtn = document.getElementById('openBtn');
  const statusBanner = document.getElementById('statusBanner');
  const bannerIcon = document.getElementById('bannerIcon');
  const bannerText = document.getElementById('bannerText');

  const workspaceSection = document.getElementById('workspaceSection');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const pageScreenshotImg = document.getElementById('pageScreenshotImg');
  const cropBox = document.getElementById('cropBox');
  const cropDimensions = document.getElementById('cropDimensions');
  const pageTitle = document.getElementById('pageTitle');
  const pageUrlBadge = document.getElementById('pageUrlBadge');
  const useFullPageBtn = document.getElementById('useFullPageBtn');
  const resetCropBtn = document.getElementById('resetCropBtn');

  const cropThumbnail = document.getElementById('cropThumbnail');
  const noCropPlaceholder = document.getElementById('noCropPlaceholder');
  const cropInfoBadge = document.getElementById('cropInfoBadge');
  const diagnoseForm = document.getElementById('diagnoseForm');
  const issueQuery = document.getElementById('issueQuery');
  const diagnoseBtn = document.getElementById('diagnoseBtn');

  const resultsSection = document.getElementById('resultsSection');
  const diagnosisText = document.getElementById('diagnosisText');
  const observationsList = document.getElementById('observationsList');
  const rootCauseText = document.getElementById('rootCauseText');
  const suggestedFixText = document.getElementById('suggestedFixText');
  const codeSnippetWrapper = document.getElementById('codeSnippetWrapper');
  const codeSnippetBlock = document.getElementById('codeSnippetBlock');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const antigravityPromptText = document.getElementById('antigravityPromptText');
  const copyAntigravityBtn = document.getElementById('copyAntigravityBtn');

  // State
  let currentTargetUrl = '';
  let fullPageScreenshot = '';
  let activeScreenshot = ''; // either full page or cropped base64
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentCropRect = null; // { x, y, width, height } in image coordinates

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  function showBanner(type, message) {
    statusBanner.className = `status-banner banner-${type}`;
    statusBanner.hidden = false;
    bannerText.textContent = message;

    if (type === 'error') {
      bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === 'success') {
      bannerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
      bannerIcon.innerHTML = `<div class="spinner"></div>`;
    }
  }

  function hideBanner() {
    statusBanner.hidden = true;
  }

  function setButtonLoading(button, isLoading, normalText) {
    button.disabled = isLoading;
    const textSpan = button.querySelector('.btn-text');
    const loaderSpan = button.querySelector('.btn-loader');
    if (textSpan) textSpan.textContent = isLoading ? 'Processing...' : normalText;
    if (loaderSpan) loaderSpan.hidden = !isLoading;
  }

  // -------------------------------------------------------------
  // 1. Open Target URL with Playwright
  // -------------------------------------------------------------
  urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = targetUrlInput.value.trim();
    if (!url) return;

    currentTargetUrl = url;
    showBanner('info', `Playwright is launching Chromium and rendering ${url}...`);
    setButtonLoading(openBtn, true, 'Open in Playwright');
    resultsSection.hidden = true;

    try {
      const response = await fetch('/api/open-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fullPage: false }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to open page in Playwright');
      }

      const { screenshot, title, viewport, scrollDimensions } = json.data;

      fullPageScreenshot = screenshot;
      activeScreenshot = screenshot;

      // Update UI with website information
      pageTitle.textContent = title || url;
      pageUrlBadge.textContent = url;
      pageScreenshotImg.src = screenshot;

      // Update crop preview to default (full viewport)
      cropThumbnail.src = screenshot;
      noCropPlaceholder.hidden = true;
      cropInfoBadge.textContent = `Full Viewport (${viewport.width} × ${viewport.height})`;

      // Reset any previous crop box
      resetCropSelection();

      workspaceSection.hidden = false;
      showBanner('success', `Website loaded successfully! Drag over the page to select the visual issue, or use the full screenshot.`);

      // Smooth scroll to workspace
      workspaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showBanner('error', err.message || 'Error opening website');
    } finally {
      setButtonLoading(openBtn, false, 'Open in Playwright');
    }
  });

  // Quick URL sample chips
  document.querySelectorAll('.chip-sample').forEach((chip) => {
    chip.addEventListener('click', () => {
      targetUrlInput.value = chip.dataset.url;
      urlForm.dispatchEvent(new Event('submit'));
    });
  });

  // Suggestion chips for issue query
  document.querySelectorAll('.chip-suggestion').forEach((chip) => {
    chip.addEventListener('click', () => {
      const current = issueQuery.value.trim();
      const addition = chip.dataset.text;
      issueQuery.value = current ? `${current} ${addition}` : addition;
      issueQuery.focus();
    });
  });

  // -------------------------------------------------------------
  // 2. Interactive Drag-to-Crop Tool
  // -------------------------------------------------------------
  canvasWrapper.addEventListener('mousedown', (e) => {
    if (!pageScreenshotImg.src || !pageScreenshotImg.complete) return;

    const rect = canvasWrapper.getBoundingClientRect();
    startX = e.clientX - rect.left + canvasWrapper.scrollLeft;
    startY = e.clientY - rect.top + canvasWrapper.scrollTop;

    isDragging = true;
    cropBox.hidden = false;
    updateCropBox(startX, startY, 1, 1);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = canvasWrapper.getBoundingClientRect();
    const currentX = e.clientX - rect.left + canvasWrapper.scrollLeft;
    const currentY = e.clientY - rect.top + canvasWrapper.scrollTop;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    updateCropBox(x, y, width, height);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;

    // Check if crop area is significant (at least 20x20 px)
    const boxWidth = parseInt(cropBox.style.width, 10);
    const boxHeight = parseInt(cropBox.style.height, 10);

    if (boxWidth > 20 && boxHeight > 20) {
      createCroppedScreenshot();
    } else {
      resetCropSelection();
    }
  });

  function updateCropBox(x, y, width, height) {
    cropBox.style.left = `${Math.max(0, x)}px`;
    cropBox.style.top = `${Math.max(0, y)}px`;
    cropBox.style.width = `${width}px`;
    cropBox.style.height = `${height}px`;
    cropDimensions.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
  }

  function resetCropSelection() {
    cropBox.hidden = true;
    currentCropRect = null;
    activeScreenshot = fullPageScreenshot;
    cropThumbnail.src = fullPageScreenshot;
    noCropPlaceholder.hidden = true;
    cropInfoBadge.textContent = 'Full Viewport Active';
  }

  function createCroppedScreenshot() {
    const img = pageScreenshotImg;
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    const boxX = parseFloat(cropBox.style.left) || 0;
    const boxY = parseFloat(cropBox.style.top) || 0;
    const boxWidth = parseFloat(cropBox.style.width) || 0;
    const boxHeight = parseFloat(cropBox.style.height) || 0;

    const realX = boxX * scaleX;
    const realY = boxY * scaleY;
    const realWidth = boxWidth * scaleX;
    const realHeight = boxHeight * scaleY;

    // Draw slice onto hidden canvas
    const canvas = document.createElement('canvas');
    canvas.width = realWidth;
    canvas.height = realHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      img,
      realX, realY, realWidth, realHeight,
      0, 0, realWidth, realHeight
    );

    const croppedDataUri = canvas.toDataURL('image/png');
    activeScreenshot = croppedDataUri;

    // Update thumbnail preview
    cropThumbnail.src = croppedDataUri;
    noCropPlaceholder.hidden = true;
    cropInfoBadge.textContent = `Cropped Region (${Math.round(realWidth)} × ${Math.round(realHeight)} px)`;
  }

  useFullPageBtn.addEventListener('click', () => {
    resetCropSelection();
    showBanner('info', 'Active screenshot reset to full viewport.');
  });

  resetCropBtn.addEventListener('click', () => {
    resetCropSelection();
  });

  // -------------------------------------------------------------
  // 3. Diagnose Screenshot + Query with Gemma AI
  // -------------------------------------------------------------
  diagnoseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = issueQuery.value.trim();
    if (!query) {
      alert('Please describe what visual issue is happening.');
      return;
    }

    if (!activeScreenshot) {
      alert('No screenshot available. Please open a website first.');
      return;
    }

    showBanner('info', 'Sending screenshot and query to Gemma Multimodal AI for layout diagnosis...');
    setButtonLoading(diagnoseBtn, true, 'Diagnose with Gemma AI');

    try {
      const response = await fetch('/api/diagnose-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot: activeScreenshot,
          query,
          url: currentTargetUrl || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to complete AI diagnosis');
      }

      const report = json.data;

      // Populate Results
      diagnosisText.textContent = report.diagnosis || 'Diagnosis complete.';

      // Observations
      observationsList.innerHTML = '';
      const obs = report.visualObservations || [];
      if (obs.length > 0) {
        obs.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          observationsList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'Analyzed visual boundaries, alignment, and styling elements.';
        observationsList.appendChild(li);
      }

      // Root Cause
      rootCauseText.textContent = report.rootCause || 'CSS layout model discrepancy.';

      // Fix
      suggestedFixText.textContent = report.suggestedFix || 'Apply responsive CSS constraints.';

      // Code Snippet
      if (report.codeSnippet && report.codeSnippet.trim()) {
        codeSnippetBlock.textContent = report.codeSnippet;
        codeSnippetWrapper.hidden = false;
      } else {
        codeSnippetWrapper.hidden = true;
      }

      // Antigravity Prompt
      antigravityPromptText.textContent = report.antigravityPrompt || `Fix the visual issue: ${query}`;

      resultsSection.hidden = false;
      showBanner('success', 'Gemma visual diagnosis completed! Review recommendations below.');

      // Smooth scroll down to results
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showBanner('error', err.message || 'AI diagnosis failed');
    } finally {
      setButtonLoading(diagnoseBtn, false, 'Diagnose with Gemma AI');
    }
  });

  // -------------------------------------------------------------
  // 4. Copy Actions
  // -------------------------------------------------------------
  copyAntigravityBtn.addEventListener('click', async () => {
    const text = antigravityPromptText.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const span = copyAntigravityBtn.querySelector('span');
      const original = span.textContent;
      span.textContent = 'Copied to Clipboard!';
      setTimeout(() => { span.textContent = original; }, 2000);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  });

  copyCodeBtn.addEventListener('click', async () => {
    const text = codeSnippetBlock.textContent;
    try {
      await navigator.clipboard.writeText(text);
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => { copyCodeBtn.textContent = 'Copy Code'; }, 2000);
    } catch {
      alert('Unable to copy code.');
    }
  });
});
