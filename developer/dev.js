document.addEventListener('DOMContentLoaded', () => {
  const loginBox = document.getElementById('devLoginBox');
  const dashboard = document.getElementById('devDashboard');
  const loginForm = document.getElementById('devLoginForm');
  const btnLogout = document.getElementById('btnDevLogout');
  const hasExtraFile = document.getElementById('hasExtraFile');
  const extraFileContainer = document.getElementById('extraFileContainer');
  const createForm = document.getElementById('createPageForm');

  // Toggle Checkbox Extra File
  hasExtraFile.addEventListener('change', (e) => {
    if (e.target.checked) {
      extraFileContainer.classList.remove('d-none');
    } else {
      extraFileContainer.classList.add('d-none');
    }
  });

  // Session Check
  if (sessionStorage.getItem('isDevLoggedIn') === 'true') {
    loginBox.classList.add('d-none');
    dashboard.classList.remove('d-none');
  }

  // Auth Handler (User: 123 | Pass: 123)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('devUser').value;
    const pass = document.getElementById('devPass').value;

    if (user === '123' && pass === '123') {
      sessionStorage.setItem('isDevLoggedIn', 'true');
      sessionStorage.setItem('devUser', user);
      sessionStorage.setItem('devPass', pass);
      loginBox.classList.add('d-none');
      dashboard.classList.remove('d-none');
      loginForm.reset();
    } else {
      alert('Kredensial Dev Salah!');
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    dashboard.classList.add('d-none');
    loginBox.classList.remove('d-none');
  });

  // Submit Handler Create Page
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnCreatePage');
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Building Files & Endpoint...';

    const payload = {
      user: sessionStorage.getItem('devUser'),
      pass: sessionStorage.getItem('devPass'),
      slug: document.getElementById('pageSlug').value.trim(),
      html: document.getElementById('codeHtml').value,
      css: document.getElementById('codeCss').value,
      js: document.getElementById('codeJs').value,
      hasExtra: hasExtraFile.checked,
      extraFileName: document.getElementById('extraFileName').value.trim(),
      extraFileContent: document.getElementById('extraFileContent').value
    };

    try {
      const res = await fetch('/api/dev/create-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.message);

      document.getElementById('resultBox').classList.remove('d-none');
      document.getElementById('generatedUrl').href = result.encodedUrl;
      document.getElementById('generatedUrl').innerText = window.location.origin + result.encodedUrl;
      document.getElementById('generatedPath').innerText = 'Physical Root Path: ' + result.physicalPath;

      alert('Page Berhasil Dibuat!');
    } catch (err) {
      alert('Gagal: ' + err.message);
    }

    btnSubmit.disabled = false;
    btnSubmit.innerText = 'Create Custom Page';
  });
});
