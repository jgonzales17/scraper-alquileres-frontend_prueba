import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

// === Config API ===
const API = import.meta.env.VITE_API_URL;
if (!API) {
  console.error('VITE_API_URL no está definida');
  alert('Configura VITE_API_URL en Vercel (frontend) y redeploya.');
}

// === Constantes UI ===
const PAGE_SIZE = 9;

export default function App() {
  const [searchData, setSearchData] = useState({
    zona: '',
    dormitorios: '',
    banos: '',
    price_min: '',
    price_max: '',
    palabras_clave: ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchData.zona.trim()) {
      alert('Por favor ingresa una ubicación para buscar');
      return;
    }

    setLoading(true);
    setError('');
    setPage(1);

    try {
      const params = {
        zona: searchData.zona.trim(),
        dormitorios: searchData.dormitorios,
        banos: searchData.banos,
        ...(searchData.price_min && { price_min: parseInt(searchData.price_min) }),
        ...(searchData.price_max && { price_max: parseInt(searchData.price_max) }),
        palabras_clave: searchData.palabras_clave.trim()
      };

      const response = await axios.get(`${API}/search`, { params });

      if (response.data.success) {
        const props = Array.isArray(response.data.properties) ? response.data.properties : [];
        setResults(props);
      } else {
        setError(response.data.message || 'No se encontraron resultados');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor. Inténtalo más tarde.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Precio no disponible';
    return price.toString().replace('S/', 'S/ ').replace('S/.', 'S/ ');
  };

  return (
    <div className="app">
      <header>
        <nav>
          <div className="logo">ScraperPrueba</div>
          <ul className="nav-links">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#propiedades">Propiedades</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Encuentra tu hogar ideal</h1>
          <p>Descubre los mejores departamentos para alquilar en la ciudad</p>
        </div>
      </section>

      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-main">
            <input
              type="text"
              className="location-input"
              placeholder="¿Dónde quieres vivir? Ej: San Isidro, Miraflores, Surco..."
              name="zona"
              value={searchData.zona}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="search-btn">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="dormitorios">Dormitorios</label>
              <select
                id="dormitorios"
                name="dormitorios"
                value={searchData.dormitorios}
                onChange={handleInputChange}
              >
                <option value="">Cualquiera</option>
                <option value="1">1 dormitorio</option>
                <option value="2">2 dormitorios</option>
                <option value="3">3 dormitorios</option>
                <option value="4">4+ dormitorios</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="banos">Baños</label>
              <select
                id="banos"
                name="banos"
                value={searchData.banos}
                onChange={handleInputChange}
              >
                <option value="">Cualquiera</option>
                <option value="1">1 baño</option>
                <option value="2">2 baños</option>
                <option value="3">3 baños</option>
                <option value="4">4+ baños</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Rango de precio (S/)</label>
                <div className="price-range">
                  <input 
                      type="number" 
                      placeholder="Precio mín." 
                      min="0" 
                      name="price_min" 
                      value={searchData.price_min} 
                      onChange={handleInputChange}
                      style={{ width: '120px' }}
                  />
                  <span>-</span>
                  <input 
                      type="number" 
                      placeholder="Precio máx." 
                      min="0" 
                      name="price_max" 
                      value={searchData.price_max} 
                      onChange={handleInputChange}
                      style={{ width: '120px' }}
                  />
              </div>
            </div>
            
            <div className="filter-group">
              <label htmlFor="caracteristicas">Características especiales</label>
              <input
                type="text"
                id="caracteristicas"
                name="palabras_clave"
                placeholder="Ej: amoblado, cochera, terraza..."
                value={searchData.palabras_clave}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-message">{error}</div>
        </div>
      )}

      <section className="featured">
        <div className="container">
          <h2 className="section-title">Propiedades Encontradas</h2>
          
          {loading && <div className="loading">Buscando propiedades... Espere un momento</div>}

          {results.length > 0 && (
            <>
              {/* Paginación Superior */}
              <div className="pagination">
                <button
                  className="pagination-btn prev"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Atrás
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  className="pagination-btn next"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Siguiente →
                </button>
              </div>

              <div className="properties-grid">
                {pagedResults.map((property, index) => (
                  <div key={index} className="property-card">
                    <div className="property-image">
                      {property.imagen_url ? (
                        <img
                          src={property.imagen_url}
                          alt={property.titulo}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="placeholder">🏢</div>
                      )}
                    </div>
                    <div className="property-info">
                      <h3 className="property-title">{property.titulo || 'Sin título'}</h3>
                      <div className="property-price">{formatPrice(property.precio)}</div>
                      <div className="property-features">
                        <span className="feature">🛏️ {property.dormitorios || 'N/A'} dorm.</span>
                        <span className="feature">🚿 {property.baños || 'N/A'} baños</span>
                        <span className="feature">📏 {property.m2 || 'N/A'}</span>
                      </div>
                      <a
                        href={property.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="details-btn"
                      >
                        Ver detalles
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación Inferior */}
              <div className="pagination">
                <button
                  className="pagination-btn prev"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Atrás
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  className="pagination-btn next"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}

          {results.length === 0 && !loading && !error && (
            <div className="no-results">
              <h3>🔍 No se encontraron propiedades</h3>
              <p>Prueba con otros filtros o una zona diferente</p>
            </div>
          )}
        </div>
      </section>

      <section className="hotel-background">
        <div className="hotel-content">
          <h2>Tu nuevo hogar te espera</h2>
          <p>Encuentra departamentos de alta calidad con todas las comodidades que necesitas para vivir cómodamente en la mejor ubicación de la ciudad.</p>
        </div>
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h3>RentHome</h3>
            <p>La plataforma líder en alquiler de departamentos. Conectamos propietarios con inquilinos de manera fácil y segura.</p>
          </div>
          
          <div className="footer-section">
            <h3>Navegación</h3>
            <ul>
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="#propiedades">Propiedades</a></li>
              <li><a href="#servicios">Servicios</a></li>
              <li><a href="#quienes-somos">Quiénes Somos</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Servicios</h3>
            <ul>
              <li><a href="#">Alquiler de Departamentos</a></li>
              <li><a href="#">Gestión de Propiedades</a></li>
              <li><a href="#">Asesoría Legal</a></li>
              <li><a href="#">Valoración de Inmuebles</a></li>
              <li><a href="#">Seguros</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contacto</h3>
            <ul>
              <li>📧 info@renthome.com</li>
              <li>📱 +51 999 888 777</li>
              <li>📍 Av. Larco 123, Miraflores</li>
              <li>🕒 Lun - Vie: 9AM - 7PM</li>
              <li>🕒 Sab: 9AM - 1PM</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 RentHome. Todos los derechos reservados. | Términos y Condiciones | Política de Privacidad</p>
        </div>
      </footer>
    </div>
  );
}