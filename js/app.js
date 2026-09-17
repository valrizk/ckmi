/* =========================================================
   VRIZMODS APP.JS
   UI / FRONTEND LOGIC
   Backend & API endpoint TETAP
   ========================================================= */

let allAppsData = [];
let currentCategory = 'ALL';
let currentSearch = '';


/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function getAppIcon(app, size = 80) {
  const url = app?.icon_url;

  if (!url) {
    return `
      <div class="vriz-fallback-icon" aria-hidden="true">
        <span>V</span>
      </div>
    `;
  }

  return `
    <img
      src="${escapeHTML(url)}"
      width="${size}"
      height="${size}"
      class="vriz-card-icon"
      alt="${escapeHTML(app?.title || 'Aplikasi')}"
      loading="lazy"
      onerror="this.style.display='none'; this.nextElementSibling?.classList.remove('d-none');"
    >

    <div
      class="vriz-fallback-icon d-none"
      aria-hidden="true"
    >
      <span>V</span>
    </div>
  `;
}


function getEncodedId(id) {
  return btoa(String(id));
}


function getDetailUrl(id) {
  return `/detail?id=${getEncodedId(id)}`;
}


/* =========================================================
   ROUTER
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const path = window.location.pathname;

  if (path.startsWith('/detail')) {
    initDetailPage();

  } else if (path.startsWith('/admin')) {
    initAdminPage();

  } else {
    initHomePage();
  }

});


/* =========================================================
   1. HOME PAGE
   ========================================================= */

function initHomePage() {

  fetchApps();


  /* -------------------------------------------------------
     SEARCH
     ------------------------------------------------------- */

  const searchInput = document.getElementById('searchInput');

  if (searchInput) {

    searchInput.addEventListener('input', (e) => {

      currentSearch = e.target.value
        .trim()
        .toLowerCase();

      renderAppGrid();

    });

  }


  /* -------------------------------------------------------
     CATEGORY CHIPS
     ------------------------------------------------------- */

  const chips = document.querySelectorAll('.cat-chip');

  chips.forEach(chip => {

    chip.addEventListener('click', () => {

      currentCategory =
        chip.getAttribute('data-cat') || 'ALL';

      updateCategoryChips(chips);

      renderAppGrid();

    });

  });


  /* -------------------------------------------------------
     DRAWER CATEGORY
     ------------------------------------------------------- */

  const drawerBtns =
    document.querySelectorAll('.cat-drawer-btn');

  drawerBtns.forEach(btn => {

    btn.addEventListener('click', (e) => {

      e.preventDefault();

      currentCategory =
        btn.getAttribute('data-cat') || 'ALL';

      updateCategoryChips(chips);

      closeDrawer();

      renderAppGrid();

    });

  });

}


/* =========================================================
   CATEGORY UI
   ========================================================= */

function updateCategoryChips(chips) {

  chips.forEach(chip => {

    const isActive =
      chip.getAttribute('data-cat') === currentCategory;

    chip.classList.toggle('active', isActive);

    chip.setAttribute(
      'aria-selected',
      isActive ? 'true' : 'false'
    );

  });

}


function closeDrawer() {

  const drawerEl =
    document.getElementById('vrizDrawer');

  if (
    drawerEl &&
    typeof bootstrap !== 'undefined'
  ) {

    const drawer =
      bootstrap.Offcanvas.getInstance(drawerEl) ||
      new bootstrap.Offcanvas(drawerEl);

    drawer.hide();

  }

}


/* =========================================================
   FETCH APPS
   ========================================================= */

