// ============================================
// Auth Pages JavaScript
// ============================================

// Login Page
if (document.getElementById('loginForm')) {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
      errorMessage.textContent = 'Please fill in all fields';
      errorMessage.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const data = await Auth.login(email, password);
      DOM.toast('Welcome back, ' + data.user.name + '!', 'success');
      window.location.href = '/';
    } catch (error) {
      errorMessage.textContent = error.message || 'Login failed. Please try again.';
      errorMessage.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
    }
  });
}

// Register Page
if (document.getElementById('registerForm')) {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const studentIdInput = document.getElementById('studentId');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!name || !email || !password) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.style.display = 'block';
      return;
    }

    if (!email.endsWith('@ub.bw')) {
      errorMessage.textContent = 'Only @ub.bw email addresses are allowed';
      errorMessage.style.display = 'block';
      return;
    }

    if (password.length < 8) {
      errorMessage.textContent = 'Password must be at least 8 characters';
      errorMessage.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const data = await Auth.register(name, email, password, studentId);
      DOM.toast('Account created successfully! Please check your email for verification.', 'success');
      window.location.href = '/';
    } catch (error) {
      errorMessage.textContent = error.message || 'Registration failed. Please try again.';
      errorMessage.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

// Password strength indicator
if (document.getElementById('password')) {
  const passwordInput = document.getElementById('password');
  const strengthBar = document.getElementById('passwordStrength');

  if (strengthBar) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      let strength = 0;

      if (password.length >= 8) strength++;
      if (password.match(/[a-z]/)) strength++;
      if (password.match(/[A-Z]/)) strength++;
      if (password.match(/[0-9]/)) strength++;
      if (password.match(/[^a-zA-Z0-9]/)) strength++;

      const percentage = (strength / 5) * 100;
      const colors = ['#e53e3e', '#e53e3e', '#d69e2e', '#48bb78', '#38a169'];
      const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

      strengthBar.style.width = percentage + '%';
      strengthBar.style.backgroundColor = colors[strength - 1] || '#e2e8f0';
      strengthBar.textContent = labels[strength - 1] || '';
    });
  }
}

// Forgot Password
if (document.getElementById('forgotPasswordForm')) {
  const form = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('submitBtn');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
      errorMessage.textContent = 'Please enter your email';
      errorMessage.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      await api.post('/auth/forgot-password', { email });
      successMessage.style.display = 'block';
      errorMessage.style.display = 'none';
      form.querySelector('.form-group').style.display = 'none';
      submitBtn.style.display = 'none';
    } catch (error) {
      errorMessage.textContent = error.message || 'Failed to send reset email';
      errorMessage.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  });
}

// Reset Password
if (document.getElementById('resetPasswordForm')) {
  const form = document.getElementById('resetPasswordForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const errorMessage = document.getElementById('errorMessage');

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    document.getElementById('formContainer').innerHTML = `
      <div class="alert alert-error">
        Invalid or missing reset token. Please request a new password reset.
      </div>
    `;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 8) {
      errorMessage.textContent = 'Password must be at least 8 characters';
      errorMessage.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      DOM.toast('Password reset successfully! Please log in.', 'success');
      window.location.href = '/pages/login.html';
    } catch (error) {
      errorMessage.textContent = error.message || 'Failed to reset password';
      errorMessage.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  });
}