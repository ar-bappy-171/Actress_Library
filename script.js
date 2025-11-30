// =============================================
// CONFIGURATION & CONSTANTS
// =============================================
const ACTRESSES_INDEX = 'actresses.json';
const BASE_ACTRESS_PATH = 'images/actresses';

// Global State Variables
let searchBar, actressList, app, adminView, galleryView;
let categoryButtons = [];
let currentCategory = 'all';
let actresses = [];
let selectedActresses = new Set();
let currentViewMode = 'grid';
let searchTimeout = null;
let editingSlug = null;

// Runtime error guard to add an on-screen banner on uncaught errors
let __runtimeErrorBannerShown = false;
function showRuntimeErrorBanner(msg) {
  try {
    if (__runtimeErrorBannerShown) return;
    __runtimeErrorBannerShown = true;
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#ffefef;color:#990000;padding:12px;border:1px solid #ffcccc;position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:12000;border-radius:6px;max-width:92%;text-align:center;';
    banner.textContent = 'An unexpected error occurred: ' + (msg || 'See console for details');
    document.body.appendChild(banner);
    console.error('Runtime error shown to user:', msg);
  } catch (e) {
    console.error('Failed to show runtime error banner:', e);
  }
}

window.addEventListener('error', (e) => {
  showRuntimeErrorBanner(e.message || e.error || 'Unknown error');
});

window.addEventListener('unhandledrejection', (e) => {
  showRuntimeErrorBanner(e.reason && (e.reason.message || e.reason.toString()) || 'Unhandled promise rejection');
});

// Enhanced icon mapping for social platforms
const iconMap = {
  'official': 'fa-globe',
  'instagram': 'fa-instagram',
  'twitter': 'fa-twitter',
  'wikipedia': 'fa-wikipedia-w',
  'facebook': 'fa-facebook',
  'youtube': 'fa-youtube',
  'mega': 'fa-cloud',
  'reddit': 'fa-reddit',
  'tiktok': 'fa-tiktok',
  'onlyfans': 'fa-crown',
  'default': 'fa-link'
};

// Platform detection patterns
const platformPatterns = {
  'instagram': /instagram\.com/,
  'twitter': /twitter\.com|x\.com/,
  'youtube': /youtube\.com|youtu\.be/,
  'tiktok': /tiktok\.com/,
  'onlyfans': /onlyfans\.com/,
  'reddit': /reddit\.com/
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================

/**
 * Initialize the application when DOM is loaded
 */
function initializeApp() {
  console.log('initializeApp: start');
  showLoadingScreen();
  initializeDOMElements();
  console.log('initializeApp: DOM elements initialized');
  attachEventListeners();
  console.log('initializeApp: event listeners attached');
  loadActresses();
  console.log('initializeApp: actresses loaded');
  initializeViewToggle();
  console.log('initializeApp: view toggle initialized');
  initializeTheme();
  console.log('initializeApp: theme initialized');
  initializeBackToTop();
  console.log('initializeApp: back-to-top initialized');
  forceExternalLinksNewTab();
  console.log('initializeApp: set external links behavior');
  updateStats();
  console.log('initializeApp: stats updated');
  loadViewMode();
  console.log('initializeApp: view mode loaded');
  hideLoadingScreen();
  console.log('initializeApp: hideLoadingScreen called');
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
    loadingScreen.style.display = 'flex';
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 500);
  }
}

/**
 * Initialize DOM element references
 */
function initializeDOMElements() {
  searchBar = document.getElementById('searchBar');
  actressList = document.getElementById('actressList');
  app = document.getElementById('app');
  adminView = document.getElementById('adminView');
  galleryView = document.getElementById('galleryView');
  categoryButtons = document.querySelectorAll('.filter-tag'); // Fixed: changed from .category-btn to .filter-tag
}

// =============================================
// EVENT LISTENERS SETUP
// =============================================

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  attachCategoryFilterListeners();
  attachSearchListeners();
  attachViewModeListeners();
  attachCategoryInputListeners();
  attachQuickActionListeners();
  attachModalListeners();
  attachImageViewerListeners();
  attachKeyboardShortcuts();
  attachContextMenuListeners();
  attachAdminPanelListeners();
  attachFormListeners();
  attachManageListeners();
  attachImportExportListeners();
  attachSettingsListeners();
}

/**
 * Attach category filter event listeners
 */
function attachCategoryFilterListeners() {
  categoryButtons.forEach(button => {
    button.addEventListener('click', handleCategoryChange);
  });
}

/**
 * Attach search functionality listeners
 */
function attachSearchListeners() {
  if (searchBar) {
    searchBar.addEventListener('input', handleSearch);
    searchBar.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchBar.value = '';
        displayActresses(filterActresses('', currentCategory));
        updateSearchResultsCount();
      }
    });
  }
}

/**
 * Attach view mode toggle listeners
 */
function attachViewModeListeners() {
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', handleViewModeChange);
  });
}

/**
 * Attach category input functionality listeners
 */
function attachCategoryInputListeners() {
  const categoryInput = document.getElementById('actressCategory');
  if (categoryInput) {
    categoryInput.addEventListener('input', handleCategoryInput);
    categoryInput.addEventListener('keydown', handleCategoryInput);
    categoryInput.addEventListener('focus', showCategorySuggestions);
    categoryInput.addEventListener('blur', () => {
      setTimeout(hideCategorySuggestions, 200);
    });
  }
}

/**
 * Attach quick action button listeners
 */
function attachQuickActionListeners() {
  const quickAddBtn = document.getElementById('quickAdd');
  if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);

  const batchActionsBtn = document.getElementById('batchActions');
  if (batchActionsBtn) batchActionsBtn.addEventListener('click', openBatchActions);

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);
}

/**
 * Attach modal functionality listeners
 */
function attachModalListeners() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    if (btn) btn.addEventListener('click', closeModals);
  });

  document.getElementById('quickAddModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModals();
  });

  // Quick add tabs
  document.querySelectorAll('.quick-add-tabs .tab-btn').forEach(btn => {
    if (btn) btn.addEventListener('click', (e) => {
      switchQuickAddTab(e.target.dataset.tab);
    });
  });
}

/**
 * Attach image viewer listeners
 */
function attachImageViewerListeners() {
  const imageViewer = document.getElementById('imageViewer');
  if (imageViewer) {
    imageViewer.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModals();
    });
  }

  const viewerClose = document.querySelector('.image-viewer-close');
  if (viewerClose) viewerClose.addEventListener('click', closeModals);

  const prevBtn = document.querySelector('.image-nav.prev');
  if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);

  const nextBtn = document.querySelector('.image-nav.next');
  if (nextBtn) nextBtn.addEventListener('click', showNextImage);
}

/**
 * Attach keyboard shortcut listeners
 */
function attachKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Attach context menu listeners
 */
function attachContextMenuListeners() {
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('click', () => {
    hideContextMenu();
  });
}

/**
 * Attach admin panel functionality listeners
 */
function attachAdminPanelListeners() {
  document.getElementById('adminToggle').addEventListener('click', openAdminPanel);
  document.getElementById('closeAdmin').addEventListener('click', closeAdminPanel);
  
  // Admin tabs
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });
}

/**
 * Attach form-related listeners
 */
function attachFormListeners() {
  // Add actress form
  const addActressForm = document.getElementById('addActressForm');
  if (addActressForm) {
    // Disable native HTML validation so our JS handles validation (prevents silent blocking)
    addActressForm.noValidate = true;
    addActressForm.addEventListener('submit', handleAddActress);
  }
  
  const addWebsiteBtn = document.getElementById('addWebsite');
  if (addWebsiteBtn) addWebsiteBtn.addEventListener('click', addWebsiteField);

  const clearFormBtn = document.getElementById('clearForm');
  if (clearFormBtn) clearFormBtn.addEventListener('click', clearForm);

  const saveTemplateBtn = document.getElementById('saveTemplate');
  if (saveTemplateBtn) saveTemplateBtn.addEventListener('click', saveTemplate);
  
  // Image source tabs
  document.querySelectorAll('.source-tab').forEach(tab => {
    if (tab) tab.addEventListener('click', (e) => {
      switchImageSource(e.target.dataset.source);
    });
  });

  // Reset form when switching away from add tab
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.dataset.tab !== 'add' && editingSlug) {
        resetForm();
        showToast('Edit cancelled', 'info');
      }
    });
  });

  // Reset form when closing admin panel
  document.getElementById('closeAdmin').addEventListener('click', () => {
    if (editingSlug) {
      resetForm();
    }
  });

  // Image URL preview
  const previewThumbBtn = document.getElementById('previewThumb');
  if (previewThumbBtn) previewThumbBtn.addEventListener('click', previewThumbFromUrl);

  const thumbUrlInput = document.getElementById('thumbUrl');
  if (thumbUrlInput) thumbUrlInput.addEventListener('blur', previewThumbFromUrl);
  
  // Tags functionality
  const tagsInput = document.getElementById('actressTags');
  if (tagsInput) tagsInput.addEventListener('keydown', handleTagInput);
}