async function fetchApps() {

  const gridContainer =
    document.getElementById('appGrid');

  if (!gridContainer) return;


  /* Loading */

  gridContainer.innerHTML = `
    <div class="col-12">

      <div class="vriz-card vriz-loading-card">

        <div class="spinner-border spinner-border-sm text-indigo"
             role="status"
             aria-label="Memuat">
        </div>

        <span class="text-secondary small">
          Memuat katalog...
        </span>

      </div>

    </div>
  `;


  try {

    const res =
      await fetch('/api/apps');

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const result =
      await res.json();

    if (!result.success) {
      throw new Error(
        result.message || 'Gagal mengambil data'
      );
    }

    allAppsData =
      Array.isArray(result.data)
        ? result.data
        : [];

    renderAppGrid();


  } catch (err) {

    console.error('fetchApps:', err);

    gridContainer.innerHTML = `
      <div class="col-12">

        <div class="vriz-card vriz-state-card">

          <div class="state-icon state-error">
            !
          </div>

          <h3 class="h6 fw-bold text-white mb-2">
            Gagal Memuat Data
          </h3>

          <p class="text-secondary small mb-0">
            ${escapeHTML(err.message)}
          </p>

        </div>

      </div>
    `;

  }

}


/* =========================================================
   RENDER APP GRID
   ========================================================= */

function renderAppGrid() {

  const gridContainer =
    document.getElementById('appGrid');

  const countBadge =
    document.getElementById('appCount');

  if (!gridContainer) return;


  /* -------------------------------------------------------
     FILTER
     ------------------------------------------------------- */

  let filtered =
    Array.isArray(allAppsData)
      ? [...allAppsData]
      : [];


  /* Category */

  if (currentCategory !== 'ALL') {

    filtered = filtered.filter(app => {

      return (
        app.category || ''
      )
        .toLowerCase() ===
        currentCategory.toLowerCase();

    });

  }


  /* Search */

  if (currentSearch) {

    filtered = filtered.filter(app => {

      const searchableText = [

        app.title,
        app.category,
        app.mod_info,
        app.version,
        app.description

      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        currentSearch
      );

    });

  }


  /* Count */

  if (countBadge) {

    countBadge.textContent =
      `${filtered.length} Berkas`;

  }


  /* Empty */

  if (!filtered.length) {

    gridContainer.innerHTML = `
      <div class="col-12">

        <div class="vriz-card vriz-state-card">

          <div class="state-icon">
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              ></circle>

              <path
                d="m20 20-4-4"
                stroke-linecap="round"
              ></path>
            </svg>
          </div>

          <h3 class="h6 fw-bold text-white mb-2">
            Tidak ditemukan
          </h3>

          <p class="text-secondary small mb-0">
            Tidak ada aplikasi atau game yang cocok.
          </p>

        </div>

      </div>
    `;

    return;

  }


  /* -------------------------------------------------------
     CARD RENDER
     ------------------------------------------------------- */

  gridContainer.innerHTML =
    filtered
      .map(renderAppCard)
      .join('');

}


/* =========================================================
   APP CARD
   ========================================================= */

function renderAppCard(app) {

  const id =
    app?.id;

  if (id === undefined || id === null) {
    return '';
  }


  const detailUrl =
    getDetailUrl(id);


  const title =
    escapeHTML(
      app.title || 'Tanpa Nama'
    );


  const category =
    escapeHTML(
      app.category || 'Apps'
    );


  const modInfo =
    escapeHTML(
      app.mod_info || 'Original'
    );


  const size =
    escapeHTML(
      app.size || '-'
    );


  const version =
    escapeHTML(
      app.version || 'v1.0'
    );


  return `
    <div class="col-12 col-md-6">

      <article
        class="vriz-card vriz-app-card"
        role="article"
      >

        <!-- CARD MAIN -->
        <a
          href="${detailUrl}"
          class="vriz-card-main text-decoration-none"
          aria-label="Lihat detail ${title}"
        >

          <!-- ICON -->
          <div class="vriz-card-icon-wrap">

            ${getAppIcon(app, 72)}

          </div>


          <!-- CONTENT -->
          <div class="vriz-card-body">

            <div class="vriz-card-heading">

              <h2 class="vriz-card-title">
                ${title}
              </h2>

            </div>


            <!-- CATEGORY -->
            <div class="vriz-card-meta">

              <span class="vriz-tag-mod">
                ${modInfo}
              </span>

              <span class="vriz-meta-dot">
                •
              </span>

              <span>
                ${category}
              </span>

            </div>


            <!-- INFO -->
            <div class="vriz-card-submeta">

              <span>
                ${version}
              </span>

              <span>
                ${size}
              </span>

            </div>

          </div>

        </a>


        <!-- CARD ACTION -->
        <div class="vriz-card-footer">

          <a
            href="${detailUrl}"
            class="btn-card-action"
            aria-label="Unduh ${title}"
          >
            <span>Detail & Unduh</span>

            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M5 12h14"
                stroke-linecap="round"
              ></path>

              <path
                d="m13 6 6 6-6 6"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>

            </svg>

          </a>

        </div>

      </article>

    </div>
  `;

}


