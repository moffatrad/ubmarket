// ============================================
// Listings JavaScript
// ============================================

// Load category counts on homepage
async function loadCategoryCounts() {
  try {
    const counts = await api.get('/listings/counts');
    
    counts.forEach(cat => {
      const element = document.getElementById(`${cat.category}Count`);
      if (element) {
        element.textContent = `${parseInt(cat.active_count) || 0} listings`;
      }
    });
  } catch (error) {
    console.error('Failed to load category counts:', error);
  }
}

// Load featured listings
async function loadFeaturedListings() {
  const container = document.getElementById('featuredListings');
  if (!container) return;

  try {
    const listings = await api.get('/listings/featured?limit=4');
    renderListings(container, listings);
  } catch (error) {
    console.error('Failed to load featured listings:', error);
    container.innerHTML = '<p>Failed to load featured listings.</p>';
  }
}

// Load recent listings
async function loadRecentListings() {
  const container = document.getElementById('recentListings');
  if (!container) return;

  try {
    const data = await api.get('/listings?limit=8');
    renderListings(container, data.listings || []);
  } catch (error) {
    console.error('Failed to load recent listings:', error);
    container.innerHTML = '<p>Failed to load listings.</p>';
  }
}

// Render listings
function renderListings(container, listings) {
  if (!listings || listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No listings found</h3>
        <p>Be the first to post something on UBMarket!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = listings.map(listing => `
    <div class="listing-card" data-id="${listing.id}">
      <div class="listing-image">
        ${listing.images && listing.images.length > 0 ? 
          `<img src="${listing.images[0].image_path}" alt="${listing.title}" />` : 
          `<img src="/assets/img/placeholder.png" alt="${listing.title}" />`
        }
        ${listing.is_featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
      </div>
      <div class="listing-content">
        <span class="listing-category">${listing.category}</span>
        <h4 class="listing-title">${listing.title}</h4>
        <div class="listing-price">P${parseFloat(listing.price).toFixed(2)}</div>
        <div class="listing-meta">
          <div class="listing-seller">
            <img src="${listing.seller_avatar || '/assets/img/default-avatar.png'}" alt="${listing.seller_name}" />
            <span>${listing.seller_name}</span>
          </div>
          <div class="listing-rating">
            <span class="star">★</span>
            ${parseFloat(listing.seller_rating).toFixed(1)}
          </div>
        </div>
        <a href="/pages/listing.html?id=${listing.id}" class="btn btn-primary btn-sm" style="width:100%;margin-top:8px;">
          View Details
        </a>
      </div>
    </div>
  `).join('');
}

// Browse page functionality
if (document.getElementById('browsePage')) {
  const listingsContainer = document.getElementById('listingsContainer');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const sortSelect = document.getElementById('sortSelect');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultsCount = document.getElementById('resultsCount');

  let currentFilters = {};

  // Load listings with filters
  async function loadBrowseListings(filters = {}) {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);
    if (filters.limit) params.append('limit', filters.limit);

    try {
      const data = await api.get(`/listings?${params.toString()}`);
      const listings = data.listings || [];

      if (resultsCount) {
        resultsCount.textContent = `${listings.length} results`;
      }

      renderListings(listingsContainer, listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
      listingsContainer.innerHTML = '<p class="text-center">Failed to load listings. Please try again.</p>';
    }
  }

  // Apply filters
  function applyFilters() {
    const filters = {
      search: searchInput ? searchInput.value.trim() : '',
      category: categoryFilter ? categoryFilter.value : '',
      minPrice: priceMinInput ? priceMinInput.value : '',
      maxPrice: priceMaxInput ? priceMaxInput.value : '',
      sortBy: sortSelect ? sortSelect.value : 'created_at',
      sortDir: 'DESC',
      limit: 20
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    currentFilters = filters;
    loadBrowseListings(filters);

    // Update URL
    const params = new URLSearchParams(filters);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ filters }, '', newUrl);
  }

  // Clear filters
  function clearFilters() {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (priceMinInput) priceMinInput.value = '';
    if (priceMaxInput) priceMaxInput.value = '';
    if (sortSelect) sortSelect.value = 'created_at';

    currentFilters = {};
    loadBrowseListings({ limit: 20 });

    window.history.pushState({}, '', window.location.pathname);
  }

  // Event listeners
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }

  // Load initial listings with URL params
  const urlParams = new URLSearchParams(window.location.search);
  const initialFilters = {
    search: urlParams.get('search') || '',
    category: urlParams.get('category') || '',
    minPrice: urlParams.get('minPrice') || '',
    maxPrice: urlParams.get('maxPrice') || '',
    sortBy: urlParams.get('sortBy') || 'created_at',
    limit: 20
  };

  // Populate form fields from URL
  if (searchInput && initialFilters.search) searchInput.value = initialFilters.search;
  if (categoryFilter && initialFilters.category) categoryFilter.value = initialFilters.category;
  if (priceMinInput && initialFilters.minPrice) priceMinInput.value = initialFilters.minPrice;
  if (priceMaxInput && initialFilters.maxPrice) priceMaxInput.value = initialFilters.maxPrice;
  if (sortSelect && initialFilters.sortBy) sortSelect.value = initialFilters.sortBy;

  loadBrowseListings(initialFilters);

  // Infinite scroll
  let loading = false;
  let offset = 20;

  window.addEventListener('scroll', () => {
    if (loading) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loading = true;
      offset += 20;

      const filters = { ...currentFilters, limit: 20, offset };
      
      // Load more listings
      const params = new URLSearchParams(filters);
      api.get(`/listings?${params.toString()}`).then(data => {
        const newListings = data.listings || [];
        if (newListings.length > 0) {
          const fragment = document.createDocumentFragment();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newListings.map(listing => `
            <div class="listing-card" data-id="${listing.id}">
              <div class="listing-image">
                ${listing.images && listing.images.length > 0 ? 
                  `<img src="${listing.images[0].image_path}" alt="${listing.title}" />` : 
                  `<img src="/assets/img/placeholder.png" alt="${listing.title}" />`
                }
              </div>
              <div class="listing-content">
                <span class="listing-category">${listing.category}</span>
                <h4 class="listing-title">${listing.title}</h4>
                <div class="listing-price">P${parseFloat(listing.price).toFixed(2)}</div>
                <div class="listing-meta">
                  <div class="listing-seller">
                    <img src="${listing.seller_avatar || '/assets/img/default-avatar.png'}" />
                    <span>${listing.seller_name}</span>
                  </div>
                </div>
                <a href="/pages/listing.html?id=${listing.id}" class="btn btn-primary btn-sm" style="width:100%;margin-top:8px;">
                  View Details
                </a>
              </div>
            </div>
          `).join('');
          listingsContainer.appendChild(tempDiv);
        }
        loading = false;
      }).catch(() => {
        loading = false;
      });
    }
  });
}