/**
 * Attach manage functionality listeners
 */
function attachManageListeners() {
  const manageSearch = document.getElementById('manageSearch');
  if (manageSearch) manageSearch.addEventListener('input', handleManageSearch);

  const refreshListBtn = document.getElementById('refreshList');
  if (refreshListBtn) refreshListBtn.addEventListener('click', loadManageList);

  const applyBatchBtn = document.getElementById('applyBatch');
  if (applyBatchBtn) applyBatchBtn.addEventListener('click', applyBatchAction);
}

/**
 * Attach import/export functionality listeners
 */
function attachImportExportListeners() {
  const exportJSONBtn = document.getElementById('exportJSON');
  if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportData);

  const exportCSVBtn = document.getElementById('exportCSV');
  if (exportCSVBtn) exportCSVBtn.addEventListener('click', exportCSV);

  const exportPDFBtn = document.getElementById('exportPDF');
  if (exportPDFBtn) exportPDFBtn.addEventListener('click', exportPDF);

  const importDataBtn = document.getElementById('importData');
  if (importDataBtn) importDataBtn.addEventListener('click', importData);

  const importSource = document.getElementById('importSource');
  if (importSource) importSource.addEventListener('change', handleImportSourceChange);

  const clearAllDataBtn = document.getElementById('clearAllData');
  if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', clearAllData);
}

/**
 * Attach settings listeners
 */
function attachSettingsListeners() {
  const themeSetting = document.getElementById('themeSetting');
  if (themeSetting) themeSetting.addEventListener('change', updateThemeSetting);

  const cardSizeSelect = document.getElementById('cardSize');
  if (cardSizeSelect) cardSizeSelect.addEventListener('change', updateCardSize);
}

// =============================================
// NOTIFICATION SYSTEM
// =============================================

/**
 * Enhanced Toast notification system
 */
function showToast(message, type = 'info', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  // Check if notifications are enabled
  const notificationsEnabled = localStorage.getItem('toastNotifications') !== 'false';
  if (!notificationsEnabled) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' :
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }, duration);
}

// =============================================
// VIEW MODE MANAGEMENT
// =============================================

/**
 * Update the handleViewModeChange function to sync with header icon
 */
function handleViewModeChange() {
  // Remove active class from all buttons
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  this.classList.add('active');
  
  // Get the view mode
  currentViewMode = this.dataset.view;
  
  // Save to localStorage
  localStorage.setItem('viewMode', currentViewMode);
  
  // Update header icon
  updateViewToggleIcon();
  
  // Update the gallery view
  updateGalleryView();
  
  showToast(`Switched to ${currentViewMode} view`, 'info', 2000);
}


/**
 * Update gallery view based on current mode
 */
function updateGalleryView() {
  // Remove all view classes
  galleryView.classList.remove('view-grid', 'view-masonry', 'view-list', 'view-slideshow');
  
  // Add current view class
  galleryView.classList.add(`view-${currentViewMode}`);
  
  // Refresh the display
  displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
}

// =============================================
// VIEW TOGGLE FUNCTIONALITY - ADD THESE FUNCTIONS
// =============================================

/**
 * Initialize view toggle functionality
 */
function initializeViewToggle() {
  const viewToggle = document.getElementById('viewToggle');
  if (viewToggle) {
    viewToggle.addEventListener('click', toggleViewMode);
    updateViewToggleIcon(); // Set initial icon
  }
}

/**
 * Load view mode from localStorage and update UI
 */
function loadViewMode() {
  const saved = localStorage.getItem('viewMode');
  const validModes = ['grid', 'masonry', 'list', 'slideshow'];
  if (saved && validModes.includes(saved)) {
    currentViewMode = saved;
  }
  updateViewToggleIcon();
  updateViewModeButtons();
  if (galleryView) {
    galleryView.classList.remove('view-grid', 'view-masonry', 'view-list', 'view-slideshow');
    galleryView.classList.add(`view-${currentViewMode}`);
  }
}

/**
 * Toggle view mode via header icon - cycles through all view modes
 */
function toggleViewMode() {
  // Cycle through view modes: grid -> masonry -> list -> slideshow -> grid
  const viewModes = ['grid', 'masonry', 'list', 'slideshow'];
  const currentIndex = viewModes.indexOf(currentViewMode);
  const nextIndex = (currentIndex + 1) % viewModes.length;
  const nextViewMode = viewModes[nextIndex];
  
  // Update view mode
  currentViewMode = nextViewMode;
  localStorage.setItem('viewMode', currentViewMode);
  
  // Update the view toggle icon
  updateViewToggleIcon();
  
  // Update the active button in view mode container (if it exists)
  updateViewModeButtons();
  
  // Update the gallery view
  updateGalleryView();
  
  showToast(`Switched to ${currentViewMode} view`, 'info', 2000);
}

/**
 * Update view toggle icon based on current view mode
 */
function updateViewToggleIcon() {
  const viewToggle = document.getElementById('viewToggle');
  if (!viewToggle) return;
  
  const icons = {
    'grid': 'fa-th',
    'masonry': 'fa-th-large', 
    'list': 'fa-list',
    'slideshow': 'fa-play'
  };
  
  const iconClass = icons[currentViewMode] || 'fa-th';
  viewToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
  
  // Update tooltip
  viewToggle.title = `${currentViewMode.charAt(0).toUpperCase() + currentViewMode.slice(1)} View`;
}

/**
 * Update view mode buttons to reflect current state
 */
function updateViewModeButtons() {
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.view === currentViewMode) {
      btn.classList.add('active');
    }
  });
}


// =============================================
// MODAL MANAGEMENT
// =============================================

/**
 * Open quick add modal
 */
function openQuickAddModal() {
  document.getElementById('quickAddModal').classList.add('active');
}

/**
 * Switch between quick add tabs
 */
function switchQuickAddTab(tabName) {
  document.querySelectorAll('.quick-add-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  document.querySelectorAll('#quickAddModal .tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`quickAdd${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
}

/**
 * Close all modals
 */
function closeModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// =============================================
// IMAGE VIEWER FUNCTIONALITY
// =============================================

let currentImageIndex = 0;
let currentActressImages = [];

/**
 * Open image viewer
 */
function openImageViewer(actress, imageIndex = 0) {
  currentActressImages = actress.gallery;
  currentImageIndex = imageIndex;
  
  const modal = document.getElementById('imageViewer');
  const img = document.getElementById('viewerImage');
  const name = document.getElementById('imageActressName');
  const index = document.getElementById('imageIndex');
  
  if (currentActressImages.length > 0) {
    img.src = currentActressImages[imageIndex];
    name.textContent = actress.name;
    index.textContent = `${imageIndex + 1} / ${currentActressImages.length}`;
    
    modal.classList.add('active');
    
    // Track view
    trackView(actress.slug);
  }
}

/**
 * Show previous image in viewer
 */
function showPreviousImage() {
  if (currentActressImages.length === 0) return;
  
  currentImageIndex = (currentImageIndex - 1 + currentActressImages.length) % currentActressImages.length;
  updateImageViewer();
}

/**
 * Show next image in viewer
 */
function showNextImage() {
  if (currentActressImages.length === 0) return;
  
  currentImageIndex = (currentImageIndex + 1) % currentActressImages.length;
  updateImageViewer();
}

/**
 * Update image viewer display
 */
function updateImageViewer() {
  const img = document.getElementById('viewerImage');
  const index = document.getElementById('imageIndex');
  
  img.src = currentActressImages[currentImageIndex];
  index.textContent = `${currentImageIndex + 1} / ${currentActressImages.length}`;
}

// =============================================
// CONTEXT MENU FUNCTIONALITY
// =============================================

/**
 * Handle context menu display
 */
function handleContextMenu(e) {
  const card = e.target.closest('.card');
  if (card) {
    e.preventDefault();
    
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    contextMenu.classList.add('active');
    
    // Store the target actress slug
    const actressName = card.querySelector('.name').textContent;
    const actress = actresses.find(a => a.name === actressName);
    if (actress) {
      contextMenu.dataset.actressSlug = actress.slug;
    }
  }
}

/**
 * Hide context menu
 */
function hideContextMenu() {
  document.getElementById('contextMenu').classList.remove('active');
}

// Attach context menu actions
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const slug = document.getElementById('contextMenu').dataset.actressSlug;
      const actress = actresses.find(a => a.slug === slug);
      
      if (actress) {
        switch (action) {
          case 'view':
            openGallery(actress);
            break;
          case 'edit':
            editActress(actress.slug);
            break;
          case 'favorite':
            toggleFavorite(actress.slug);
            break;
          case 'share':
            shareActress(actress);
            break;
          case 'delete':
            deleteActress(actress.slug);
            break;
        }
      }
      
      hideContextMenu();
    });
  });
});