/* =========================================================
   2. DETAIL PAGE
   ========================================================= */

async function initDetailPage() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const rawId =
    urlParams.get('id');


  if (!rawId) {

    window.location.href = '/';
    return;

  }


  const appHeader =
    document.getElementById('appHeader');

  const appDescription =
    document.getElementById('appDescription');

  const btnStartDownload =
    document.getElementById(
      'btnStartDownload'
    );

  const downloadArea =
    document.getElementById(
      'downloadArea'
    );


  try {

    const res =
      await fetch(
        `/api/apps/detail?id=${encodeURIComponent(rawId)}`
      );


    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }


    const result =
      await res.json();


    if (!result.success) {
      throw new Error(
        result.message ||
        'Detail tidak ditemukan'
      );
    }


    const app =
      result.data;


    if (!app) {
      throw new Error(
        'Data aplikasi kosong'
      );
    }


    /* -------------------------------------------------------
       PAGE TITLE
       ------------------------------------------------------- */

    if (app.title) {

      document.title =
        `${app.title} - Vrizmods`;

    }


    /* -------------------------------------------------------
       APP HEADER
       ------------------------------------------------------- */

    if (appHeader) {

      appHeader.innerHTML =
        renderDetailHeader(app);

    }


    /* -------------------------------------------------------
       DESCRIPTION
       ------------------------------------------------------- */

    if (appDescription) {

      appDescription.textContent =
        app.description ||
        'Tidak ada deskripsi rincian untuk berkas ini.';

    }


    /* -------------------------------------------------------
       DOWNLOAD
       ------------------------------------------------------- */

    setupDownloadButton(
      app,
      btnStartDownload,
      downloadArea
    );


  } catch (err) {

    console.error(
      'initDetailPage:',
      err
    );


    if (appHeader) {

      appHeader.innerHTML = `
        <div class="vriz-state-card">

          <div class="state-icon state-error">
            !
          </div>

          <h1 class="h6 fw-bold text-white mb-2">
            Detail Tidak Dapat Dimuat
          </h1>

          <p class="text-secondary small mb-3">
            ${escapeHTML(err.message)}
          </p>

          <a
            href="/"
            class="btn-card-action text-decoration-none"
          >
            Kembali ke Beranda
          </a>

        </div>
      `;

    }

    if (appDescription) {
      appDescription.textContent = '-';
    }

  }

}


/* =========================================================
   DETAIL HEADER
   ========================================================= */

function renderDetailHeader(app) {

  const title =
    escapeHTML(
      app.title || 'Tanpa Nama'
    );


  const category =
    escapeHTML(
      app.category || 'Apps'
    );


  const modInfo =
    escapeHTML(
      app.mod_info || 'Original'
    );


  const size =
    escapeHTML(
      app.size || '-'
    );


  const version =
    escapeHTML(
      app.version || 'v1.0'
    );


  return `
    <div class="detail-app-header">

      <!-- ICON -->
      <div class="detail-icon-wrap">

        ${getAppIcon(app, 88)}

      </div>


      <!-- INFO -->
      <div class="detail-app-info">

        <div class="detail-badge-group">

          <span class="vriz-tag-mod">
            ${modInfo}
          </span>

          <span class="detail-dot">
            •
          </span>

          <span class="detail-category">
            ${category}
          </span>

        </div>


        <h1 class="detail-app-title">
          ${title}
        </h1>


        <div class="detail-spec-grid">

          <div class="detail-spec-item">

            <span class="detail-spec-label">
              Ukuran
            </span>

            <strong>
              ${size}
            </strong>

          </div>


          <div class="detail-spec-item">

            <span class="detail-spec-label">
              Versi
            </span>

            <strong>
              ${version}
            </strong>

          </div>

        </div>

      </div>

    </div>
  `;

}


