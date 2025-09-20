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
    dormitorios: '',
    banos: '',
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
      dormitorios: String(payload.dormitorios ?? ''),
      banos: String(payload.banos ?? ''),
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      {/* Header moderno */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Home size={28} /> RentHub
            </div>
            <nav>
              <ul className="nav-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#propiedades">Propiedades</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Sección de búsqueda con fondo degradado */}
        <section className="search-section">
          <div className="search-form-container">
            <h1 className="search-title">Encuentra tu hogar ideal</h1>

            {/* Formulario */}
            <form onSubmit={handleSearch} className="search-form" role="search">
              <div className="search-group">
                <label htmlFor="zona">Zona</label>
                <input
                  type="text"
                  id="zona"
                  name="zona"
                  value={searchData.zona}
                  onChange={handleInputChange}
                  placeholder="Ej: Miraflores, San Isidro..."
                  required
                  className="search-input"
                />
              </div>

              <div className="search-group">
                <label htmlFor="dormitorios">Dormitorios</label>
                <select
                  id="dormitorios"
                  name="dormitorios"
                  value={searchData.dormitorios}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="">Cualquier cantidad</option>
                  <option value="1">1 dormitorio</option>
                  <option value="2">2 dormitorios</option>
                  <option value="3">3 dormitorios</option>
                  <option value="4">4+ dormitorios</option>
                </select>
              </div>

              <div className="search-group">
                <label htmlFor="banos">Baños</label>
                <select
                  id="banos"
                  name="banos"
                  value={searchData.banos}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="">Cualquier cantidad</option>
                  <option value="1">1 baño</option>
                  <option value="2">2 baños</option>
                  <option value="3">3+ baños</option>
                </select>
              </div>

              <div className="search-group">
                <label>Precio (S/)</label>
                <div className="price-group">
                  <input
                    type="number"
                    id="price_min"
                    name="price_min"
                    value={searchData.price_min}
                    onChange={handleInputChange}
                    placeholder="Mínimo"
                    min="0"
                    className="search-input"
                  />
                  <input
                    type="number"
                    id="price_max"
                    name="price_max"
                    value={searchData.price_max}
                    onChange={handleInputChange}
                    placeholder="Máximo"
                    min="0"
                    className="search-input"
                  />
                </div>
              </div>

              <div className="search-group">
                <label htmlFor="palabras_clave">Palabras clave</label>
                <input
                  type="text"
                  id="palabras_clave"
                  name="palabras_clave"
                  value={searchData.palabras_clave}
                  onChange={handleInputChange}
                  placeholder="Ej: piscina, gimnasio, amoblado..."
                  className="search-input"
                />
              </div>

              <button
                type="submit"
                className="search-btn"
                disabled={loading || !searchData.zona.trim()}
              >
                <Search size={20} /> {loading ? 'Buscando...' : 'Buscar Propiedades'}
              </button>
            </form>
          </div>
        </section>

        {/* Sección de propiedades */}
        <section className="properties-section">
          <div className="section-header">
            <h2 className="section-title">Propiedades Disponibles</h2>
            {/* Puedes agregar un select de ordenar aquí si lo deseas */}
          </div>

          {/* Mensajes de estado */}
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <div>Buscando propiedades...</div>
            </div>
          )}

          {error && (
            <div className="error" role="alert">
              <X size={20} />
              {error}
            </div>
          )}

          {hasSearched && !loading && results.length === 0 && !error && (
            <div className="no-results">
              <h3>😔 No se encontraron propiedades</h3>
              <p>Intenta ajustar tus criterios de búsqueda</p>
            </div>
          )}

          {/* Paginación arriba */}
          {results.length > 0 && totalPages > 1 && (
            <div className="pagination" id="paginationTop">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Grid de propiedades */}
          {results.length > 0 && (
            <div className="properties-grid" id="propertiesGrid">
              {pagedResults.map((property) => (
                <div key={property.id} className="property-card" data-category="nuevo">
                  <div className="property-image">
                    {property.imagen_url ? (
                      <img
                        src={property.imagen_url}
                        alt={property.titulo || 'Imagen de propiedad'}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/350x250/f0f4f8/64748b?text=Sin+Imagen'
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <Home size={48} />
                      </div>
                    )}
                  </div>
                  <div className="property-content">
                    <div className="property-price">{formatPrice(property.precio)}</div>
                    <div className="property-title">{property.titulo || 'Sin título'}</div>
                    <div className="property-location">
                      <Calendar size={14} /> {new Date(property.scraped_at).toLocaleDateString('es-ES')} • {property.fuente}
                    </div>
                    <div className="property-features">
                      <div className="feature">
                        <Bed size={14} /> {property.dormitorios || 'N/A'}
                      </div>
                      <div className="feature">
                        <Bath size={14} /> {property.baños || 'N/A'}
                      </div>
                      <div className="feature">
                        <Square size={14} /> {property.m2 || 'N/A'}m²
                      </div>
                    </div>
                    {property.descripcion && (
                      <div className="property-description">
                        {property.descripcion.length > 100 
                          ? property.descripcion.substring(0, 100) + '...'
                          : property.descripcion}
                      </div>
                    )}
                    <div className="property-actions">
                      <a
                        href={property.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        <ExternalLink size={14} /> Contactar
                      </a>
                      <a
                        href={property.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                      >
                        Ver más
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación abajo */}
          {results.length > 0 && totalPages > 1 && (
            <div className="pagination" id="paginationBottom">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Botón flotante para volver arriba */}
      <button className="fab" onClick={scrollToTop} title="Volver arriba">
        ↑
      </button>

      {/* Footer moderno */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3><Home size={24} /> RentHub</h3>
              <p>Tu plataforma confiable para encontrar el hogar perfecto. Conectamos inquilinos con propietarios de manera segura y eficiente.</p>
              <div className="social-icons">
                <a href="#" className="social-icon" title="Facebook">📘</a>
                <a href="#" className="social-icon" title="Instagram">📷</a>
                <a href="#" className="social-icon" title="Twitter">🐦</a>
                <a href="#" className="social-icon" title="LinkedIn">💼</a>
                <a href="#" className="social-icon" title="WhatsApp">💬</a>
              </div>
            </div>
            
            <div className="footer-section">
              <h3>Enlaces Rápidos</h3>
              <ul className="footer-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#propiedades">Ver Propiedades</a></li>
                <li><a href="#publicar">Publicar Propiedad</a></li>
                <li><a href="#servicios">Nuestros Servicios</a></li>
                <li><a href="#blog">Blog y Consejos</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Soporte</h3>
              <ul className="footer-links">
                <li><a href="#ayuda">Centro de Ayuda</a></li>
                <li><a href="#contacto">Contáctanos</a></li>
                <li><a href="#terminos">Términos y Condiciones</a></li>
                <li><a href="#privacidad">Política de Privacidad</a></li>
                <li><a href="#seguridad">Seguridad</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Contacto</h3>
              <p>📧 info@renthub.pe</p>
              <p>📞 +51 1 234-5678</p>
              <p>📍 Av. Javier Prado Este 123<br />San Isidro, Lima - Perú</p>
              <p>🕒 Atención: Lun - Vie 9:00 - 18:00</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} RentHub Perú. Todos los derechos reservados. | Hecho con ❤️ para encontrar tu hogar ideal.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}