// =============================================
// KEYBOARD SHORTCUTS
// =============================================

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'k':
        e.preventDefault();
        if (searchBar) searchBar.focus();
        break;
      case 'n':
        e.preventDefault();
        if (adminView.style.display === 'none') {
          openAdminPanel();
        }
        switchTab('add');
        break;
      case 'e':
        e.preventDefault();
        exportData();
        break;
    }
  }
  
  if (e.key === 'Escape') {
    if (adminView.style.display !== 'none') {
      closeAdminPanel();
    }
    closeModals();
    hideContextMenu();
  }
  
  // Image viewer navigation
  if (document.getElementById('imageViewer').classList.contains('active')) {
    switch (e.key) {
      case 'ArrowLeft':
        showPreviousImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
    }
  }
}

// =============================================
// STATS & SEARCH FUNCTIONALITY
// =============================================

/**
 * Update statistics display
 */
function updateStats() {
  const totalActresses = document.getElementById('totalActresses');
  const totalPhotos = document.getElementById('totalPhotos');
  const totalLinks = document.getElementById('totalLinks');
  const totalViews = document.getElementById('totalViews');
  
  if (totalActresses) {
    totalActresses.textContent = actresses.length;
  }
  
  if (totalPhotos) {
    const photoCount = actresses.reduce((sum, actress) => sum + actress.gallery.length, 0);
    totalPhotos.textContent = photoCount;
  }
  
  if (totalLinks) {
    const linkCount = actresses.reduce((sum, actress) => sum + actress.websites.length, 0);
    totalLinks.textContent = linkCount;
  }
  
  if (totalViews) {
    const viewCount = actresses.reduce((sum, actress) => sum + (actress.views || 0), 0);
    totalViews.textContent = viewCount;
  }
}

/**
 * Update search results count display
 */
function updateSearchResultsCount(filteredActresses = null) {
  const searchResultsCount = document.getElementById('searchResultsCount');
  const searchTime = document.getElementById('searchTime');
  
  if (!searchResultsCount) return;

  if (filteredActresses === null) {
    filteredActresses = filterActresses(searchBar ? searchBar.value : '', currentCategory);
  }

  const total = actresses.length;
  const showing = filteredActresses.length;
  
  if (showing === total) {
    searchResultsCount.textContent = `Showing all ${total} actresses`;
  } else {
    searchResultsCount.textContent = `Showing ${showing} of ${total} actresses`;
  }
  
  // Show search time for non-trivial searches
  if (searchBar && searchBar.value.trim() && searchTimeout) {
    const searchDuration = Date.now() - searchTimeout;
    searchTime.textContent = `in ${searchDuration}ms`;
  } else {
    searchTime.textContent = '';
  }
}

// =============================================
// FILTERING & SORTING
// =============================================

/**
 * Handle category filter change
 */
function handleCategoryChange() {
  categoryButtons.forEach(btn => btn.classList.remove('active'));
  this.classList.add('active');
  currentCategory = this.dataset.category;
  const filtered = filterActresses(searchBar ? searchBar.value : '', currentCategory);
  displayActresses(filtered);
  updateSearchResultsCount(filtered);
}

/**
 * Handle sort option change
 */
function handleSortChange() {
  const sortBy = document.getElementById('sortBy').value;
  displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  if (searchBar) searchBar.value = '';
  document.getElementById('sortBy').value = 'name';
  categoryButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-category="all"]').classList.add('active');
  currentCategory = 'all';
  
  displayActresses(filterActresses('', 'all'));
  updateSearchResultsCount();
  showToast('All filters cleared', 'info', 2000);
}

/**
 * Enhanced Search with debouncing
 */
function handleSearch(e) {
  const query = e.target.value;
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Set new timeout for debouncing
  searchTimeout = setTimeout(() => {
    const filtered = filterActresses(query, currentCategory);
    displayActresses(filtered);
    updateSearchResultsCount(filtered);
    searchTimeout = null;
  }, 300);
}

/**
 * Filter actresses based on query and category
 */
function filterActresses(query, category) {
  let filtered = actresses;
  
  if (category !== 'all') {
    filtered = filtered.filter(a => a.category === category);
  }
  
  const q = String(query || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.tags && a.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }
  
  return filtered;
}

/**
 * Sort actresses based on criteria
 */
function sortActresses(list, sortBy) {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'photos':
        return b.gallery.length - a.gallery.length;
      case 'links':
        return b.websites.length - a.websites.length;
      default: // 'name'
        return a.name.localeCompare(b.name);
    }
  });
}

// =============================================
// BATCH ACTIONS
// =============================================

/**
 * Open batch actions
 */
function openBatchActions() {
  selectedActresses.clear();
  loadManageList();
  switchTab('manage');
  showToast('Select actresses for batch actions', 'info');
}

/**
 * Apply batch action to selected actresses
 */
function applyBatchAction() {
  const action = document.getElementById('batchAction').value;
  if (!action) {
    showToast('Please select a batch action', 'error');
    return;
  }
  
  if (selectedActresses.size === 0) {
    showToast('No actresses selected', 'error');
    return;
  }
  
  switch (action) {
    case 'delete':
      if (confirm(`Delete ${selectedActresses.size} selected actresses?`)) {
        selectedActresses.forEach(slug => {
          actresses = actresses.filter(a => a.slug !== slug);
        });
        saveActresses();
        loadManageList();
        displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
        updateStats();
        showToast(`Deleted ${selectedActresses.size} actresses`, 'success');
        selectedActresses.clear();
      }
      break;
    case 'category':
      const newCategory = prompt('Enter new category:');
      if (newCategory) {
        selectedActresses.forEach(slug => {
          const actress = actresses.find(a => a.slug === slug);
          if (actress) actress.category = newCategory;
        });
        saveActresses();
        loadManageList();
        showToast(`Updated category for ${selectedActresses.size} actresses`, 'success');
        selectedActresses.clear();
      }
      break;
  }
}

// =============================================
// VIEW TRACKING
// =============================================

/**
 * Track view count for actress
 */
function trackView(slug) {
  const actress = actresses.find(a => a.slug === slug);
  if (actress) {
    actress.views = (actress.views || 0) + 1;
    actress.lastViewed = new Date().toISOString();
    saveActresses();
    updateStats();
  }
}

// =============================================
// TAG MANAGEMENT
// =============================================

/**
 * Handle tag input
 */
function handleTagInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const tagInput = document.getElementById('actressTags');
    const tag = tagInput.value.trim().replace(',', '');
    
    if (tag) {
      addTag(tag);
      tagInput.value = '';
    }
  }
}

/**
 * Add tag to tags container
 */
function addTag(tag) {
  const tagsContainer = document.getElementById('tagsContainer');
  const tagElement = document.createElement('div');
  tagElement.className = 'tag';
  tagElement.innerHTML = `
    ${tag}
    <button class="tag-remove" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  tagsContainer.appendChild(tagElement);
}

/**
 * Get all tags from tags container
 */
function getTags() {
  const tags = [];
  document.querySelectorAll('#tagsContainer .tag').forEach(tag => {
    tags.push(tag.textContent.trim());
  });
  return tags;
}

// =============================================
// IMAGE SOURCE MANAGEMENT
// =============================================

/**
 * Switch between image source tabs
 */
function switchImageSource(source) {
  document.querySelectorAll('.source-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-source="${source}"]`).classList.add('active');

  document.querySelectorAll('.source-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`image${source.charAt(0).toUpperCase() + source.slice(1)}Source`).classList.add('active');
}

/**
 * Preview thumbnail from URL
 */
function previewThumbFromUrl() {
  const url = document.getElementById('thumbUrl').value;
  const preview = document.getElementById('thumbPreview');
  
  if (url) {
    preview.innerHTML = `<img src="${url}" class="preview-image" alt="Thumbnail preview" onerror="this.style.display='none'">`;
  } else {
    preview.innerHTML = '';
  }
}

// =============================================
// FORM HANDLING - FIXED VERSION
// =============================================

/**
 * Handle add actress form submission - FIXED VERSION
 */
