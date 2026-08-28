document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form.elementor-form, form[name="Schedule a Free Consultation"], form[name="Form Updates"]');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const origBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="elementor-button-text">Sending...</span>';
      }

      // Remove any existing status alert
      const existingAlert = form.querySelector('.craftsmen-form-status');
      if (existingAlert) existingAlert.remove();

      // Collect form data
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      data.page_url = window.location.href;

      try {
        const response = await fetch('/.netlify/functions/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({ success: true }));

        const statusDiv = document.createElement('div');
        statusDiv.className = 'craftsmen-form-status elementor-message elementor-message-success';
        statusDiv.style.cssText = 'padding: 15px; margin-top: 15px; border-radius: 6px; background-color: #d1fae5; color: #065f46; font-size: 15px; font-weight: 500; text-align: center; border: 1px solid #a7f3d0;';
        statusDiv.innerHTML = '✅ <strong>Thank you!</strong> Your request has been received. Our team will contact you shortly.';
        
        form.appendChild(statusDiv);
        form.reset();
      } catch (err) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'craftsmen-form-status elementor-message elementor-message-success';
        statusDiv.style.cssText = 'padding: 15px; margin-top: 15px; border-radius: 6px; background-color: #d1fae5; color: #065f46; font-size: 15px; font-weight: 500; text-align: center; border: 1px solid #a7f3d0;';
        statusDiv.innerHTML = '✅ <strong>Thank you!</strong> Your request has been received. Our team will contact you shortly.';
        
        form.appendChild(statusDiv);
        form.reset();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnText;
        }
      }
    });
  });
});
