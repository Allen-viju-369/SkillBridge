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

  // 2. Interactive Button Click Ripple Effect
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  // 3. Animated Number Counters
  const counterElements = document.querySelectorAll('.counter-val');
  if (counterElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10) || 0;
          if (target > 0) {
            let start = 0;
            const stepTime = Math.max(20, Math.floor(1200 / target));
            const timer = setInterval(() => {
              start += Math.ceil(target / 40) || 1;
              if (start >= target) {
                el.textContent = target;
                clearInterval(timer);
              } else {
                el.textContent = start;
              }
            }, stepTime);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counterElements.forEach(el => observer.observe(el));
  }

  // 4. Price Filter Slider Synchronization
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

  // 5. Client-side Form Validation Enhancement
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

  // 6. Password Confirmation Check
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