async function handleAddActress(event) {
  event.preventDefault();
  console.log('Form submission started... Editing slug:', editingSlug);
  
  const name = document.getElementById('actressName').value.trim();
  const category = document.getElementById('actressCategory').value;
  const thumbUrl = document.getElementById('thumbUrl').value;
  
  // Basic validation
  if (!name) {
    showToast('Please enter actress name', 'error');
    return;
  }
  
  if (!category) {
    showToast('Please select a category', 'error');
    return;
  }
  
  try {
    // Generate slug from name (for new entries)
    const slug = editingSlug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check for duplicates (only when adding new, not editing)
    if (!editingSlug) {
      const existingActress = actresses.find(a => a.slug === slug);
      if (existingActress) {
        showToast(`Actress "${name}" already exists`, 'error');
        return;
      }
    }
    
    // Create actress data object
    const actressData = {
      slug: slug,
      name: name,
      category: category,
      tags: getTags(),
      websites: safeGetWebsiteData(),
      gallery: safeGetGalleryUrls(),
      thumb: thumbUrl || 'https://via.placeholder.com/300x240/374151/9ca3af?text=No+Image',
      views: editingSlug ? (actresses.find(a => a.slug === editingSlug)?.views || 0) : 0,
      createdAt: editingSlug ? (actresses.find(a => a.slug === editingSlug)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      lastViewed: editingSlug ? (actresses.find(a => a.slug === editingSlug)?.lastViewed || null) : null
    };
    
    console.log('Prepared actress data for save:', actressData);
    
    if (editingSlug) {
      // Update existing actress
      const index = actresses.findIndex(a => a.slug === editingSlug);
      if (index !== -1) {
        console.log('Updating actress at index:', index);
        actresses[index] = actressData;
        showToast(`Actress "${name}" updated successfully!`, 'success');
      } else {
        showToast('Error: Actress not found for editing', 'error');
        return;
      }
    } else {
      // Add new actress
      actresses.push(actressData);
      showToast(`Actress "${name}" added successfully!`, 'success');
    }
    
    // Save to storage
    saveActresses();
    
    // Reset form and editing state
    editingSlug = null;
    resetForm();
    
    // Refresh UI
    if (adminView.style.display !== 'none') {
      switchTab('manage');
      loadManageList();
    }
    
    displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
    updateStats();
    updateSearchResultsCount();
    
  } catch (error) {
    console.error('Error saving actress:', error);
    showToast('Error saving actress data: ' + error.message, 'error');
  }
}

/**
 * Get website data from form
 */
function getWebsiteData() {
  const websites = [];
  const websiteNames = document.querySelectorAll('input[name="websiteName[]"]');
  const websiteUrls = document.querySelectorAll('input[name="websiteUrl[]"]');
  const websitePictures = document.querySelectorAll('input[name="websitePicture[]"]');
  const websiteTypes = document.querySelectorAll('select[name="websiteType[]"]');

  for (let i = 0; i < websiteNames.length; i++) {
    if (websiteNames[i].value && websiteUrls[i].value) {
      websites.push({
        name: websiteNames[i].value.trim(),
        url: websiteUrls[i].value.trim(),
        picture: websitePictures[i].value.trim(),
        type: websiteTypes[i].value
      });
    }
  }
  return websites;
}

// Safe wrapper for retrieving website data to avoid uncaught errors during update
function safeGetWebsiteData() {
  try {
    return getWebsiteData();
  } catch (err) {
    console.warn('safeGetWebsiteData caught error:', err);
    return [];
  }
}

/**
 * Get gallery URLs from form
 */
function getGalleryUrls() {
  const galleryUrls = document.getElementById('galleryUrls');
  return galleryUrls && galleryUrls.value ? 
    galleryUrls.value.split('\n').filter(url => url.trim()) : [];
}

// Safe wrapper for retrieving gallery URLs
function safeGetGalleryUrls() {
  try {
    return getGalleryUrls();
  } catch (err) {
    console.warn('safeGetGalleryUrls caught error:', err);
    return [];
  }
}

/**
 * Add website field to form
 */
function addWebsiteField() {
  const websiteLinks = document.getElementById('websiteLinks');
  const websiteId = Date.now();
  
  const websiteHtml = `
  <div class="website-link" data-id="${websiteId}">
    <div class="website-link-header">
      <h4>Website Link</h4>
      <button type="button" class="remove-website" onclick="removeWebsiteField(${websiteId})">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex: 1;">
        <label>Website Name</label>
        <input type="text" name="websiteName[]" placeholder="e.g., Instagram" required>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Website URL</label>
        <input type="url" name="websiteUrl[]" placeholder="https://..." required>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Picture URL (Optional)</label>
        <input type="url" name="websitePicture[]" placeholder="https://image-url.jpg">
        <small>URL for link preview image</small>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Type</label>
        <select name="websiteType[]">
          <option value="official">Official</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
          <option value="wikipedia">Wikipedia</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="mega">MEGA</option>
          <option value="reddit">Reddit</option>
          <option value="default">Other</option>
        </select>
      </div>
    </div>
  </div>
`;
  
  websiteLinks.insertAdjacentHTML('beforeend', websiteHtml);
}

/**
 * Remove website field from form
 */
function removeWebsiteField(id) {
  const element = document.querySelector(`[data-id="${id}"]`);
  if (element) {
    element.remove();
  }
}

/**
 * Reset form to initial state - IMPROVED VERSION
 */
function resetForm() {
  const form = document.getElementById('addActressForm');
  if (form) {
    form.reset();
  }
  
  const thumbPreview = document.getElementById('thumbPreview');
  const galleryPreview = document.getElementById('galleryPreview');
  const websiteLinks = document.getElementById('websiteLinks');
  const tagsContainer = document.getElementById('tagsContainer');
  
  if (thumbPreview) thumbPreview.innerHTML = '';
  if (galleryPreview) galleryPreview.innerHTML = '';
  if (websiteLinks) websiteLinks.innerHTML = '';
  if (tagsContainer) tagsContainer.innerHTML = '';
  
  // Only reset to "Add" mode if we're not currently editing
  if (!editingSlug) {
    resetFormToAddMode();
  }
}

/**
 * Reset form UI to "Add" mode
 */
function resetFormToAddMode() {
  const tabTitle = document.querySelector('#addTab h3');
  const submitButton = document.querySelector('#addTab .btn.primary');
  
  if (tabTitle) {
    tabTitle.innerHTML = '<i class="fas fa-plus"></i> Add New Actress';
  }
  
  if (submitButton) {
    submitButton.innerHTML = '<i class="fas fa-plus-circle"></i> Add Actress';
  }
}

/**
 * Clear form with notification
 */
function clearForm() {
  resetForm();
  showToast('Form cleared', 'info', 2000);
}

// =============================================
// TEMPLATE SYSTEM
// =============================================

/**
 * Save form as template
 */
function saveTemplate() {
  const formData = new FormData(document.getElementById('addActressForm'));
  const template = {
    name: document.getElementById('actressName').value,
    category: document.getElementById('actressCategory').value,
    tags: getTags(),
    websites: []
  };
  
  // Save website templates
  const websiteNames = document.querySelectorAll('input[name="websiteName[]"]');
  const websiteUrls = document.querySelectorAll('input[name="websiteUrl[]"]');
  const websiteTypes = document.querySelectorAll('select[name="websiteType[]"]');
  
  for (let i = 0; i < websiteNames.length; i++) {
    if (websiteNames[i].value && websiteUrls[i].value) {
      template.websites.push({
        name: websiteNames[i].value,
        url: websiteUrls[i].value,
        type: websiteTypes[i].value
      });
    }
  }
  
  const templates = JSON.parse(localStorage.getItem('actressTemplates') || '[]');
  templates.push(template);
  localStorage.setItem('actressTemplates', JSON.stringify(templates));
  
  showToast('Template saved successfully', 'success');
}

// =============================================
// ADMIN PANEL MANAGEMENT
// =============================================

/**
 * Open admin panel
 */
function openAdminPanel() {
  console.log('Opening admin panel...');
  
  // Hide the main gallery view
  const galleryView = document.getElementById('galleryView');
  const adminView = document.getElementById('adminView');
  const viewModeContainer = document.querySelector('.view-mode-container');
  
  if (galleryView) galleryView.style.display = 'none';
  if (viewModeContainer) viewModeContainer.style.display = 'none';
  if (adminView) {
    adminView.style.display = 'block';
    adminView.style.opacity = '1';
  }
  
  loadManageList();
  showToast('Admin panel opened', 'info', 2000);
}

/**
 * Close admin panel - UPDATED VERSION
 */
function closeAdminPanel() {
  console.log('Closing admin panel...');
  
  // Show the main gallery view
  const galleryView = document.getElementById('galleryView');
  const adminView = document.getElementById('adminView');
  const viewModeContainer = document.querySelector('.view-mode-container');
  
  if (adminView) adminView.style.display = 'none';
  if (viewModeContainer) viewModeContainer.style.display = 'block';
  if (galleryView) {
    galleryView.style.display = 'block';
    galleryView.style.opacity = '1';
  }
  
  // Reset form if editing
  if (editingSlug) {
    resetForm();
    showToast('Edit cancelled', 'info');
  }
  
  showToast('Admin panel closed', 'info', 2000);
}

/**
 * Switch between admin tabs
 */
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// =============================================
// MANAGE ACTRESSES FUNCTIONALITY
// =============================================

/**
 * Load manage list with search filtering
 */
function loadManageList() {
  const manageList = document.getElementById('manageList');
  const searchTerm = document.getElementById('manageSearch').value.toLowerCase();
  
  console.log('Loading manage list, total actresses:', actresses.length);
  
  let filteredActresses = actresses;
  if (searchTerm) {
    filteredActresses = actresses.filter(actress => 
      actress.name.toLowerCase().includes(searchTerm) ||
      actress.category.toLowerCase().includes(searchTerm) ||
      (actress.tags && actress.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }
  
  console.log('Filtered actresses for manage list:', filteredActresses.length);
  
  if (filteredActresses.length === 0) {
    manageList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px;"></i>
        <h3>No actresses found</h3>
        <p>Try adjusting your search terms</p>
      </div>
    `;
    return;
  }
  
  manageList.innerHTML = filteredActresses.map(actress => {
    console.log('Generating manage item for:', actress.name, 'Slug:', actress.slug);
    
    return `
    <div class="manage-item ${selectedActresses.has(actress.slug) ? 'selected' : ''}">
      <div class="manage-item-info">
        <input type="checkbox" class="manage-item-checkbox" ${selectedActresses.has(actress.slug) ? 'checked' : ''} 
               onchange="toggleActressSelection('${actress.slug}', this.checked)">
        <img src="${actress.thumb}" alt="${actress.name}" class="manage-item-thumb" 
             onerror="this.src='https://via.placeholder.com/60x60/374151/9ca3af?text=No+Image'">
        <div class="manage-item-details">
          <h4>${actress.name}</h4>
          <div class="category">${actress.category}</div>
          <div class="small-muted">
            ${actress.gallery.length} photos • ${actress.websites.length} links • ${actress.views || 0} views
          </div>
          <div class="small-muted">
            Added: ${new Date(actress.createdAt).toLocaleDateString()}
            ${actress.lastViewed ? ` • Last viewed: ${new Date(actress.lastViewed).toLocaleDateString()}` : ''}
          </div>
          ${actress.tags && actress.tags.length > 0 ? `
            <div class="tags-small">
              ${actress.tags.map(tag => `<span class="tag-small">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      <div class="manage-item-actions">
        <button class="btn warning" onclick="editActress('${actress.slug}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn danger" onclick="deleteActress('${actress.slug}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `}).join('');
  
  console.log('Manage list loaded successfully');
}

/**
 * Toggle actress selection for batch actions
 */
function toggleActressSelection(slug, selected) {
  if (selected) {
    selectedActresses.add(slug);
  } else {
    selectedActresses.delete(slug);
  }
  loadManageList(); // Refresh to update visual state
}

/**
 * Handle manage search input
 */
function handleManageSearch(event) {
  loadManageList();
}

/**
 * Edit actress - open form with existing data - FIXED VERSION
 */
function editActress(slug) {
  console.log('=== EDIT ACTRESS DEBUG ===');
  console.log('Looking for slug:', slug);
  
  // Find the actress
  let actress = actresses.find(a => a.slug === slug);
  
  if (!actress) {
    console.error('Actress not found with slug:', slug);
    showToast('Error: Actress data not found', 'error');
    return;
  }

  console.log('Found actress:', actress.name);
  
  // Store which actress we're editing
  editingSlug = actress.slug;
  console.log('Editing slug set to:', editingSlug);
  
  // Ensure admin panel is open and on add tab
  const adminView = document.getElementById('adminView');
  if (adminView.style.display === 'none') {
    openAdminPanel();
  }
  
  // Switch to add tab and populate form
  switchTab('add');
  
  // Wait for tab to be visible, then populate form
  setTimeout(() => {
    populateFormForEditing(actress);
  }, 100);
}

/**
 * Populate form for editing - SIMPLIFIED AND FIXED VERSION
 */
function populateFormForEditing(actress) {
  console.log('Populating form for editing:', actress.name);
  
  // Update UI to show edit mode
  const tabTitle = document.querySelector('#addTab h3');
  const submitButton = document.querySelector('#addTab .btn.primary');
  
  if (tabTitle) {
    tabTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Actress';
  }
  
  if (submitButton) {
    submitButton.innerHTML = '<i class="fas fa-save"></i> Update Actress';
  }
  
  // Clear form first (but preserve editingSlug)
  const currentEditingSlug = editingSlug;
  resetForm();
  editingSlug = currentEditingSlug;
  
  // Now populate form fields directly
  setTimeout(() => {
    // Basic fields
    document.getElementById('actressName').value = actress.name || '';
    document.getElementById('actressCategory').value = actress.category || 'worldwide';
    document.getElementById('thumbUrl').value = actress.thumb || '';
    
    // Tags
    const tagsContainer = document.getElementById('tagsContainer');
    if (tagsContainer && actress.tags) {
      tagsContainer.innerHTML = '';
      actress.tags.forEach(tag => addTag(tag));
    }
    
    // Gallery URLs
    const galleryUrls = document.getElementById('galleryUrls');
    if (galleryUrls && actress.gallery) {
      galleryUrls.value = actress.gallery.join('\n');
    }
    
    // Website links - clear existing first
    const websiteLinks = document.getElementById('websiteLinks');
    if (websiteLinks) {
      websiteLinks.innerHTML = '';
      
      // Add website fields one by one
      if (actress.websites && actress.websites.length > 0) {
        actress.websites.forEach((website) => {
          // Create website field HTML directly
          const websiteId = Date.now();
          const websiteHtml = `
            <div class="website-link" data-id="${websiteId}">
              <div class="website-link-header">
                <h4>Website Link</h4>
                <button type="button" class="remove-website" onclick="removeWebsiteField(${websiteId})">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Website Name</label>
                  <input type="text" name="websiteName[]" value="${website.name || ''}" placeholder="e.g., Instagram" required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Website URL</label>
                  <input type="url" name="websiteUrl[]" value="${website.url || ''}" placeholder="https://..." required>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Picture URL (Optional)</label>
                  <input type="url" name="websitePicture[]" value="${website.picture || ''}" placeholder="https://image-url.jpg">
                  <small>URL for link preview image</small>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Type</label>
                  <select name="websiteType[]">
                    <option value="official" ${website.type === 'official' ? 'selected' : ''}>Official</option>
                    <option value="instagram" ${website.type === 'instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="twitter" ${website.type === 'twitter' ? 'selected' : ''}>Twitter</option>
                    <option value="wikipedia" ${website.type === 'wikipedia' ? 'selected' : ''}>Wikipedia</option>
                    <option value="facebook" ${website.type === 'facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="youtube" ${website.type === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="mega" ${website.type === 'mega' ? 'selected' : ''}>MEGA</option>
                    <option value="reddit" ${website.type === 'reddit' ? 'selected' : ''}>Reddit</option>
                    <option value="default" ${!website.type || website.type === 'default' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
              </div>
            </div>
          `;
          websiteLinks.insertAdjacentHTML('beforeend', websiteHtml);
        });
      }
    }
    
    // Update image preview
    previewThumbFromUrl();
    
    console.log('=== FORM POPULATION COMPLETE ===');
    showToast(`Now editing "${actress.name}"`, 'success');
  }, 50);
}

/**
 * Switch form to edit mode and populate data - FIXED VERSION
 */
function switchToEditMode(actress) {
  console.log('Switching to edit mode for:', actress.name);
  
  // Switch to add tab first
  switchTab('add');
  
  // Wait for tab switch to complete and DOM to update
  setTimeout(() => {
    // Update form title and button to edit mode
    const tabTitle = document.querySelector('#addTab h3');
    const submitButton = document.querySelector('#addTab .btn.primary');
    
    if (tabTitle) {
      tabTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Actress';
    }
    
    if (submitButton) {
      submitButton.innerHTML = '<i class="fas fa-save"></i> Update Actress';
    }
    
    console.log('Form headers updated to edit mode');
    
    // Clear existing form data first
    resetForm();
    
    // Now populate with actress data - with a small delay to ensure form is cleared
    setTimeout(() => {
      populateFormWithActressData(actress);
    }, 50);
    
  }, 100);
}

/**
 * Populate form with actress data - FIXED VERSION
 */
function populateFormWithActressData(actress) {
  console.log('Populating form with data for:', actress.name);
  
  // Pre-fill basic fields
  document.getElementById('actressName').value = actress.name || '';
  document.getElementById('actressCategory').value = actress.category || 'worldwide';
  document.getElementById('thumbUrl').value = actress.thumb || '';
  
  console.log('Basic fields filled');
  
  // Pre-fill tags
  const tagsContainer = document.getElementById('tagsContainer');
  if (tagsContainer && actress.tags && actress.tags.length > 0) {
    tagsContainer.innerHTML = '';
    actress.tags.forEach(tag => addTag(tag));
    console.log('Tags filled:', actress.tags);
  }
  
  // Pre-fill gallery URLs
  const galleryUrls = document.getElementById('galleryUrls');
  if (galleryUrls && actress.gallery) {
    galleryUrls.value = actress.gallery.join('\n');
    console.log('Gallery URLs filled:', actress.gallery.length);
  }
  
  // Pre-fill website links
  const websiteLinks = document.getElementById('websiteLinks');
  if (websiteLinks) {
    websiteLinks.innerHTML = ''; // Clear existing
    
    console.log('Adding website links:', actress.websites.length);
    
    if (actress.websites && actress.websites.length > 0) {
      actress.websites.forEach((website, index) => {
        // Add website field
        addWebsiteField();
        
        // Wait for DOM to update then populate the field
        setTimeout(() => {
          const websiteElements = document.querySelectorAll('#websiteLinks .website-link');
          const lastWebsite = websiteElements[websiteElements.length - 1];
          
          if (lastWebsite) {
            const nameInput = lastWebsite.querySelector('input[name="websiteName[]"]');
            const urlInput = lastWebsite.querySelector('input[name="websiteUrl[]"]');
            const pictureInput = lastWebsite.querySelector('input[name="websitePicture[]"]');
            const typeSelect = lastWebsite.querySelector('select[name="websiteType[]"]');
            
            if (nameInput) nameInput.value = website.name || '';
            if (urlInput) urlInput.value = website.url || '';
            if (pictureInput) pictureInput.value = website.picture || '';
            if (typeSelect) typeSelect.value = website.type || 'default';
            
            console.log(`Website ${index + 1} filled:`, website.name);
          }
        }, 100 * (index + 1)); // Stagger the population to avoid race conditions
      });
    }
  }
  
  // Update image preview
  previewThumbFromUrl();
  
  console.log('=== FORM POPULATION COMPLETE ===');
  showToast(`Now editing "${actress.name}"`, 'success');
}

/**
 * Switch form to edit mode and populate data
 */
function switchToEditMode(actress) {
  console.log('Switching to edit mode for:', actress.name);
  
  // Switch to add tab first
  switchTab('add');
  
  // Wait for tab switch to complete and DOM to update
  setTimeout(() => {
    // Update form title and button to edit mode
    const tabTitle = document.querySelector('#addTab h3');
    const submitButton = document.querySelector('#addTab .btn.primary');
    
    if (tabTitle) {
      tabTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Actress';
    }
    
    if (submitButton) {
      submitButton.innerHTML = '<i class="fas fa-save"></i> Update Actress';
    }
    
    console.log('Form headers updated to edit mode');
    
    // Clear existing form data first
    resetForm();
    
    // Now populate with actress data
    populateFormWithActressData(actress);
    
  }, 100);
}

/**
 * Populate form with actress data
 */
function populateFormWithActressData(actress) {
  console.log('Populating form with data for:', actress.name);
  
  // Pre-fill basic fields
  document.getElementById('actressName').value = actress.name || '';
  document.getElementById('actressCategory').value = actress.category || 'worldwide';
  document.getElementById('thumbUrl').value = actress.thumb || '';
  
  console.log('Basic fields filled');
  
  // Pre-fill tags
  const tagsContainer = document.getElementById('tagsContainer');
  if (tagsContainer && actress.tags && actress.tags.length > 0) {
    tagsContainer.innerHTML = '';
    actress.tags.forEach(tag => addTag(tag));
    console.log('Tags filled:', actress.tags);
  }
  
  // Pre-fill gallery URLs
  const galleryUrls = document.getElementById('galleryUrls');
  if (galleryUrls && actress.gallery) {
    galleryUrls.value = actress.gallery.join('\n');
    console.log('Gallery URLs filled:', actress.gallery.length);
  }
  
  // Pre-fill website links
  const websiteLinks = document.getElementById('websiteLinks');
  if (websiteLinks && actress.websites && actress.websites.length > 0) {
    websiteLinks.innerHTML = ''; // Clear existing
    
    console.log('Adding website links:', actress.websites.length);
    
    actress.websites.forEach((website, index) => {
      // Add website field
      addWebsiteField();
      
      // Wait for DOM to update then populate the field
      setTimeout(() => {
        const websiteElements = document.querySelectorAll('#websiteLinks .website-link');
        const lastWebsite = websiteElements[websiteElements.length - 1];
        
        if (lastWebsite) {
          const nameInput = lastWebsite.querySelector('input[name="websiteName[]"]');
          const urlInput = lastWebsite.querySelector('input[name="websiteUrl[]"]');
          const pictureInput = lastWebsite.querySelector('input[name="websitePicture[]"]');
          const typeSelect = lastWebsite.querySelector('select[name="websiteType[]"]');
          
          if (nameInput) nameInput.value = website.name || '';
          if (urlInput) urlInput.value = website.url || '';
          if (pictureInput) pictureInput.value = website.picture || '';
          if (typeSelect) typeSelect.value = website.type || 'default';
          
          console.log(`Website ${index + 1} filled:`, website.name);
        }
      }, 50 * (index + 1)); // Stagger the population to avoid race conditions
    });
  }
  
  // Update image preview
  previewThumbFromUrl();
  
  console.log('=== FORM POPULATION COMPLETE ===');
  showToast(`Now editing "${actress.name}"`, 'success');
}

/**
 * Delete actress with confirmation
 */
function deleteActress(slug) {
  const actress = actresses.find(a => a.slug === slug);
  if (!actress) return;

  if (confirm(`Are you sure you want to delete "${actress.name}"? This action cannot be undone.`)) {
    actresses = actresses.filter(a => a.slug !== slug);
    saveActresses();
    loadManageList();
    displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
    updateStats();
    showToast(`Actress "${actress.name}" deleted successfully`, 'success');
  }
}

// =============================================
// IMPORT/EXPORT FUNCTIONALITY
// =============================================

/**
 * Export data as JSON
 */
function exportData() {
  const dataStr = JSON.stringify(actresses, null, 2);
  downloadFile(dataStr, `actresses-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  showToast('Data exported successfully', 'success');
}

/**
 * Export data as CSV
 */
function exportCSV() {
  const headers = ['Name', 'Category', 'Tags', 'Views', 'Photos', 'Links', 'Created'];
  const csvData = actresses.map(actress => [
    actress.name,
    actress.category,
    (actress.tags || []).join(';'),
    actress.views || 0,
    actress.gallery.length,
    actress.websites.length,
    new Date(actress.createdAt).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  downloadFile(csvContent, `actresses-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  showToast('CSV exported successfully', 'success');
}

/**
 * Export data as PDF (using browser print)
 */
function exportPDF() {
  // Simple PDF generation using window.print() for now
  window.print();
  showToast('PDF export ready - use browser print dialog', 'info');
}

/**
 * Handle import source change
 */
function handleImportSourceChange() {
  const source = document.getElementById('importSource').value;
  const fileInput = document.getElementById('importFile');
  const urlInput = document.getElementById('importUrl');
  
  if (source === 'url') {
    fileInput.style.display = 'none';
    urlInput.style.display = 'block';
  } else {
    fileInput.style.display = 'block';
    urlInput.style.display = 'none';
  }
}

/**
 * Import data from various sources
 */
function importData() {
  const source = document.getElementById('importSource').value;
  
  if (source === 'url') {
    const url = document.getElementById('importUrl').value;
    if (!url) {
      showToast('Please enter a URL', 'error');
      return;
    }
    importFromUrl(url);
  } else {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
      showToast('Please select a file to import', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      processImportedData(e.target.result, source);
    };
    reader.readAsText(file);
  }
}

/**
 * Import data from URL
 */
function importFromUrl(url) {
  showToast('Fetching data from URL...', 'info');
  
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(data => {
      processImportedData(data, 'json');
    })
    .catch(error => {
      showToast('Error importing from URL: ' + error.message, 'error');
    });
}

/**
 * Process imported data
 */
function processImportedData(data, format) {
  try {
    let importedData;
    
    if (format === 'csv') {
      importedData = parseCSV(data);
    } else {
      importedData = JSON.parse(data);
    }
    
    if (!Array.isArray(importedData)) {
      throw new Error('Invalid file format');
    }
    
    // Validate imported data structure
    const isValid = importedData.every(item => 
      item.slug && item.name && item.category && Array.isArray(item.websites) && Array.isArray(item.gallery)
    );
    
    if (!isValid) {
      throw new Error('Invalid data structure');
    }
    
    if (confirm(`This will import ${importedData.length} actresses. Existing data will be replaced. Continue?`)) {
      actresses = importedData;
      saveActresses();
      loadManageList();
      displayActresses(filterActresses('', currentCategory));
      updateStats();
      document.getElementById('importFile').value = '';
      document.getElementById('importUrl').value = '';
      showToast(`Successfully imported ${importedData.length} actresses`, 'success');
    }
  } catch (error) {
    showToast('Error importing file: ' + error.message, 'error');
  }
}

/**
 * Parse CSV data
 */
function parseCSV(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const actress = {
      slug: values[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: values[0],
      category: values[1] || 'worldwide',
      tags: values[2] ? values[2].split(';') : [],
      views: parseInt(values[3]) || 0,
      gallery: values[4] ? [values[4]] : [],
      websites: [],
      thumb: values[4] || 'https://via.placeholder.com/300x240/374151/9ca3af?text=No+Image',
      createdAt: new Date().toISOString()
    };
    return actress;
  }).filter(actress => actress.name);
}

/**
 * Clear all data with confirmation
 */
function clearAllData() {
  if (confirm('ARE YOU SURE? This will permanently delete ALL actress data and cannot be undone!')) {
    if (confirm('This is your last warning. All data will be lost forever. Confirm deletion?')) {
      actresses = [];
      saveActresses();
      loadManageList();
      displayActresses(filterActresses('', currentCategory));
      updateStats();
      showToast('All data cleared successfully', 'success');
    }
  }
}

// =============================================
// SETTINGS MANAGEMENT
// =============================================

/**
 * Update theme setting
 */
function updateThemeSetting() {
  const theme = document.getElementById('themeSetting').value;
  if (theme === 'auto') {
    localStorage.removeItem('theme');
    document.body.classList.remove('night-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('night-mode');
      document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('night-mode');
      document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
  }
}

/**
 * Update card size setting
 */
function updateCardSize() {
  const size = document.getElementById('cardSize').value;
  document.body.setAttribute('data-card-size', size);
  localStorage.setItem('cardSize', size);
}

// =============================================
// DATA MANAGEMENT
// =============================================

// Add this function temporarily to debug
function debugCategories() {
  console.log('=== DEBUG: All Categories ===');
  const categories = new Set();
  actresses.forEach(actress => {
    console.log(`- ${actress.name}: ${actress.category}`);
    categories.add(actress.category);
  });
  console.log('All unique categories:', Array.from(categories));
}

/**
 * Load actresses from localStorage
 */
function loadActresses() {
  console.log('Loading actresses from localStorage...');
  const saved = localStorage.getItem(ACTRESSES_INDEX);
  
  if (saved) {
    try {
      actresses = JSON.parse(saved);
      console.log('Successfully loaded actresses:', actresses.length);

      // DEBUG: Check what's actually loaded
      debugCategories();
      
      // Validate the data structure
      actresses = actresses.filter(actress => {
        if (!actress.slug) {
          console.warn('Removing actress without slug:', actress.name);
          return false;
        }
        return true;
      });
      
    } catch (error) {
      console.error('Error parsing saved data:', error);
      showToast('Error loading saved data, loading sample data', 'error');
      loadSampleData();
    }
  } else {
    console.log('No saved data found, loading sample data');
    loadSampleData();
  }
  
  displayActresses(filterActresses('', currentCategory));
  updateSearchResultsCount();
  updateCategorySuggestions();
  
  console.log('Final actresses array:', actresses);
}

/**
 * Save actresses to localStorage
 */
function saveActresses() {
  localStorage.setItem(ACTRESSES_INDEX, JSON.stringify(actresses));
}

/**
 * Load sample data for demonstration
 */
function loadSampleData() {
  // Add some sample data for demonstration
  actresses = [
    {
      slug: 'emma-stone',
      name: 'Emma Stone',
      category: 'worldwide',
      tags: ['oscar', 'comedy', 'hollywood'],
      websites: [
        { name: 'Instagram', url: 'https://instagram.com/emmastone', type: 'instagram' },
        { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Emma_Stone', type: 'wikipedia' }
      ],
      gallery: [
        'https://via.placeholder.com/400x600/ef4444/fff?text=Emma+Stone+1',
        'https://via.placeholder.com/400x600/ef4444/fff?text=Emma+Stone+2'
      ],
      thumb: 'https://via.placeholder.com/300x240/ef4444/fff?text=Emma+Stone',
      views: 15,
      createdAt: new Date().toISOString()
    },
    {
      slug: 'megan-fox',
      name: 'Megan Fox',
      category: 'worldwide',
      tags: ['action', 'model', 'transformers'],
      websites: [
        { name: 'Instagram', url: 'https://instagram.com/meganfox', type: 'instagram' }
      ],
      gallery: ['https://via.placeholder.com/400x600/ef4444/fff?text=Megan+Fox+1'],
      thumb: 'https://via.placeholder.com/300x240/ef4444/fff?text=Megan+Fox',
      views: 8,
      createdAt: new Date().toISOString()
    },
    {
      slug: 'Lisa',
      name: 'Lisa',
      category: 'japanese',
      tags: ['singer', 'japanese', 'model'],
      websites: [
        { name: 'Twitter', url: 'https://www.instagram.com/lalalalisa_m/?hl=bn', type: 'twitter' }
      ],
      gallery: [
        'https://www.billboard.com/wp-content/uploads/2024/08/lisa-blackpink-2024-a-kl-billboard-1548.jpg?w=942&h=628&crop=1',
        'https://hips.hearstapps.com/hmg-prod/images/8531-iwtqvyi7823238-1601382437.jpg',
        'https://e1.pxfuel.com/desktop-wallpaper/892/32/desktop-wallpaper-blackpink-lisa-blackpink-lisa-cute.jpg'
      ],
      thumb: 'https://imageio.forbes.com/specials-images/imageserve/668d754c72c52b8fe137252e/2022-Bulgari-Aurora-Awards-in-Seoul---Photo-Call/0x0.jpg?crop=2022%2C1517%2Cx0%2Cy98%2Csafe&width=960&dpr=2',
      views: 23,
      createdAt: new Date().toISOString()
    }
  ];
  saveActresses();
  displayActresses(filterActresses('', currentCategory));
  updateSearchResultsCount();
}

// =============================================
// GALLERY DISPLAY FUNCTIONS
// =============================================

/**
 * Display actresses in the gallery
 */
function displayActresses(list) {
  if (!actressList) return;
  
  // Apply sorting
  const sortBy = document.getElementById('sortBy').value;
  list = sortActresses(list, sortBy);
  
  actressList.innerHTML = '';
  if (!list.length) {
    actressList.innerHTML = `
      <div style="padding:60px; text-align:center; color:var(--text-muted); grid-column:1/-1">
        <i class="fas fa-search" style="font-size:64px; margin-bottom:20px; opacity:0.5;"></i>
        <h3>No actresses found</h3>
        <p>Try adjusting your search terms or category filter</p>
        <button class="btn primary" onclick="clearSearch()" style="margin-top:16px;">
          <i class="fas fa-times"></i> Clear Search
        </button>
      </div>
    `;
    return;
  }

  list.forEach(act => {
    const card = document.createElement('div');
    card.className = `card ${act.category}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${act.name} details`);

    card.innerHTML = `
      ${act.views > 0 ? `
        <div class="views-count">
          <i class="fas fa-eye"></i> ${act.views}
        </div>
      ` : ''}
      <img class="thumb" src="${act.thumb}" alt="${act.name} thumbnail" 
           onerror="this.src='https://via.placeholder.com/300x240/374151/9ca3af?text=No+Image'">
      <div class="name">${act.name}</div>
      <div class="category-tag">${act.category}</div>
      ${act.tags && act.tags.length > 0 ? `
        <div class="card-tags">
          ${act.tags.slice(0, 3).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
          ${act.tags.length > 3 ? `<span class="card-tag-more">+${act.tags.length - 3}</span>` : ''}
        </div>
      ` : ''}
      <div class="links-count">
        <i class="fas fa-link"></i>
        ${act.websites.length} link${act.websites.length !== 1 ? 's' : ''}
        • 
        <i class="fas fa-image"></i>
        ${act.gallery.length} photo${act.gallery.length !== 1 ? 's' : ''}
      </div>
    `;

    card.addEventListener('click', () => openGallery(act));
    card.addEventListener('keypress', (e) => { 
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGallery(act); 
      }
    });

    // Add context menu support
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Context menu is handled globally
    });

    actressList.appendChild(card);
  });
}

/**
 * Clear search
 */
function clearSearch() {
  if (searchBar) {
    searchBar.value = '';
  }
  displayActresses(filterActresses('', currentCategory));
  updateSearchResultsCount();
}

/**
 * Open actress gallery view
 */
function openGallery(actress) {
  if (!app) return;
  
  const linksWithPictures = actress.websites.filter(website => website.picture);
  const regularLinks = actress.websites.filter(website => !website.picture);
  
  const pictureLinksHtml = linksWithPictures.length > 0 ? `
    <div class="links-section">
      <h3 class="section-title">
        <i class="fas fa-images"></i> Picture Links
      </h3>
      <div class="picture-links-grid">
        ${linksWithPictures.map(website => `
          <a href="${website.url}" target="_blank" rel="noopener noreferrer nofollow" class="picture-link">
            <img src="${website.picture}" 
                 alt="${website.name}" 
                 onerror="this.src='https://via.placeholder.com/200x150/374151/9ca3af?text=No+Image'">
            <div class="picture-link-title">${website.name}</div>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  const regularLinksHtml = regularLinks.length > 0 ? `
    <div class="links-section">
      <h3 class="section-title">
        <i class="fas fa-link"></i> List Links (${regularLinks.length})
      </h3>
      <div class="regular-links-list">
        ${regularLinks.map(website => {
          const type = website.type || 'default';
          const iconClass = iconMap[type] || iconMap.default;
          const btnClass = type !== 'default' ? `btn ${type}` : 'btn secondary';
          
          return `
            <a class="${btnClass} list-link" href="${website.url}" target="_blank" rel="noopener noreferrer nofollow">
              <i class="fab ${iconClass}"></i> ${website.name}
            </a>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  const galleryHtml = `
    <div class="gallery-header">
      <a class="back btn secondary" href="#" id="backBtn">
        <i class="fas fa-arrow-left"></i> Back to List
      </a>
      <h2 class="gallery-title">${actress.name}</h2>
      <span class="small-muted">
        ${actress.gallery.length} photo${actress.gallery.length !== 1 ? 's' : ''} • 
        ${actress.websites.length} link${actress.websites.length !== 1 ? 's' : ''} •
        ${actress.views || 0} view${actress.views !== 1 ? 's' : ''}
      </span>
    </div>

    <div class="links-section">
      <h3 class="section-title">
        <i class="fas fa-camera"></i> Photo Gallery (${actress.gallery.length})
      </h3>
      <div class="gallery-grid">
        ${actress.gallery.length ? actress.gallery.map((img, index) => `
          <img src="${img}" 
               alt="${actress.name} photo ${index + 1}" 
               onclick="openImageViewer(actresses.find(a => a.slug === '${actress.slug}'), ${index})"
               onerror="this.src='https://via.placeholder.com/300x180/374151/9ca3af?text=Image+Not+Found'">
        `).join('') : `
          <div class="no-images">
            <i class="fas fa-images" style="font-size:48px; margin-bottom:15px; opacity:0.5;"></i>
            <p>No gallery images available for ${actress.name}</p>
          </div>
        `}
      </div>
    </div>

    ${pictureLinksHtml}
    ${regularLinksHtml}
  `;

  app.innerHTML = galleryHtml;

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      goBackToList();
    });
  }
  
  // Track view when opening gallery
  trackView(actress.slug);
}

/**
 * Go back to main list view
 */
function goBackToList() {
  if (!app) return;
  
  // Simply re-render the main view without destroying everything
  app.innerHTML = `
    <div class="view-mode-container">
      <div class="view-mode-toggle">
        <button class="view-mode-btn ${currentViewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">
          <i class="fas fa-th"></i>
          <span class="view-mode-text">Grid</span>
        </button>
        <button class="view-mode-btn ${currentViewMode === 'masonry' ? 'active' : ''}" data-view="masonry" title="Masonry View">
          <i class="fas fa-th-large"></i>
          <span class="view-mode-text">Masonry</span>
        </button>
        <button class="view-mode-btn ${currentViewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">
          <i class="fas fa-list"></i>
          <span class="view-mode-text">List</span>
        </button>
        <button class="view-mode-btn ${currentViewMode === 'slideshow' ? 'active' : ''}" data-view="slideshow" title="Slideshow View">
          <i class="fas fa-play"></i>
          <span class="view-mode-text">Slideshow</span>
        </button>
      </div>
    </div>

    <div id="galleryView" class="view-${currentViewMode}">
      <div id="actressList" class="grid"></div>
    </div>
  `;
  
  // Re-initialize only what's needed
  initializeDOMElements();
  
  // Re-attach view mode listeners
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', handleViewModeChange);
  });
  
  // Display the actresses
  displayActresses(filterActresses(searchBar ? searchBar.value : '', currentCategory));
  
  // Update stats
  updateStats();
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Force external links to open in new tab
 */