// Initialize homepage
if (document.getElementById('featuredListings')) {
  loadCategoryCounts();
  loadFeaturedListings();
  loadRecentListings();
}

// Helper: get query param
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Listing details page
async function renderListingDetailsPage() {
  const listingId = getQueryParam('id');
  const container = document.getElementById('listingDetailPage');

  if (!container) return;

  if (!listingId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Invalid listing</h3>
        <p>No listing ID was provided in the URL.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="loading">Loading listing...</div>`;

  try {
    const listing = await api.get(`/listings/${listingId}`);

    const imageSection = listing.images && listing.images.length > 0
      ? listing.images.map(img => `<img src="${img.image_path}" alt="${listing.title}" class="listing-detail-image" />`).join('')
      : `<img src="/assets/img/placeholder.png" alt="${listing.title}" class="listing-detail-image" />`;

    const categoryDetails = [];
    if (listing.category === 'room' && listing.details) {
      categoryDetails.push(`<li><strong>Location:</strong> ${listing.details.location || 'N/A'}</li>`);
      categoryDetails.push(`<li><strong>Bedrooms:</strong> ${listing.details.bedrooms || 'N/A'}</li>`);
      categoryDetails.push(`<li><strong>Furnished:</strong> ${listing.details.furnished ? 'Yes' : 'No'}</li>`);
      categoryDetails.push(`<li><strong>Available from:</strong> ${listing.details.available_from || 'N/A'}</li>`);
    }
    if (listing.category === 'tutor' && listing.details) {
      categoryDetails.push(`<li><strong>Subjects:</strong> ${(listing.details.subjects || []).join(', ') || 'N/A'}</li>`);
      categoryDetails.push(`<li><strong>Hourly rate:</strong> P${parseFloat(listing.details.rate_per_hour || 0).toFixed(2)}</li>`);
      categoryDetails.push(`<li><strong>Bio:</strong> ${listing.details.bio || 'N/A'}</li>`);
    }

    container.innerHTML = `
      <div class="listing-detail">
        <div class="listing-detail-gallery">
          ${imageSection}
        </div>
        <div class="listing-detail-info">
          <span class="listing-category">${listing.category}</span>
          <h2>${listing.title}</h2>
          <p class="listing-description">${listing.description || ''}</p>
          <div class="listing-detail-meta">
            <div><strong>Price:</strong> P${parseFloat(listing.price).toFixed(2)}</div>
            <div><strong>Seller:</strong> ${listing.seller_name || 'Unknown'}</div>
            <div><strong>Rating:</strong> ${parseFloat(listing.seller_rating || 0).toFixed(1)} ★</div>
          </div>
          <ul class="listing-detail-specs">
            <li><strong>Condition:</strong> ${listing.condition || 'N/A'}</li>
            <li><strong>Course code:</strong> ${listing.course_code || 'N/A'}</li>
            <li><strong>Author:</strong> ${listing.author || 'N/A'}</li>
            <li><strong>Edition:</strong> ${listing.edition || 'N/A'}</li>
            ${categoryDetails.join('')}
          </ul>
          <div class="listing-detail-actions">
            <a href="/pages/browse.html" class="btn btn-outline">Back to Browse</a>
            <a href="/pages/inbox.html" class="btn btn-primary">Message Seller</a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load listing details:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>Could not load listing</h3>
        <p>${error.message || 'Please try again later.'}</p>
      </div>
    `;
  }
}

async function renderDashboardPage() {
  const container = document.getElementById('dashboardPage');
  if (!container) return;

  if (!AppState.token) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <h3>Login required</h3>
        <p>Please <a href="/pages/login.html">log in</a> to view your dashboard.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="loading">Loading your dashboard...</div>`;

  try {
    const listings = await api.get('/listings/user/me');
    const counts = {
      active: listings.filter(l => l.status === 'active').length,
      sold: listings.filter(l => l.status === 'sold').length,
      expired: listings.filter(l => l.status === 'expired').length,
      total: listings.length
    };

    const listingsHtml = listings.length === 0
      ? `<div class="empty-state"><div class="empty-icon">📭</div><h3>No listings yet</h3><p>Create your first listing to appear here.</p></div>`
      : `<div class="dashboard-listings-grid">${listings.map(listing => `
          <div class="listing-card listing-card-small">
            <div class="listing-image">
              <img src="${listing.images && listing.images[0] ? listing.images[0].image_path : '/assets/img/placeholder.png'}" alt="${listing.title}" />
            </div>
            <div class="listing-content">
              <span class="listing-category">${listing.category}</span>
              <h4 class="listing-title">${listing.title}</h4>
              <div class="listing-price">P${parseFloat(listing.price).toFixed(2)}</div>
              <div class="listing-status">${listing.status || 'active'}</div>
              <a href="/pages/listing.html?id=${listing.id}" class="btn btn-secondary btn-sm">View</a>
            </div>
          </div>
        `).join('')}</div>`;

    container.innerHTML = `
      <section class="dashboard-summary">
        <div class="dashboard-card">
          <h3>Total Listings</h3>
          <p>${counts.total}</p>
        </div>
        <div class="dashboard-card">
          <h3>Active</h3>
          <p>${counts.active}</p>
        </div>
        <div class="dashboard-card">
          <h3>Sold</h3>
          <p>${counts.sold}</p>
        </div>
        <div class="dashboard-card">
          <h3>Expired</h3>
          <p>${counts.expired}</p>
        </div>
      </section>
      <section class="dashboard-listings">
        <div class="section-header">
          <h2>Your Listings</h2>
          <a href="/pages/post.html" class="btn btn-primary btn-sm">Create Listing</a>
        </div>
        ${listingsHtml}
      </section>
    `;
  } catch (error) {
    console.error('Failed to load dashboard listings:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <h3>Unable to load dashboard</h3>
        <p>${error.message || 'Please try again later.'}</p>
      </div>
    `;
  }
}

if (document.getElementById('listingDetailPage')) {
  document.addEventListener('DOMContentLoaded', renderListingDetailsPage);
}

if (document.getElementById('dashboardPage')) {
  document.addEventListener('DOMContentLoaded', renderDashboardPage);
}
