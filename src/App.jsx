import React, { useEffect, useMemo, useState } from 'react'
import { Search, Home, ExternalLink, Bed, Bath, Square, Calendar, TrendingUp, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'

import './index.css'

// === Config API ===
const API = import.meta.env.VITE_API_URL
if (!API) {
  console.error('VITE_API_URL no está definida')
  alert('Configura VITE_API_URL en Vercel (frontend) y redeploya.')
}

// === Constantes UI ===
const PAGE_SIZE = 20
const LS_KEY_RECENTS = 'scraper_recents_v1'

export default function App() {
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '0',
    banos: '0',
    price_min: '',
    price_max: '',
    palabras_clave: ''
  })

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [trending, setTrending] = useState([])
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_RECENTS)) || [] } catch { return [] }
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e) => {
    e?.preventDefault?.()
    if (!searchData.zona.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)
    setPage(1)

    try {
      const params = {
        zona: searchData.zona.trim(),
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave.trim()
      }

      const response = await axios.get(`${API}/search`, { params })

      if (response.data.success) {
        const props = Array.isArray(response.data.properties) ? response.data.properties : []
        setResults(props)
        saveRecent(params)
      } else {
        setError(response.data.message || 'No se encontraron resultados')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor. Inténtalo más tarde.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveRecent = (params) => {
    const entry = {
      ...params,
      ts: Date.now()
    }
    const cleaned = dedupeRecents([entry, ...recents]).slice(0, 8)
    setRecents(cleaned)
    try { localStorage.setItem(LS_KEY_RECENTS, JSON.stringify(cleaned)) } catch {}
  }

  const dedupeRecents = (list) => {
    const seen = new Set()
    return list.filter(r => {
      const key = `${r.zona}|${r.dormitorios}|${r.banos}|${r.price_min}|${r.price_max}|${r.palabras_clave}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  useEffect(() => {
    let cancel = false
    const fetchTrending = async () => {
      try {
        const url = `${API}/trending`
        const res = await axios.get(url)
        if (!cancel && Array.isArray(res.data?.items)) {
          setTrending(res.data.items.slice(0, 6))
        }
      } catch (_) {}
    }
    fetchTrending()
    return () => { cancel = true }
  }, [])

  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pagedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return results.slice(start, end)
  }, [results, page])

  const formatPrice = (price) => {
    if (!price) return 'Precio no disponible'
    return price.toString().replace('S/', 'S/ ').replace('S/.', 'S/ ')
  }

  const applyQuickSearch = (payload) => {
    setSearchData(prev => ({
      ...prev,
      zona: payload.zona || '',
      dormitorios: String(payload.dormitorios ?? '0'),
      banos: String(payload.banos ?? '0'),
      price_min: payload.price_min || '',
      price_max: payload.price_max || '',
      palabras_clave: payload.palabras_clave || ''
    }))
    setTimeout(() => handleSearch(), 0)
  }

  const clearRecents = () => {
    setRecents([])
    try { localStorage.removeItem(LS_KEY_RECENTS) } catch {}
  }

  return (
    <div className="app">
      {/* Header mejorado */}
      <header className="header">
        <div className="container">
          <h1>
            <Home size={28} />
            Scraper de Alquileres | J
          </h1>
        </div>
      </header>

      <main className="container">
        <section className="search-section">
          {/* Sección de búsquedas rápidas */}
          {(trending.length > 0 || recents.length > 0) && (
            <section className="trending">
              {trending.length > 0 && (
                <div className="trend-block">
                  <h3><TrendingUp size={20} /> Búsquedas populares</h3>
                  <div className="chip-wrap">
                    {trending.map((t, i) => (
                      <button
                        key={`t-${i}`}
                        className="chip"
                        onClick={() => applyQuickSearch(t)}
                        aria-label={`Buscar: ${t.zona || 'zona'}${t.dormitorios ? ` con ${t.dormitorios} dormitorios` : ''}`}
                      >
                        {t.zona}{t.dormitorios && ` · ${t.dormitorios} hab`}{t.banos && ` · ${t.banos} baños`}
                        {(t.price_min || t.price_max) && ` · S/ ${t.price_min || 0}–${t.price_max || '∞'}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recents.length > 0 && (
                <div className="trend-block">
                  <div className="trend-head">
                    <h3><Clock size={20} /> Tus últimas búsquedas</h3>
                    <button
                      className="chip clear"
                      onClick={clearRecents}
                      aria-label="Limpiar historial de búsquedas"
                    >
                      <X size={14} /> Limpiar
                    </button>
                  </div>
                  <div className="chip-wrap">
                    {recents.map((r, i) => (
                      <button
                        key={`r-${i}`}
                        className="chip"
                        onClick={() => applyQuickSearch(r)}
                        aria-label={`Repetir búsqueda: ${r.zona}`}
                      >
                        {r.zona}{r.dormitorios !== '0' && ` · ${r.dormitorios} hab`}{r.banos !== '0' && ` · ${r.banos} baños`}
                        {(r.price_min || r.price_max) && ` · S/ ${r.price_min || 0}–${r.price_max || '∞'}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Formulario principal */}
          <form onSubmit={handleSearch} className="search-form" role="search">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="zona">
                  <Home size={16} /> Zona
                </label>
                <input
                  type="text"
                  id="zona"
                  name="zona"
                  value={searchData.zona}
                  onChange={handleInputChange}
                  placeholder="Ej: Miraflores, San Isidro, Surco..."
                  required
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dormitorios">
                  <Bed size={16} /> Dormitorios
                </label>
                <select
                  id="dormitorios"
                  name="dormitorios"
                  value={searchData.dormitorios}
                  onChange={handleInputChange}
                >
                  <option value="0">Cualquiera</option>
                  <option value="1">1 dormitorio</option>
                  <option value="2">2 dormitorios</option>
                  <option value="3">3 dormitorios</option>
                  <option value="4">4+ dormitorios</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="banos">
                  <Bath size={16} /> Baños
                </label>
                <select
                  id="banos"
                  name="banos"
                  value={searchData.banos}
                  onChange={handleInputChange}
                >
                  <option value="0">Cualquiera</option>
                  <option value="1">1 baño</option>
                  <option value="2">2 baños</option>
                  <option value="3">3+ baños</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price_min">
                  <TrendingUp size={16} /> Precio Mínimo (S/)
                </label>
                <input
                  type="number"
                  id="price_min"
                  name="price_min"
                  value={searchData.price_min}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price_max">
                  <TrendingUp size={16} /> Precio Máximo (S/)
                </label>
                <input
                  type="number"
                  id="price_max"
                  name="price_max"
                  value={searchData.price_max}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="palabras_clave">
                  <Search size={16} /> Palabras clave
                </label>
                <input
                  type="text"
                  id="palabras_clave"
                  name="palabras_clave"
                  value={searchData.palabras_clave}
                  onChange={handleInputChange}
                  placeholder="Ej: piscina, amoblado, mascotas permitidas..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="search-button"
              disabled={loading || !searchData.zona.trim()}
              aria-label="Buscar propiedades"
            >
              <Search size={20} />
              {loading ? 'Buscando...' : 'Buscar Propiedades'}
            </button>
          </form>

          {/* Feedback al usuario */}
          {error && (
            <div className="error" role="alert">
              <X size={20} />
              {error}
            </div>
          )}

          {loading && <div className="loading">Buscando propiedades... Espere un momento</div>}

          {hasSearched && !loading && results.length === 0 && !error && (
            <div className="results-info">
              <h3>🔍 No se encontraron propiedades</h3>
              <p>Prueba con otros filtros o una zona diferente</p>
            </div>
          )}

          {/* Resultados y paginación */}
          {results.length > 0 && (
          <>
            <div className="results-info">
              <div className="results-summary">
                <span className="checkmark">✅</span>
                <span>{total} propiedades encontradas</span>
                <p>Mostrando {pagedResults.length} de {total} — Página {page} de {totalPages}</p>
              </div>
            </div>

            {/* Paginación arriba */}
            {totalPages > 1 && (
              <div className="pagination top-pagination">
                {page > 1 && (
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => p - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-number ${pageNum === page ? 'active' : ''}`}
                      onClick={() => setPage(pageNum)}
                      aria-current={pageNum === page ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {page < totalPages && (
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Página siguiente"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="properties-grid" role="list">
              {pagedResults.map((property) => (
                <article key={property.id} className="property-card" role="listitem">
                  <div className="property-image">
                    {property.imagen_url ? (
                      <img
                        src={property.imagen_url}
                        alt={property.titulo || 'Imagen de propiedad'}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/360x220/f0f4f8/64748b?text=Sin+Imagen'
                        }}
                      />
                    ) : (
                      <div className="fallback-image">
                        <Home size={48} />
                      </div>
                    )}
                  </div>
                  <div className="property-content">
                    <h3 className="property-title">{property.titulo || 'Sin título'}</h3>
                    <div className="property-price">{formatPrice(property.precio)}</div>
                    <div className="property-details">
                      <div className="detail-item">
                        <Bed size={14} />
                        {property.dormitorios || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <Bath size={14} />
                        {property.baños || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <Square size={14} />
                        {property.m2 || 'N/A'} m²
                      </div>
                    </div>
                    {property.descripcion && <p>{property.descripcion}</p>}
                    <div className="property-footer">
                      <span>
                        <Calendar size={12} /> {new Date(property.scraped_at).toLocaleDateString('es-ES')} • {property.fuente}
                      </span>
                      <a
                        href={property.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="visit-button"
                        aria-label={`Visitar propiedad: ${property.titulo}`}
                      >
                        <ExternalLink size={14} /> Ver
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Paginación abajo */}
            {totalPages > 1 && (
              <div className="pagination bottom-pagination">
                {page > 1 && (
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => p - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-number ${pageNum === page ? 'active' : ''}`}
                      onClick={() => setPage(pageNum)}
                      aria-current={pageNum === page ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {page < totalPages && (
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Página siguiente"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container">
          <p>© {new Date().getFullYear()} Scraper de Alquileres — Encuentra tu próximo hogar</p>
          <p>Datos obtenidos de múltiples portales inmobiliarios. Actualizado diariamente.</p>
        </div>
      </footer>
    </div>
  )
}