function forceExternalLinksNewTab() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (link && !link.getAttribute('target')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
}

/**
 * Initialize theme
 */
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  const themeSetting = document.getElementById('themeSetting');
  
  if (savedTheme) {
    themeSetting.value = savedTheme;
  }
  
  if (savedTheme === 'dark') {
    document.body.classList.add('night-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  themeToggle.addEventListener('click', toggleTheme);
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const isNightMode = body.classList.toggle('night-mode');
  
  if (isNightMode) {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', 'dark');
    showToast('Dark mode enabled', 'info', 2000);
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', 'light');
    showToast('Light mode enabled', 'info', 2000);
  }
}

/**
 * Initialize back to top button
 */
function initializeBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Download file utility
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================
// ADDITIONAL HELPER FUNCTIONS
// =============================================

/**
 * Toggle favorite status
 */
function toggleFavorite(slug) {
  const actress = actresses.find(a => a.slug === slug);
  if (actress) {
    actress.favorite = !actress.favorite;
    saveActresses();
    showToast(`${actress.favorite ? 'Added to' : 'Removed from'} favorites`, 'info');
  }
}

/**
 * Share actress profile
 */
function shareActress(actress) {
  const url = `${window.location.origin}${window.location.pathname}#${actress.slug}`;
  if (navigator.share) {
    navigator.share({
      title: actress.name,
      text: `Check out ${actress.name} in my actress collection`,
      url: url
    });
  } else {
    navigator.clipboard.writeText(url);
    showToast('Profile link copied to clipboard', 'success');
  }
}

// =============================================
// CATEGORY MANAGEMENT
// =============================================

/**
 * Get all categories from actresses
 */
function getAllCategories() {
  const categories = new Set();
  actresses.forEach(actress => {
    if (actress.category) {
      categories.add(actress.category.toLowerCase());
    }
  });
  // Add default categories
  categories.add('worldwide');
  categories.add('koreans'); 
  categories.add('japanese');
  return Array.from(categories).sort();
}

/**
 * Update category suggestions
 */
function updateCategorySuggestions() {
  const datalist = document.getElementById('categorySuggestions');
  const categories = getAllCategories();
  
  datalist.innerHTML = '';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    datalist.appendChild(option);
  });
  
  // Update existing categories display
  updateExistingCategories();
}