/* =========================================================
   DOWNLOAD BUTTON
   ========================================================= */

function setupDownloadButton(
  app,
  button,
  downloadArea
) {

  if (!button || !downloadArea) {
    return;
  }


  /* Tidak ada link download */

  if (!app.download_url) {

    button.disabled = true;

    button.textContent =
      'Berkas Tidak Tersedia';

    return;

  }


  let isPreparing = false;


  button.addEventListener(
    'click',
    () => {

      if (isPreparing) {
        return;
      }


      isPreparing = true;

      button.disabled = true;


      let timeLeft = 5;


      button.innerHTML = `
        <span class="download-loading">

          <span class="spinner-border spinner-border-sm"
                aria-hidden="true">
          </span>

          Menyiapkan berkas
          <strong>${timeLeft}s</strong>

        </span>
      `;


      const timer =
        setInterval(() => {

          timeLeft--;


          if (timeLeft > 0) {

            button.innerHTML = `
              <span class="download-loading">

                <span class="spinner-border spinner-border-sm"
                      aria-hidden="true">
                </span>

                Menyiapkan berkas
                <strong>${timeLeft}s</strong>

              </span>
            `;

            return;

          }


          clearInterval(timer);


          const downloadUrl =
            escapeHTML(
              app.download_url
            );


          const size =
            escapeHTML(
              app.size || ''
            );


          downloadArea.innerHTML = `
            <a
              href="${downloadUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-card-action btn-download-ready w-100 text-center text-decoration-none fw-bold"
            >

              <span>
                Unduh Berkas Sekarang
                ${size ? `(${size})` : ''}
              </span>

              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <path
                  d="M12 3v12"
                  stroke-linecap="round"
                ></path>

                <path
                  d="m7 10 5 5 5-5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>

                <path
                  d="M5 21h14"
                  stroke-linecap="round"
                ></path>

              </svg>

            </a>
          `;


        }, 1000);

    }
  );

}


/* =========================================================
   3. ADMIN PAGE
   Backend tetap sama
   ========================================================= */

