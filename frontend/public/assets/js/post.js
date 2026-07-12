// ============================================
// Post Listing Page JavaScript
// ============================================

function showCategoryFields(category) {
  const roomFields = document.getElementById('roomFields');
  const tutorFields = document.getElementById('tutorFields');

  if (roomFields) roomFields.classList.toggle('hidden', category !== 'room');
  if (tutorFields) tutorFields.classList.toggle('hidden', category !== 'tutor');
}

async function submitPostForm(event) {
  event.preventDefault();

  const errorMessage = document.getElementById('postError');
  const successMessage = document.getElementById('postSuccess');
  const submitBtn = document.getElementById('submitPostBtn');
  const form = document.getElementById('postForm');

  if (!form || !submitBtn) return;

  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  if (!AppState.token) {
    errorMessage.textContent = 'You must be logged in to create a listing.';
    errorMessage.style.display = 'block';
    return;
  }

  const formData = new FormData(form);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating listing...';

  try {
    await api.upload('/listings', formData);
    successMessage.textContent = 'Listing created successfully! Redirecting to your dashboard...';
    successMessage.style.display = 'block';
    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 1500);
  } catch (error) {
    errorMessage.textContent = error.message || 'Failed to create listing. Please try again.';
    errorMessage.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Listing';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const category = document.getElementById('category');
  const form = document.getElementById('postForm');

  if (category) {
    showCategoryFields(category.value);
    category.addEventListener('change', () => showCategoryFields(category.value));
  }

  if (form) {
    form.addEventListener('submit', submitPostForm);
  }
});