/**
 * Update existing categories display
 */
function updateExistingCategories() {
  const container = document.getElementById('existingCategories');
  if (!container) return;
  
  const categories = getAllCategories();
  container.innerHTML = categories.map(category => `
    <span class="category-badge" onclick="selectCategory('${category}')">
      ${category}
    </span>
  `).join('');
}

/**
 * Select category from suggestions
 */
function selectCategory(category) {
  document.getElementById('actressCategory').value = category;
  hideCategorySuggestions();
}

/**
 * Show category suggestions
 */
function showCategorySuggestions() {
  const input = document.getElementById('actressCategory');
  const dropdown = document.getElementById('categorySuggestionsList');
  const value = input.value.toLowerCase();
  
  if (!value) {
    hideCategorySuggestions();
    return;
  }
  
  const categories = getAllCategories();
  const filtered = categories.filter(cat => 
    cat.toLowerCase().includes(value) && cat !== value
  );
  
  if (filtered.length === 0) {
    hideCategorySuggestions();
    return;
  }
  
  dropdown.innerHTML = filtered.map(cat => `
    <div class="suggestion-item" onclick="selectCategory('${cat}')">
      ${cat}
    </div>
  `).join('');
  
  dropdown.style.display = 'block';
}

/**
 * Hide category suggestions
 */
