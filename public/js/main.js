/**
 * SkillBridge — Client-side UX & Interactive Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto-dismiss flash alerts after 6 seconds
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 6000);
  });

  // 2. Quick Demo Login Autofill Helpers
  const fillButtons = document.querySelectorAll('[data-demo-email]');
  fillButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = btn.getAttribute('data-demo-email');
      const pass = btn.getAttribute('data-demo-pass');
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = pass;
        emailInput.classList.add('is-valid');
        passInput.classList.add('is-valid');
      }
    });
  });

  // 3. Price Filter Slider Synchronization
  const priceRange = document.getElementById('priceRangeSlider');
  const priceDisplay = document.getElementById('maxPriceDisplay');
  const priceInput = document.getElementById('maxPriceInput');
  if (priceRange && priceDisplay && priceInput) {
    priceRange.addEventListener('input', (e) => {
      const val = e.target.value;
      priceDisplay.textContent = `₹${Number(val).toLocaleString('en-IN')}`;
      priceInput.value = val;
    });
  }

  // 4. Client-side Form Validation Enhancement
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  // 5. Password Confirmation Check
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    const password = document.getElementById('registerPassword');
    const confirm = document.getElementById('registerConfirmPassword');
    if (password && confirm) {
      confirm.addEventListener('input', () => {
        if (password.value !== confirm.value) {
          confirm.setCustomValidity('Passwords do not match');
        } else {
          confirm.setCustomValidity('');
        }
      });
    }
  }
});
