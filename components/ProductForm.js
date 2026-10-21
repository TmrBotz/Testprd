'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slug';

export default function ProductForm({ product }) {
  const router = useRouter();
  const isEdit = !!(product && product._id);
  const counter = useRef(0);

  function nextId() {
    counter.current += 1;
    return counter.current;
  }

  const [title, setTitle] = useState(product && product.title ? product.title : '');
  const [slug, setSlug] = useState(product && product.slug ? product.slug : '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [price, setPrice] = useState(
    product && product.price !== undefined && product.price !== null ? String(product.price) : ''
  );
  const [imageUrl, setImageUrl] = useState(product && product.imageUrl ? product.imageUrl : '');
  const [description, setDescription] = useState(product && product.description ? product.description : '');
  const [featuresText, setFeaturesText] = useState(
    product && Array.isArray(product.features) ? product.features.join('\n') : ''
  );
  const [links, setLinks] = useState(() => {
    const src = product && Array.isArray(product.links) ? product.links : [];
    return src.map((l) => ({ id: nextId(), title: l.title || '', url: l.url || '' }));
  });
  const [status, setStatus] = useState(product && product.status ? product.status : 'draft');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function handleTitle(e) {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function handleSlug(e) {
    setSlugTouched(true);
    setSlug(slugify(e.target.value));
  }

  function addLink() {
    setLinks((prev) => [...prev, { id: nextId(), title: '', url: '' }]);
  }

  function removeLink(id) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLink(id, field, value) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || deleting) return;
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }
    const priceNum = Number(price);
    if (price === '' || !Number.isFinite(priceNum) || priceNum < 0) {
      setError('Enter a valid price (0 or more).');
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      price: priceNum,
      imageUrl: imageUrl.trim(),
      description,
      features: featuresText.split(/\r?\n/).map((f) => f.trim()).filter(Boolean),
      links: links.map((l) => ({ title: l.title.trim(), url: l.url.trim() })),
      status,
    };

    setSaving(true);
    try {
      const res = await fetch(isEdit ? '/api/admin/products/' + product._id : '/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Could not save the product.');
        setSaving(false);
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || saving || deleting) return;
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products/' + product._id, { method: 'DELETE' });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Could not delete the product.');
        setDeleting(false);
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack" noValidate>
      <div className="card stack">
        <div className="field">
          <label className="label" htmlFor="pf-title">Title</label>
          <input id="pf-title" className="input" type="text" value={title} onChange={handleTitle} maxLength={120} />
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-slug">Slug (URL)</label>
          <input id="pf-slug" className="input" type="text" value={slug} onChange={handleSlug} maxLength={80} />
          <div className="hint">Product URL: /p/{slug || 'your-slug'}</div>
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-price">Price (INR)</label>
          <input
            id="pf-price"
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-image">Image URL</label>
          <input
            id="pf-image"
            className="input"
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            maxLength={1000}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-desc">Description</label>
          <textarea
            id="pf-desc"
            className="textarea"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-features">Features (one per line)</label>
          <textarea
            id="pf-features"
            className="textarea"
            rows={5}
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-status">Status</label>
          <select id="pf-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (visible)</option>
          </select>
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">Product links (shown after payment)</div>
        {links.length === 0 ? <div className="hint">No links yet. Add the files or pages buyers receive.</div> : null}
        {links.map((l) => (
          <div className="link-row" key={l.id}>
            <input
              className="input"
              type="text"
              placeholder="Link title"
              aria-label="Link title"
              value={l.title}
              onChange={(e) => updateLink(l.id, 'title', e.target.value)}
              maxLength={120}
            />
            <input
              className="input"
              type="url"
              placeholder="https://..."
              aria-label="Link URL"
              value={l.url}
              onChange={(e) => updateLink(l.id, 'url', e.target.value)}
              maxLength={2000}
            />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLink(l.id)}>
              Remove
            </button>
          </div>
        ))}
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addLink}>
            + Add link
          </button>
        </div>
      </div>

      {error ? (
        <div className="notice notice-err" role="alert">
          {error}
        </div>
      ) : null}

      <div className="item-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || deleting}>
          {saving ? 'Saving...' : 'Save product'}
        </button>
        {isEdit ? (
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving || deleting}>
            {deleting ? 'Deleting...' : 'Delete product'}
          </button>
        ) : null}
      </div>
    </form>
  );
}