function hideCategorySuggestions() {
  const dropdown = document.getElementById('categorySuggestionsList');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
}

/**
 * Handle category input with suggestions
 */
function handleCategoryInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // User pressed Enter - use whatever they typed
    hideCategorySuggestions();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    // Navigate suggestions with arrow keys
    navigateCategorySuggestions(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    navigateCategorySuggestions(-1);
  } else {
    // Show suggestions as user types
    clearTimeout(window.categorySuggestionsTimeout);
    window.categorySuggestionsTimeout = setTimeout(showCategorySuggestions, 300);
  }
}

/**
 * Navigate category suggestions with arrow keys
 */
function navigateCategorySuggestions(direction) {
  const dropdown = document.getElementById('categorySuggestionsList');
  const items = dropdown.querySelectorAll('.suggestion-item');
  let activeIndex = -1;
  
  items.forEach((item, index) => {
    if (item.classList.contains('active')) {
      activeIndex = index;
      item.classList.remove('active');
    }
  });
  
  let newIndex = activeIndex + direction;
  if (newIndex < 0) newIndex = items.length - 1;
  if (newIndex >= items.length) newIndex = 0;
  
  if (items[newIndex]) {
    items[newIndex].classList.add('active');
    items[newIndex].scrollIntoView({ block: 'nearest' });
  }
}

