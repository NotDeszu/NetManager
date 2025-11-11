import React, { useState, useEffect } from 'react';
import './LandingPage.css';

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'Monitoreo en Tiempo Real',
      description: 'Supervisa tus dispositivos de red en tiempo real con actualizaciones instantáneas de estado y métricas de rendimiento.',
      color: '#4FC3F7'
    },
    {
      icon: '📈',
      title: 'Análisis Histórico',
      description: 'Explora datos históricos con gráficos interactivos y reportes detallados.',
      color: '#66BB6A'
    },
    {
      icon: '🔔',
      title: 'Alertas Inteligentes',
      description: 'Recibe notificaciones instantáneas por correo o Slack cuando surjan problemas. Anticípate a los fallos.',
      color: '#FFA726'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Monitoreo de Disponibilidad' },
    { value: '<5min', label: 'Tiempo de Configuración' },
    { value: '24/7', label: 'Seguimiento en Tiempo Real' },
    { value: '∞', label: 'Escalabilidad' }
  ];

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="navbar" style={{ 
        background: scrollY > 50 ? 'rgba(30, 48, 70, 0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none'
      }}>
        <div className="nav-content">
          <div className="logo-section">
            <span className="logo-text">NetManager</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Características</a>
            <a href="#how-it-works" className="nav-link">Cómo Funciona</a>
            <a href="#about" className="nav-link">Acerca de</a>
            <button onClick={() => handleNavigation('/login')} className="nav-link-button login">Iniciar Sesión</button>
            <button onClick={() => handleNavigation('/register')} className="nav-link-button signup">Comenzar</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="grid-overlay"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Monitoreo de Red en la Nube
          </div>
          
          <h1 className="hero-title">
            Monitoreo de Red
            <br />
            <span className="gradient-text">Hecho Simple</span>
          </h1>
          
          <p className="hero-subtitle">
            Monitoreo de red potente e intuitivo diseñado para PYMES. 
            <br />
            No se requieren conocimientos técnicos. Se configura en minutos, no en horas.
          </p>
          
          <div className="hero-buttons">
            <button onClick={() => handleNavigation('/register')} className="cta-button primary">
              Prueba Gratuita
              <span className="button-arrow">→</span>
            </button>
            <a href="#how-it-works" className="cta-button secondary">
              <span className="play-icon">▶</span>
              Ver Cómo Funciona
            </a>
          </div>

          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="mockup-content">
              <div className="mockup-cards">
                <div className="mini-card online">
                  <div className="mini-card-icon">✓</div>
                  <div className="mini-card-text">
                    <div className="mini-card-value">24</div>
                    <div className="mini-card-label">En línea</div>
                  </div>
                </div>
                <div className="mini-card offline">
                  <div className="mini-card-icon">⚠</div>
                  <div className="mini-card-text">
                    <div className="mini-card-value">1</div>
                    <div className="mini-card-label">Alerta</div>
                  </div>
                </div>
              </div>
              <div className="mockup-chart">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((height, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Todo lo que necesitas</h2>
          <p className="section-subtitle">
            Herramientas de monitoreo de red integrales diseñadas para ser potentes y fáciles de usar
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}20)` }}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-shine"></div>
            </div>
          ))}
        </div>

        <div className="features-extended">
          <div className="extended-feature">
            <div className="extended-icon">🔒</div>
            <div>
              <h4>Seguridad Multiinquilino</h4>
              <p>Los entornos aislados garantizan que tus datos permanezcan privados y seguros</p>
            </div>
          </div>
          <div className="extended-feature">
            <div className="extended-icon">⚡</div>
            <div>
              <h4>Ultrarrápido</h4>
              <p>Construido sobre arquitectura moderna para tiempos de respuesta instantáneos</p>
            </div>
          </div>
          <div className="extended-feature">
            <div className="extended-icon">📱</div>
            <div>
              <h4>Funciona en Cualquier Lugar</h4>
              <p>Accede a tu panel desde cualquier dispositivo y lugar</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">Comienza en Minutos</h2>
          <p className="section-subtitle">
            Tres pasos simples para una visibilidad completa de la red
          </p>
        </div>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Crea una Cuenta</h3>
              <p>Regístrate en segundos. No se requiere tarjeta para la prueba.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Agrega Dispositivos</h3>
              <p>Incorporación sencilla con descubrimiento automático.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Monitorea y Relájate</h3>
              <p>Alertas e información en tiempo real te mantienen al tanto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">Hecho para PYMES, por Ingenieros</h2>
            <p>
              NetManager fue creado para resolver un problema real: el monitoreo de red no debería requerir 
              un equipo de especialistas ni un gran presupuesto. Construimos una solución en la nube potente 
              que brinda a las pequeñas y medianas empresas capacidades de nivel empresarial.
            </p>
            <p>
              Impulsado por LibreNMS y arquitectura moderna en la nube, NetManager ofrece monitoreo profesional 
              sin la complejidad. Nuestra plataforma maneja todo, desde el descubrimiento de dispositivos hasta 
              alertas inteligentes, para que puedas enfocarte en hacer crecer tu negocio.
            </p>
            <div className="tech-badges">
              <span className="tech-badge">React</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">LibreNMS</span>
              <span className="tech-badge">Docker</span>
              <span className="tech-badge">PostgreSQL</span>
            </div>
          </div>
          <div className="about-visual">
            <div className="architecture-diagram">
              <div className="arch-layer">
                <div className="arch-box frontend">Frontend</div>
              </div>
              <div className="arch-arrows">
                <div className="arch-arrow"></div>
                <div className="arch-arrow"></div>
              </div>
              <div className="arch-layer">
                <div className="arch-box backend">API Backend</div>
              </div>
              <div className="arch-arrows">
                <div className="arch-arrow"></div>
                <div className="arch-arrow"></div>
              </div>
              <div className="arch-layer multi">
                <div className="arch-box db">Base de Datos</div>
                <div className="arch-box monitoring">LibreNMS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">¿Listo para Simplificar tu Monitoreo de Red?</h2>
          <p className="cta-subtitle">
            Únete a las PYMES visionarias que confían en NetManager para su infraestructura de red
          </p>
          <button onClick={() => handleNavigation('/register')} className="cta-button-large">
            Comienza tu Prueba Gratuita
            <span className="button-glow"></span>
          </button>
          <p className="cta-note">No se requiere tarjeta • Configuración en menos de 5 minutos</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-icon">
                <div className="server-icon">
                  <div className="server-line"></div>
                  <div className="server-line"></div>
                  <div className="server-line"></div>
                </div>
              </div>
              <span>NetManager</span>
            </div>
            <p className="footer-tagline">
              Monitoreo de red simple para empresas modernas
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Producto</h4>
            <a href="#features">Características</a>
            <a href="#how-it-works">Cómo Funciona</a>
            <button onClick={() => handleNavigation('/register')}>Comenzar</button>
          </div>
          
          <div className="footer-section">
            <h4>Compañía</h4>
            <a href="#about">Acerca de Nosotros</a>
            <button onClick={() => handleNavigation('/login')}>Iniciar Sesión</button>
          </div>
          
          <div className="footer-section">
            <h4>Proyecto</h4>
            <p className="footer-text">
              NetManager es un proyecto escolar que demuestra monitoreo de red 
              basado en la nube para PYMES usando tecnologías web modernas.
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 NetManager. Proyecto Escolar.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