function initAdminPage() {

  const loginBox =
    document.getElementById('loginBox');

  const adminContent =
    document.getElementById('adminContent');

  const loginForm =
    document.getElementById('loginForm');

  const btnLogout =
    document.getElementById('btnLogout');


  if (
    !loginBox ||
    !adminContent ||
    !loginForm
  ) {
    return;
  }


  /* -------------------------------------------------------
     SESSION CHECK
     ------------------------------------------------------- */

  if (
    sessionStorage.getItem(
      'isAdminLoggedIn'
    ) === 'true'
  ) {

    loginBox.classList.add('d-none');

    adminContent.classList.remove(
      'd-none'
    );
// Panggil di dalam pengecekan session/login berhasil:
fetchAdminApps();

  }


  /* -------------------------------------------------------
     LOGIN
     ------------------------------------------------------- */

  loginForm.addEventListener(
    'submit',
    (e) => {

      e.preventDefault();


      const user =
        document.getElementById(
          'adminUser'
        )?.value || '';


      const pass =
        document.getElementById(
          'adminPass'
        )?.value || '';


      if (
        user === '123' &&
        pass === '123'
      ) {

        sessionStorage.setItem(
          'isAdminLoggedIn',
          'true'
        );

        sessionStorage.setItem(
          'adminUser',
          user
        );

        sessionStorage.setItem(
          'adminPass',
          pass
        );


        loginBox.classList.add(
          'd-none'
        );

        adminContent.classList.remove(
          'd-none'
        );


        loginForm.reset();


      } else {

        alert(
          'Username atau Password Salah!'
        );

      }

    }
  );


  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  if (btnLogout) {

    btnLogout.addEventListener(
      'click',
      () => {

        sessionStorage.clear();

        adminContent.classList.add(
          'd-none'
        );

        loginBox.classList.remove(
          'd-none'
        );

      }
    );

  }


  /* -------------------------------------------------------
     ADD APP
     ------------------------------------------------------- */

  const form =
    document.getElementById(
      'addAppForm'
    );

  const btnSubmit =
    document.getElementById(
      'btnSubmit'
    );


  if (!form || !btnSubmit) {
    return;
  }


  form.addEventListener(
    'submit',
    async (e) => {

      e.preventDefault();


      btnSubmit.disabled = true;

      btnSubmit.innerText =
        'Menyimpan...';


      const payload = {

        user:
          sessionStorage.getItem(
            'adminUser'
          ),

        pass:
          sessionStorage.getItem(
            'adminPass'
          ),

        title:
          document.getElementById(
            'title'
          )?.value.trim() || '',

        category:
          document.getElementById(
            'category'
          )?.value || '',

        version:
          document.getElementById(
            'version'
          )?.value.trim() || '',

        size:
          document.getElementById(
            'size'
          )?.value.trim() || '',

        mod_info:
          document.getElementById(
            'mod_info'
          )?.value.trim() || '',

        icon_url:
          document.getElementById(
            'icon_url'
          )?.value.trim() || '',

        download_url:
          document.getElementById(
            'download_url'
          )?.value.trim() || '',

        description:
          document.getElementById(
            'description'
          )?.value.trim() || ''

      };


      try {

        const res =
          await fetch(
            '/api/apps/add',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(payload)

            }
          );


        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}`
          );
        }


        const result =
          await res.json();


        if (!result.success) {
          throw new Error(
            result.message ||
            'Gagal menyimpan data'
          );
        }


        alert(
          result.message
        );


        form.reset();


      } catch (err) {

        console.error(
          'addApp:',
          err
        );

        alert(
          'Gagal: ' +
          err.message
        );

      } finally {

        btnSubmit.disabled =
          false;

        btnSubmit.innerText =
          'Simpan Data APK';

      }

    }
  );

}

// Fetch & Render Daftar Hapus untuk Admin
async function fetchAdminApps() {
  const container = document.getElementById('adminAppList');
  if (!container) return;

  try {
    const res = await fetch('/api/apps');
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    const apps = result.data || [];
    if (apps.length === 0) {
      container.innerHTML = `<div class="text-secondary small text-center py-3">Belum ada APK yang ditambahkan.</div>`;
      return;
    }

    container.innerHTML = apps.map(app => `
      <div class="d-flex align-items-center justify-content-between p-2 rounded border border-secondary border-opacity-10" style="background: rgba(255,255,255,0.02);">
        <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
          <img src="${app.icon_url || 'https://via.placeholder.com/40'}" width="36" height="36" class="rounded" style="object-fit:cover;">
          <div class="text-truncate">
            <h6 class="text-white small mb-0 text-truncate" style="font-weight:600;">${app.title}</h6>
            <span class="text-secondary" style="font-size:0.7rem;">${app.category} • ${app.size}</span>
          </div>
        </div>
        <button onclick="deleteApp(${app.id})" class="btn-card-action text-danger border-danger border-opacity-25 py-1 px-2" style="background: transparent; font-size:0.75rem;">
          Hapus
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-danger small text-center py-2">Gagal memuat list: ${err.message}</div>`;
  }
}

// Trigger Hapus APK
async function deleteApp(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus APK ini?')) return;

  const payload = {
    user: sessionStorage.getItem('adminUser'),
    pass: sessionStorage.getItem('adminPass'),
    id: id
  };

  try {
    const res = await fetch('/api/apps/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    alert(result.message);
    fetchAdminApps();
  } catch (err) {
    alert('Gagal menghapus: ' + err.message);
  }
}