/**
 * Attach quick action button listeners - UPDATED FOR ICON BUTTONS
 */
function attachQuickActionListeners() {
  document.getElementById('quickAdd').addEventListener('click', openQuickAddModal);
  document.getElementById('batchActions').addEventListener('click', openBatchActions);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  // View toggle and admin toggle are already handled in other functions
}

// Update category suggestions when actresses load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateCategorySuggestions, 1000);
});

// =============================================
// APPLICATION START
// =============================================

// Initialize the application when DOM is loaded. Wrap init in a try/catch so errors
// don't leave the loading overlay shown forever and so we can show debug info.
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeApp();
  } catch (err) {
    // Log to console for debugging
    console.error('Initialization error:', err);

    // Attempt to hide the loading screen so the user sees the error/info
    try {
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        loadingScreen.style.display = 'none';
      }
    } catch (e) {
      console.error('Failed to hide loading screen:', e);
    }

    // Add a user-visible error banner so the issue is obvious
    const errorBanner = document.createElement('div');
    errorBanner.style.cssText = 'background:#ffefef;color:#990000;padding:12px;border:1px solid #ffcccc;position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:12000;border-radius:6px;max-width:92%;text-align:center;';
    errorBanner.textContent = 'An error occurred while loading the app. Check developer console for details.';
    document.body.appendChild(errorBanner);
  }
});