require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing File Statis Publik
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/developer', express.static(path.join(__dirname, 'developer')));

// Proteksi URL Clean (.html Redirect)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const cleanPath = req.path.slice(0, -5);
    const query = req.url.slice(req.path.length);
    if (cleanPath === '/index' || cleanPath === '') {
      return res.redirect(301, '/' + query);
    }
    return res.redirect(301, cleanPath + query);
  }
  next();
});

// ==========================================================
// API DEV: Generator Page ke Supabase (Vercel Serverless Safe)
// ==========================================================
app.post('/api/dev/create-page', async (req, res) => {
  try {
    const { user, pass, slug, html, css, js, hasExtra, extraFileName, extraFileContent } = req.body;

    if (user !== '123' || pass !== '123') {
      return res.status(401).json({ success: false, message: 'Unauthorized Dev' });
    }

    if (!slug) return res.status(400).json({ success: false, message: 'Slug Wajib Diisi' });

    // Generate Hash Unik
    const hash = crypto.createHash('sha256').update(slug + Date.now().toString()).digest('hex');

    const payload = {
      hash,
      slug,
      html: html || '',
      css: css || '',
      js: js || '',
      has_extra: hasExtra || false,
      extra_file_name: extraFileName ? extraFileName.trim() : null,
      extra_file_content: extraFileContent || ''
    };

    const { error } = await supabase.from('custom_pages').insert([payload]);
    if (error) throw error;

    const encodedUrl = `/category/${hash}`;

    res.json({
      success: true,
      encodedUrl: encodedUrl,
      physicalPath: `Supabase Record [hash: ${hash}]`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// DYNAMIC VIRTUAL ROUTER: Serves Custom Page & Extra Files (sw.js)
// ==========================================================

// 1. Serving Virtual Root Sub-Files (misal: /category/[hash]/sw.js, style.css, script.js)
app.get('/category/:hash/:filename', async (req, res, next) => {
  const { hash, filename } = req.params;

  try {
    const { data: page, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('hash', hash)
      .single();

    if (error || !page) return next();

    // Jika meminta file CSS
    if (filename === 'style.css') {
      res.setHeader('Content-Type', 'text/css');
      return res.send(page.css || '');
    }

    // Jika meminta file JS utama
    if (filename === 'script.js') {
      res.setHeader('Content-Type', 'application/javascript');
      return res.send(page.js || '');
    }

    // Jika meminta File Tambahan (misal sw.js atau file verifikasi iklan)
    if (page.has_extra && page.extra_file_name && filename === page.extra_file_name) {
      if (filename.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filename.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filename.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      } else {
        res.setHeader('Content-Type', 'text/plain');
      }
      return res.send(page.extra_file_content || '');
    }

    next();
  } catch (err) {
    next();
  }
});

// 2. Serving Virtual HTML Main Page (/category/[hash])
app.get('/category/:hash', async (req, res, next) => {
  const { hash } = req.params;

  try {
    const { data: page, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('hash', hash)
      .single();

    if (error || !page) return next();

    const fullHtmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.slug}</title>
  <link rel="stylesheet" href="/category/${hash}/style.css">
</head>
<body>
  ${page.html || ''}
  <script src="/category/${hash}/script.js"></script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(fullHtmlContent);
  } catch (err) {
    next();
  }
});

// ==========================================
// PUBLIC & ADMIN API ENDPOINTS (SUPABASE)
// ==========================================

app.get('/api/apps', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('apps').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/apps/detail', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'ID dibutuhkan' });

    let appId;
    try {
      appId = Buffer.from(id, 'base64').toString('ascii');
    } catch (e) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const { data, error } = await supabase.from('apps').select('*').eq('id', appId).single();
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/apps/add', async (req, res) => {
  try {
    const { user, pass, title, category, version, size, mod_info, icon_url, download_url, description } = req.body;

    if (user !== '123' || pass !== '123') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const payload = {
      title,
      slug,
      category,
      version,
      size,
      mod_info: mod_info || 'Original',
      icon_url,
      download_url,
      description
    };

    const { data, error } = await supabase.from('apps').insert([payload]);
    if (error) throw error;

    res.json({ success: true, message: 'APK Berhasil Ditambahkan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/apps/delete', async (req, res) => {
  try {
    const { user, pass, id } = req.body;

    if (user !== '123' || pass !== '123') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!id) return res.status(400).json({ success: false, message: 'ID aplikasi wajib diisi' });

    const { error } = await supabase.from('apps').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'APK Berhasil Dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// PAGE ROUTING
// ==========================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'detail.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/dev', (req, res) => {
  res.sendFile(path.join(__dirname, 'developer', 'dev.html'));
});

app.use((req, res) => {
  res.status(404).send('<h2 style="color:white;text-align:center;margin-top:50px;">404 - Halaman Tidak Ditemukan</h2>');
});

// Jalankan Server (Hanya jika di-run secara lokal)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server Vrizmods aktif di http://localhost:${PORT}`);
  });
}

// Export app untuk Vercel Serverless
module.exports = app;
