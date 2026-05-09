
import React, { createContext, useContext, useState, useEffect } from "react"
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { jwtDecode } from "jwt-decode"
import Dashboard from "./Dashboard.jsx"

// API Configuration
const API_URL = 'http://localhost:5000/api'

// Auth Context
const AuthContext = createContext(null)

function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('hiltheo_token'))
  const [isLoading, setIsLoading] = useState(true)
  const [googleClientId, setGoogleClientId] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(localStorage.getItem('hiltheo_admin_unlocked') === 'true')

  // Fetch Google Client ID on mount
  useEffect(()=>{
    fetch(`${API_URL}/config/google`)
      .then(res => res.json())
      .then(data => setGoogleClientId(data.clientId))
      .catch(err => console.error('Failed to fetch Google config:', err))
  },[])

  // Verify token on mount
  useEffect(()=>{
    const verifyToken = async ()=>{
      if(token){
        try {
          const response = await fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if(response.ok){
            const data = await response.json()
            setUser(data.user)
          } else {
            // Token invalid, clear it
            localStorage.removeItem('hiltheo_token')
            setToken(null)
          }
        } catch (error) {
          console.error('Token verification failed:', error)
        }
      }
      setIsLoading(false)
    }
    verifyToken()
  },[token])

  const login = async (email, password)=>{
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if(response.ok){
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('hiltheo_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const googleLogin = async (googleToken)=>{
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      })
      
      const data = await response.json()
      
      if(response.ok){
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('hiltheo_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Google login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const signup = async (name, email, password)=>{
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      
      const data = await response.json()
      
      if(response.ok){
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('hiltheo_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = ()=>{
    setUser(null)
    setToken(null)
    localStorage.removeItem('hiltheo_token')
  }

  const unlockAdmin = (code)=>{
    if(code === 'HILTHEOCNTRL12'){
      setAdminUnlocked(true)
      localStorage.setItem('hiltheo_admin_unlocked', 'true')
      return true
    }
    return false
  }

  const lockAdmin = ()=>{
    setAdminUnlocked(false)
    localStorage.removeItem('hiltheo_admin_unlocked')
  }

  const apiRequest = async (endpoint, options = {})=>{
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    if(token){
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    })
    
    return response
  }

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, signup, logout, isLoading, apiRequest, googleClientId, adminUnlocked, unlockAdmin, lockAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = ()=> useContext(AuthContext)

function ProtectedRoute({ children, requireUnlock = false }){
  const { user, isLoading, adminUnlocked } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    if(!isLoading && !user){
      navigate('/login', { state: { from: location.pathname } })
    } else if(!isLoading && user && requireUnlock && !adminUnlocked){
      navigate('/profile', { state: { from: location.pathname, needsUnlock: true } })
    }
  },[user, isLoading, adminUnlocked, navigate, location, requireUnlock])

  if(isLoading) return <div style={{color:"#fff",textAlign:"center",padding:40}}>Loading...</div>
  if(!user) return null
  if(requireUnlock && !adminUnlocked) return null

  return children
}

// Google Sign-In Button Component
function GoogleSignInButton({ onSuccess, onError }){
  const { googleClientId, googleLogin } = useAuth()
  const buttonRef = React.useRef(null)

  useEffect(()=>{
    if(googleClientId && buttonRef.current && window.google){
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      })
    }
  },[googleClientId])

  const handleCredentialResponse = async (response)=>{
    const result = await googleLogin(response.credential)
    if(result.success){
      onSuccess?.()
    } else {
      onError?.(result.error)
    }
  }

  if(!googleClientId){
    return <div style={{color:"#fff",textAlign:"center",padding:20}}>Loading Google Sign-In...</div>
  }

  return <div ref={buttonRef} style={{width:'100%'}} />
}

const carsSeed = [
  {id:1,make:"Mercedes-Benz",model:"S-Class S 580 4MATIC",year:"2023",price:"$125,000",date:"Jun 11, 2024",image:"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",specs:{engine:"4.0L V8 Biturbo",power:"496 hp",acceleration:"0-60 in 4.4s",transmission:"9-Speed Automatic"}},
  {id:2,make:"BMW",model:"7 Series 760i xDrive",year:"2024",price:"$140,000",date:"Jun 9, 2024",image:"https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=800&q=80",specs:{engine:"4.4L V8 TwinPower",power:"536 hp",acceleration:"0-60 in 4.1s",transmission:"8-Speed Sport Auto"}},
  {id:3,make:"Audi",model:"Q8 Prestige 55 TFSI",year:"2023",price:"$95,000",date:"Jun 10, 2024",image:"https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",specs:{engine:"3.0L V6 TFSI",power:"335 hp",acceleration:"0-60 in 5.6s",transmission:"8-Speed Tiptronic"}},
  {id:4,make:"Tesla",model:"Model S Plaid",year:"2023",price:"$89,000",date:"Jun 12, 2024",image:"https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",specs:{engine:"Electric Tri-Motor",power:"1,020 hp",acceleration:"0-60 in 1.99s",transmission:"Single-Speed"}},
  {id:5,make:"Porsche",model:"Panamera 4S",year:"2024",price:"$105,000",date:"Jun 8, 2024",image:"https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80",specs:{engine:"2.9L V6 Twin-Turbo",power:"443 hp",acceleration:"0-60 in 4.1s",transmission:"8-Speed PDK"}},
  {id:6,make:"Lamborghini",model:"Huracan EVO",year:"2023",price:"$230,000",date:"Jun 7, 2024",image:"https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800&q=80",specs:{engine:"5.2L V10",power:"631 hp",acceleration:"0-60 in 2.9s",transmission:"7-Speed Auto"}},
  {id:7,make:"Ferrari",model:"488 GTB",year:"2022",price:"$285,000",date:"Jun 6, 2024",image:"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",specs:{engine:"3.9L V8 Twin-Turbo",power:"661 hp",acceleration:"0-60 in 3.0s",transmission:"7-Speed Auto"}},
  {id:8,make:"Range Rover",model:"Sport Dynamic",year:"2024",price:"$95,000",date:"Jun 5, 2024",image:"https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800&q=80",specs:{engine:"3.0L Inline-6",power:"395 hp",acceleration:"0-60 in 5.3s",transmission:"8-Speed Auto"}},
  {id:9,make:"Lexus",model:"LS 500",year:"2023",price:"$78,000",date:"Jun 4, 2024",image:"https://images.unsplash.com/photo-1552519507-da3b1425c29d?w=800&q=80",specs:{engine:"3.4L V6 Twin-Turbo",power:"416 hp",acceleration:"0-60 in 4.6s",transmission:"10-Speed Auto"}},
  {id:10,make:"Bentley",model:"Continental GT",year:"2024",price:"$210,000",date:"Jun 3, 2024",image:"https://images.unsplash.com/photo-1563720223185-11003d70e89b?w=800&q=80",specs:{engine:"4.0L V8 Twin-Turbo",power:"542 hp",acceleration:"0-60 in 3.9s",transmission:"8-Speed Auto"}},
  {id:11,make:"Rolls Royce",model:"Ghost",year:"2023",price:"$340,000",date:"Jun 2, 2024",image:"https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80",specs:{engine:"6.75L V12",power:"563 hp",acceleration:"0-60 in 4.8s",transmission:"8-Speed Auto"}},
  {id:12,make:"Aston Martin",model:"DB11",year:"2022",price:"$205,000",date:"Jun 1, 2024",image:"https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80",specs:{engine:"4.0L V8 Twin-Turbo",power:"503 hp",acceleration:"0-60 in 3.9s",transmission:"8-Speed Auto"}},
  {id:13,make:"Maserati",model:"Quattroporte",year:"2023",price:"$145,000",date:"May 31, 2024",image:"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",specs:{engine:"3.0L V6 Twin-Turbo",power:"424 hp",acceleration:"0-60 in 4.8s",transmission:"8-Speed Auto"}},
  {id:14,make:"Cadillac",model:"Escalade Platinum",year:"2024",price:"$105,000",date:"May 30, 2024",image:"https://images.unsplash.com/photo-1535732820275-9ffd998cac22?w=800&q=80",specs:{engine:"6.2L V8",power:"420 hp",acceleration:"0-60 in 5.9s",transmission:"10-Speed Auto"}},
  {id:15,make:"Jaguar",model:"F-Type R",year:"2023",price:"$75,000",date:"May 29, 2024",image:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",specs:{engine:"5.0L V8 Supercharged",power:"575 hp",acceleration:"0-60 in 3.5s",transmission:"8-Speed Auto"}},
]

function StyleInjector(){
  React.useEffect(()=>{
    const style = document.createElement('style')
    style.textContent = responsiveStyles
    document.head.appendChild(style)
    return ()=> document.head.removeChild(style)
  },[])
  return null
}

function Nav(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <>
      <div style={nav} className="nav">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path d="M50 5 L90 20 L90 50 C90 75 50 95 50 95 C50 95 10 75 10 50 L10 20 Z" fill="url(#goldGradient)" stroke="#8B6914" strokeWidth="2"/>
            <path d="M50 15 L80 28 L80 50 C80 68 50 82 50 82 C50 82 20 68 20 50 L20 28 Z" fill="#070b14" stroke="#D4AF37" strokeWidth="1"/>
            <text x="50" y="60" textAnchor="middle" fill="url(#goldGradient)" fontSize="35" fontWeight="bold" fontFamily="serif">H</text>
          </svg>
          <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>HILTHEO SYNERGY</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="nav-links" style={{display:"flex",gap:32,alignItems:"center"}}>
          <Link style={a} to="/inventory">Inventory</Link>
          <Link style={a} to="/profile">Profile</Link>
          <Link style={a} to="/contact">Contact</Link>
          {user ? (
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <span style={{fontSize:14,opacity:0.8}}>Hi, {user.name}</span>
              <motion.button 
                style={btnPrimary}
                whileHover={{scale:1.05}}
                whileTap={{scale:0.98}}
                onClick={()=>{
                  logout()
                  navigate('/')
                }}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <Link style={a} to="/login">Login</Link>
              <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.98}}>
                <Link style={btnPrimary} to="/signup">Sign Up</Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          style={mobileMenuBtn}
          onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}
        style={mobileNav}
      >
        <Link style={mobileNavLink} to="/inventory" onClick={()=>setMobileMenuOpen(false)}>Inventory</Link>
        <Link style={mobileNavLink} to="/profile" onClick={()=>setMobileMenuOpen(false)}>Profile</Link>
        <Link style={mobileNavLink} to="/contact" onClick={()=>setMobileMenuOpen(false)}>Contact</Link>
        {user ? (
          <>
            <span style={{color:"#fff",fontSize:14,opacity:0.8}}>Hi, {user.name}</span>
            <button 
              style={{...btnPrimary,marginTop:10}}
              onClick={()=>{
                logout()
                navigate('/')
                setMobileMenuOpen(false)
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link style={mobileNavLink} to="/login" onClick={()=>setMobileMenuOpen(false)}>Login</Link>
            <Link style={{...btnPrimary,textAlign:"center",marginTop:10}} to="/signup" onClick={()=>setMobileMenuOpen(false)}>Sign Up</Link>
          </>
        )}
      </div>
    </>
  )
}

function Home(){
  const navigate = useNavigate()
  return (
    <div>
      {/* Hero Section with Background Image */}
      <div style={heroSection}>
        <div style={heroOverlay} />
        <motion.div 
          initial={{opacity:0,y:40}} 
          animate={{opacity:1,y:0}}
          transition={{duration:1,ease:[0.25,0.46,0.45,0.94]}}
          style={{textAlign:"center",maxWidth:1000,margin:"0 auto",position:"relative",zIndex:2}}
        >
          <motion.div
            initial={{opacity:0,scale:0.9}}
            animate={{opacity:1,scale:1}}
            transition={{delay:0.2,duration:0.8}}
            style={{marginBottom:24}}
          >
            <span style={heroBadge}>Premium Collection</span>
          </motion.div>
          <h1 style={heroTitle} className="hero-title">Upgrade Your Drive.</h1>
          <p style={heroSubtitle} className="hero-subtitle">Unmatched luxury for modern lifestyles. Experience the pinnacle of automotive excellence with our curated selection of premium vehicles.</p>
          <motion.div 
            className="hero-buttons"
            style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:0.4,duration:0.6}}
          >
            <motion.button 
              whileHover={{scale:1.05,boxShadow:"0 20px 40px rgba(255,255,255,0.2)"}}
              whileTap={{scale:0.98}}
              style={heroBtn}
              onClick={()=>navigate('/inventory')}
            >
              Browse Vehicles
            </motion.button>
            <motion.button 
              whileHover={{scale:1.05}}
              whileTap={{scale:0.98}}
              style={heroBtnSecondary}
              onClick={()=>navigate('/contact')}
            >
              Contact Sales
            </motion.button>
          </motion.div>
          
          <motion.div
            className="hero-stats"
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{delay:0.8,duration:1}}
            style={{marginTop:60,display:"flex",justifyContent:"center",gap:48}}
          >
            <div style={heroStat}>
              <div style={heroStatNumber} className="hero-stat-number">500+</div>
              <div style={heroStatLabel}>Vehicles Sold</div>
            </div>
            <div style={heroStat}>
              <div style={heroStatNumber} className="hero-stat-number">98%</div>
              <div style={heroStatLabel}>Satisfaction</div>
            </div>
            <div style={heroStat}>
              <div style={heroStatNumber} className="hero-stat-number">24h</div>
              <div style={heroStatLabel}>Delivery</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Featured Vehicles */}
      <div style={section} className="section">
        <motion.div
          initial={{opacity:0,y:20}}
          whileInView={{opacity:1,y:0}}
          viewport={{once:true}}
          transition={{duration:0.6}}
        >
          <div style={{textAlign:"center",marginBottom:60}}>
            <motion.span 
              style={sectionBadge}
              initial={{opacity:0}}
              whileInView={{opacity:1}}
              viewport={{once:true}}
            >
              Curated Selection
            </motion.span>
            <h2 style={sectionTitle} className="section-title responsive-font">Featured Vehicles</h2>
          <p style={sectionSubtitle} className="section-subtitle responsive-font">Explore our premium selection of luxury automobiles, handpicked for discerning buyers.</p>
          </div>
          <div style={featuredGrid} className="featured-grid">
            {carsSeed.slice(0, 3).map((car,index)=> (
              <motion.div 
                key={car.id} 
                style={featuredCard}
                initial={{opacity:0,y:30}}
                whileInView={{opacity:1,y:0}}
                viewport={{once:true}}
                transition={{delay:index*0.15,duration:0.6}}
                onClick={()=>navigate(`/car/${car.id}`)}
                whileHover={{y:-12,transition:{duration:0.3}}}
              >
                <div style={carImageContainer}>
                  <img src={car.image} alt={`${car.year} ${car.make} ${car.model}`} style={carImage} />
                  <div style={carImageOverlay} />
                  <motion.div 
                    style={viewDetailsBtn}
                    initial={{opacity:0}}
                    whileHover={{opacity:1}}
                  >
                    View Details →
                  </motion.div>
                </div>
                <div style={{padding:28}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={carYear}>{car.date}</div>
                    <div style={carBadge}>{car.year}</div>
                  </div>
                  <h3 style={carName}>{car.make} {car.model}</h3>
                  <div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
                    <span style={carSpec}>{car.specs.engine}</span>
                    <span style={carSpec}>{car.specs.power}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>
                    <div style={carPrice}>{car.price}</div>
                    <motion.button 
                      style={cardBtn}
                      whileHover={{scale:1.05}}
                      onClick={(e)=>{e.stopPropagation();navigate(`/car/${car.id}`)}}
                    >
                      Inquire
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            style={{textAlign:"center",marginTop:48}}
            initial={{opacity:0}}
            whileInView={{opacity:1}}
            viewport={{once:true}}
          >
            <motion.button 
              style={outlineBtn}
              whileHover={{scale:1.05,background:"rgba(255,255,255,0.1)"}}
              onClick={()=>navigate('/inventory')}
            >
              View All Inventory →
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Features Section */}
      <div style={{...section,background:"linear-gradient(180deg, #0a0e1a 0%, #070b14 100%)",position:"relative",overflow:"hidden"}} className="section">
        <div style={featuresGrid} className="features-grid">
          <motion.div 
            style={featureCard}
            initial={{opacity:0,y:30}}
            whileInView={{opacity:1,y:0}}
            viewport={{once:true}}
            transition={{duration:0.6}}
          >
            <div style={featureIcon}>🚚</div>
            <h3 style={featureTitle}>Concierge Delivery</h3>
            <p style={featureDesc}>Door-to-door vehicle delivery for complete ease, anywhere in the city. We handle every detail.</p>
            <Link to="/services" style={featureLink}>Learn more →</Link>
          </motion.div>
          <motion.div 
            style={featureCard}
            initial={{opacity:0,y:30}}
            whileInView={{opacity:1,y:0}}
            viewport={{once:true}}
            transition={{delay:0.15,duration:0.6}}
          >
            <div style={featureIcon}>📸</div>
            <h3 style={featureTitle}>Cinematic Imagery</h3>
            <p style={featureDesc}>Stunning, high-resolution vehicle photography to help you buy with complete confidence.</p>
            <Link to="/services" style={featureLink}>Learn more →</Link>
          </motion.div>
          <motion.div 
            style={featureCard}
            initial={{opacity:0,y:30}}
            whileInView={{opacity:1,y:0}}
            viewport={{once:true}}
            transition={{delay:0.3,duration:0.6}}
          >
            <div style={featureIcon}>👔</div>
            <h3 style={featureTitle}>Trusted Support</h3>
            <p style={featureDesc}>Expert staff guide your experience—before, during, and long after your purchase.</p>
            <Link to="/contact" style={featureLink}>Contact us →</Link>
          </motion.div>
        </div>
      </div>
      
      {/* Why Choose Us */}
      <div style={{...section,background:"#050811"}} className="section responsive-section">
        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}} className="why-grid responsive-grid">
          <motion.div
            initial={{opacity:0,x:-30}}
            whileInView={{opacity:1,x:0}}
            viewport={{once:true}}
            transition={{duration:0.6}}
          >
            <span style={sectionBadge}>Why Hiltheo Synergy</span>
            <h2 style={{...sectionTitle,textAlign:"left"}}>The Standard in Luxury Automotive</h2>
            <p style={{fontSize:17,opacity:0.7,lineHeight:1.7,marginBottom:32}}>
              For over a decade, we've been the trusted destination for discerning buyers seeking exceptional vehicles. Our commitment to excellence extends beyond the sale.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={whyItem}>
                <div style={whyIcon}>✓</div>
                <div>
                  <div style={whyTitle}>Rigorous Inspection</div>
                  <div style={whyDesc}>Every vehicle undergoes 150+ point inspection</div>
                </div>
              </div>
              <div style={whyItem}>
                <div style={whyIcon}>✓</div>
                <div>
                  <div style={whyTitle}>Transparent Pricing</div>
                  <div style={whyDesc}>No hidden fees, clear market-based pricing</div>
                </div>
              </div>
              <div style={whyItem}>
                <div style={whyIcon}>✓</div>
                <div>
                  <div style={whyTitle}>Premium Warranty</div>
                  <div style={whyDesc}>Comprehensive coverage on every vehicle</div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{opacity:0,x:30}}
            whileInView={{opacity:1,x:0}}
            viewport={{once:true}}
            transition={{duration:0.6,delay:0.2}}
            style={{position:"relative"}}
          >
            <div style={whyImageContainer}>
              <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80" alt="Luxury car interior" style={whyImage} className="why-image" />
              <div style={whyImageOverlay} />
            </div>
            <motion.div 
              style={whyFloatingCard}
              initial={{opacity:0,y:20}}
              whileInView={{opacity:1,y:0}}
              viewport={{once:true}}
              transition={{delay:0.5}}
            >
              <div style={whyFloatingNumber}>10+</div>
              <div style={whyFloatingText}>Years of Excellence</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div style={ctaSection} className="section responsive-section">
        <motion.div
          initial={{opacity:0,y:30}}
          whileInView={{opacity:1,y:0}}
          viewport={{once:true}}
          transition={{duration:0.8}}
          style={{textAlign:"center",position:"relative",zIndex:2}}
        >
          <h2 style={ctaTitle} className="section-title">Your next car, delivered.</h2>
          <p style={ctaSubtitle} className="section-subtitle">Book a test drive or start your purchase today. Experience luxury redefined.</p>
          <motion.button
            whileHover={{scale:1.05,boxShadow:"0 25px 50px rgba(255,255,255,0.15)"}}
            whileTap={{scale:0.98}}
            style={ctaBtn}
            onClick={()=>navigate('/inventory')}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  )
}

function Inventory(){
  const navigate = useNavigate()
  return (
    <div style={page} className="inventory-page responsive-page">
      <motion.h1 
        initial={{opacity:0,y:20}} 
        animate={{opacity:1,y:0}}
        style={{fontSize:48,fontWeight:700,marginBottom:40}}
      >
        Inventory
      </motion.h1>
      <div style={featuredGrid} className="featured-grid responsive-grid">
        {carsSeed.map((car,index)=> (
          <motion.div 
            key={car.id} 
            style={featuredCard}
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:index*0.1}}
            onClick={()=>navigate(`/car/${car.id}`)}
            whileHover={{y:-8}}
          >
            <div style={carImageContainer}>
              <img src={car.image} alt={`${car.year} ${car.make} ${car.model}`} style={carImage} />
              <div style={carImageOverlay} />
            </div>
            <div style={{padding:24}}>
              <div style={carYear}>{car.date}</div>
              <h3 style={carName}>{car.year} {car.make} {car.model}</h3>
              <div style={carPrice}>{car.price}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Car(){
  const navigate = useNavigate()
  const carId = window.location.pathname.split('/').pop()
  const car = carsSeed.find(c=>c.id===Number(carId)) || carsSeed[0]
  return (
    <div style={page} className="car-page responsive-page">
      <motion.button
        initial={{opacity:0}}
        animate={{opacity:1}}
        style={{...backBtn,marginBottom:24}}
        onClick={()=>navigate('/inventory')}
        whileHover={{x:-5}}
      >
        ← Back to Inventory
      </motion.button>
      <motion.div
        initial={{opacity:0,y:30}}
        animate={{opacity:1,y:0}}
        transition={{duration:0.6}}
      >
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:60,alignItems:"start"}} className="car-detail-grid responsive-grid">
          <motion.div 
            style={carDetailImageContainer}
            initial={{opacity:0,scale:0.95}}
            animate={{opacity:1,scale:1}}
            transition={{duration:0.6}}
          >
            <img src={car.image} alt={`${car.year} ${car.make} ${car.model}`} style={carDetailImage} className="car-detail-image" />
            <div style={carDetailImageOverlay} />
          </motion.div>
          <div>
            <motion.div 
              initial={{opacity:0,y:20}}
              animate={{opacity:1,y:0}}
              transition={{delay:0.2}}
            >
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
                <span style={detailBadge}>{car.year}</span>
                <span style={detailBadgeOutline}>In Stock</span>
              </div>
              <h1 style={{fontSize:42,fontWeight:700,marginBottom:8,lineHeight:1.2}}>
                {car.make}
              </h1>
              <h2 style={{fontSize:28,fontWeight:500,opacity:0.8,marginBottom:24}}>
                {car.model}
              </h2>
              <div style={{...carPrice,fontSize:36,marginBottom:32}}>{car.price}</div>
              
              <div style={specsGrid} className="specs-grid responsive-grid">
                <div style={specItem}>
                  <div style={specLabel}>Engine</div>
                  <div style={specValue}>{car.specs.engine}</div>
                </div>
                <div style={specItem}>
                  <div style={specLabel}>Power</div>
                  <div style={specValue}>{car.specs.power}</div>
                </div>
                <div style={specItem}>
                  <div style={specLabel}>Acceleration</div>
                  <div style={specValue}>{car.specs.acceleration}</div>
                </div>
                <div style={specItem}>
                  <div style={specLabel}>Transmission</div>
                  <div style={specValue}>{car.specs.transmission}</div>
                </div>
              </div>
              
              <motion.button 
                whileHover={{scale:1.02,boxShadow:"0 15px 30px rgba(100,210,255,0.3)"}}
                whileTap={{scale:0.98}}
                style={{...heroBtn,width:"100%",marginTop:32}}
              >
                Inquire Now
              </motion.button>
              
              <div style={{marginTop:32,padding:24,background:"rgba(255,255,255,0.03)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:14,opacity:0.6,marginBottom:8}}>Questions? Call us</div>
                <div style={{fontSize:20,fontWeight:600}}>+1 (555) 123-4567</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Profile(){
  const { user, adminUnlocked, unlockAdmin, lockAdmin } = useAuth()
  const [code, setCode] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlockSuccess, setUnlockSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const needsUnlock = location.state?.needsUnlock

  // Mock data - replace with actual data from backend
  const userStats = {
    carsBought: 2,
    totalSpent: "$220,000",
    memberSince: "2024",
    incomingOrders: [
      { id: 1, car: "2024 BMW 7 Series", status: "Processing", date: "Jan 15, 2025" },
    ]
  }

  const handleUnlock = (e)=>{
    e.preventDefault()
    setUnlockError('')
    
    if(unlockAdmin(code)){
      setUnlockSuccess(true)
      setTimeout(()=>{
        const from = location.state?.from || '/admin'
        navigate(from)
      }, 1500)
    } else {
      setUnlockError('Invalid code')
    }
  }

  const handleLock = ()=>{
    lockAdmin()
    setUnlockSuccess(false)
    setCode('')
  }

  if(!user){
    return (
      <div style={page} className="profile-page">
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          style={{textAlign:"center",padding:60}}
        >
          <h2>Please sign in to view your profile</h2>
          <motion.button 
            style={{...heroBtn,marginTop:24}}
            whileHover={{scale:1.05}}
            onClick={()=>navigate('/login')}
          >
            Sign In
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={page} className="profile-page responsive-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24}}>
        <motion.h1 
          initial={{opacity:0,y:20}} 
          animate={{opacity:1,y:0}}
          style={{fontSize:48,fontWeight:700}}
        >
          My Profile
        </motion.h1>

        {/* Admin Unlock Section - Top Right */}
        <motion.div
          className="unlock-section"
          initial={{opacity:0,x:20}}
          animate={{opacity:1,x:0}}
          style={{
            background:adminUnlocked?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.05)",
            borderRadius:16,
            padding:20,
            border:`1px solid ${adminUnlocked?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.1)"}`,
            minWidth:280,
          }}
        >
          {adminUnlocked?(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,color:"#22c55e",marginBottom:12}}>
                <span style={{fontSize:20}}>✓</span>
                <span style={{fontWeight:600}}>Admin Panel Unlocked</span>
              </div>
              <motion.button
                whileHover={{scale:1.02}}
                whileTap={{scale:0.98}}
                onClick={()=>navigate('/admin')}
                style={{...heroBtn,width:"100%",marginBottom:8}}
              >
                Go to Admin Panel
              </motion.button>
              <button
                onClick={handleLock}
                style={{
                  background:"transparent",
                  border:"none",
                  color:"rgba(255,255,255,0.6)",
                  fontSize:12,
                  cursor:"pointer",
                  textDecoration:"underline",
                  width:"100%",
                }}
              >
                Lock Admin Access
              </button>
            </div>
          ):(
            <form onSubmit={handleUnlock}>
              <div style={{fontSize:14,opacity:0.8,marginBottom:12}}>
                {needsUnlock?"Enter Staff Code to access admin panel":"Staff Code"}
              </div>
              <input
                type="password"
                value={code}
                onChange={(e)=>setCode(e.target.value)}
                placeholder="Enter Staff Code"
                style={{
                  width:"100%",
                  padding:12,
                  borderRadius:8,
                  border:"1px solid rgba(255,255,255,0.2)",
                  background:"rgba(255,255,255,0.1)",
                  color:"#fff",
                  fontSize:15,
                  marginBottom:12,
                }}
              />
              {unlockError && (
                <div style={{color:"#ef4444",fontSize:13,marginBottom:12}}>{unlockError}</div>
              )}
              {unlockSuccess && (
                <div style={{color:"#22c55e",fontSize:13,marginBottom:12}}>✓ Access granted! Redirecting...</div>
              )}
              <motion.button
                type="submit"
                whileHover={{scale:1.02}}
                whileTap={{scale:0.98}}
                style={{...heroBtn,width:"100%"}}
                disabled={!code}
              >
                Unlock
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>

      {/* User Info Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20,marginTop:40}} className="profile-grid">
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          transition={{delay:0.1}}
          style={{
            background:"rgba(255,255,255,0.03)",
            borderRadius:16,
            padding:24,
            border:"1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{fontSize:14,opacity:0.6,marginBottom:8}}>Member Since</div>
          <div style={{fontSize:28,fontWeight:700,color:"#64d2ff"}}>{userStats.memberSince}</div>
        </motion.div>

        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          transition={{delay:0.2}}
          style={{
            background:"rgba(255,255,255,0.03)",
            borderRadius:16,
            padding:24,
            border:"1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{fontSize:14,opacity:0.6,marginBottom:8}}>Cars Purchased</div>
          <div style={{fontSize:28,fontWeight:700,color:"#64d2ff"}}>{userStats.carsBought}</div>
        </motion.div>

        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          transition={{delay:0.3}}
          style={{
            background:"rgba(255,255,255,0.03)",
            borderRadius:16,
            padding:24,
            border:"1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{fontSize:14,opacity:0.6,marginBottom:8}}>Total Spent</div>
          <div style={{fontSize:28,fontWeight:700,color:"#64d2ff"}}>{userStats.totalSpent}</div>
        </motion.div>
      </div>

      {/* User Details */}
      <motion.div
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        transition={{delay:0.4}}
        style={{
          background:"rgba(255,255,255,0.03)",
          borderRadius:16,
          padding:24,
          border:"1px solid rgba(255,255,255,0.08)",
          marginTop:24,
        }}
      >
        <h3 style={{fontSize:20,fontWeight:600,marginBottom:16}}>Account Details</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          <div>
            <div style={{fontSize:12,opacity:0.6,textTransform:"uppercase",letterSpacing:1}}>Name</div>
            <div style={{fontSize:16,fontWeight:500,marginTop:4}}>{user.name}</div>
          </div>
          <div>
            <div style={{fontSize:12,opacity:0.6,textTransform:"uppercase",letterSpacing:1}}>Email</div>
            <div style={{fontSize:16,fontWeight:500,marginTop:4}}>{user.email}</div>
          </div>
          <div>
            <div style={{fontSize:12,opacity:0.6,textTransform:"uppercase",letterSpacing:1}}>Account Type</div>
            <div style={{fontSize:16,fontWeight:500,marginTop:4}}>Premium Member</div>
          </div>
        </div>
      </motion.div>

      {/* Incoming Orders */}
      <motion.div
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        transition={{delay:0.5}}
        style={{
          background:"rgba(255,255,255,0.03)",
          borderRadius:16,
          padding:24,
          border:"1px solid rgba(255,255,255,0.08)",
          marginTop:24,
        }}
      >
        <h3 style={{fontSize:20,fontWeight:600,marginBottom:16}}>Incoming Orders</h3>
        {userStats.incomingOrders.length>0?(
          userStats.incomingOrders.map((order)=> (
            <div
              key={order.id}
              style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                padding:"16px 0",
                borderBottom:"1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div>
                <div style={{fontWeight:500}}>{order.car}</div>
                <div style={{fontSize:14,opacity:0.6,marginTop:4}}>Expected: {order.date}</div>
              </div>
              <span style={{
                padding:"6px 12px",
                background:"rgba(100,210,255,0.15)",
                color:"#64d2ff",
                borderRadius:20,
                fontSize:12,
                fontWeight:600,
              }}>
                {order.status}
              </span>
            </div>
          ))
        ):(
          <div style={{opacity:0.6,textAlign:"center",padding:40}}>
            No incoming orders at the moment.
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Contact(){
  return (
    <div style={page} className="contact-page responsive-page">
      <motion.h1 
        initial={{opacity:0,y:20}} 
        animate={{opacity:1,y:0}}
        style={{fontSize:48,fontWeight:700,marginBottom:40}}
      >
        Contact Us
      </motion.h1>
      <div style={{maxWidth:600}}>
        <p style={{fontSize:18,opacity:0.8,lineHeight:1.6,marginBottom:32}}>
          Ready to upgrade your drive? Get in touch with our team for personalized assistance.
        </p>
        <div style={contactForm}>
          <input type="text" placeholder="Your Name" style={inputStyle} />
          <input type="email" placeholder="Email Address" style={inputStyle} />
          <textarea placeholder="Message" rows={4} style={{...inputStyle,height:"auto"}} />
          <motion.button whileHover={{scale:1.02}} style={heroBtn}>
            Send Message
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function Footer(){
  return (
    <div style={footer} className="footer responsive-footer">
      <div style={footerGrid} className="footer-grid responsive-grid">
        <div>
          <h4 style={{marginBottom:16}}>Inventory</h4>
          <Link style={footerLink} to="/inventory">All Cars</Link>
          <Link style={footerLink} to="/inventory">Luxury SUVs</Link>
          <Link style={footerLink} to="/inventory">Special Offers</Link>
        </div>
        <div>
          <h4 style={{marginBottom:16}}>Account</h4>
          <Link style={footerLink} to="/profile">My Profile</Link>
          <Link style={footerLink} to="/profile">My Orders</Link>
          <Link style={footerLink} to="/profile">Settings</Link>
        </div>
        <div>
          <h4 style={{marginBottom:16}}>Connect</h4>
          <Link style={footerLink} to="/contact">Contact</Link>
          <Link style={footerLink} to="/">About Us</Link>
          <Link style={footerLink} to="/">Careers</Link>
        </div>
      </div>
      <div style={{textAlign:"center",paddingTop:40,borderTop:"1px solid rgba(255,255,255,0.08)",marginTop:40,opacity:0.5,fontSize:14}}>
        2024 Hiltheo Synergy. Premium vehicle listings and delivery.
      </div>
    </div>
  )
}

function AuthPage({ mode = 'login' }){
  const [isFlipped, setIsFlipped] = useState(mode === 'signup')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, signup, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const toggle = ()=> setIsFlipped(!isFlipped)

  const handleLogin = async (e)=>{
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const result = await login(loginEmail, loginPassword)
    setIsLoading(false)
    if(result.success){
      const from = location.state?.from || '/admin'
      navigate(from)
    } else {
      setError(result.error)
    }
  }

  const handleSignup = async (e)=>{
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    if(signupPassword.length < 6){
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }
    
    const result = await signup(signupName, signupEmail, signupPassword)
    setIsLoading(false)
    if(result.success){
      navigate('/admin')
    } else {
      setError(result.error)
    }
  }

  const handleGoogleSuccess = async (response)=>{
    setIsLoading(true)
    setError('')
    
    const result = await googleLogin(response.credential)
    setIsLoading(false)
    if(result.success){
      const from = location.state?.from || '/admin'
      navigate(from)
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={authPage} className="auth-page responsive-auth-page">
      <div style={authContainer} className="auth-container responsive-auth-container">
        <motion.div 
          className="auth-card"
          style={{
            ...newAuthCard,
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
          initial={{opacity:0}}
          animate={{opacity:1}}
          transition={{duration:0.5}}
        >
          {/* Login Form - Front */}
          <div style={newAuthFormFront}>
            <h2 style={newAuthTitle}>Welcome Back</h2>
            
            {error && !isFlipped && (
              <motion.div style={newAuthError} initial={{opacity:0}} animate={{opacity:1}}>
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleLogin} style={newAuthFormInner}>
              <input 
                type="email" 
                placeholder="Email"
                value={loginEmail}
                onChange={(e)=>setLoginEmail(e.target.value)}
                style={newAuthInput}
                required
              />
              <input 
                type="password" 
                placeholder="Password"
                value={loginPassword}
                onChange={(e)=>setLoginPassword(e.target.value)}
                style={newAuthInput}
                required
              />
              <motion.button 
                type="submit"
                style={newAuthBtn}
                whileHover={{scale:1.05}}
                whileTap={{scale:0.98}}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </motion.button>
            </form>

            <div style={newAuthDivider}>OR</div>

            {/* Google Sign-In */}
            <div style={{width:'100%'}}>
              <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(err)=>setError(err)} />
            </div>

            <p style={newAuthSwitchText}>
              Don't have an account? <span style={newAuthSwitchLink} onClick={toggle}>Sign Up</span>
            </p>
          </div>

          {/* Signup Form - Back */}
          <div style={newAuthFormBack}>
            <h2 style={newAuthTitle}>Create Account</h2>
            
            {error && isFlipped && (
              <motion.div style={newAuthError} initial={{opacity:0}} animate={{opacity:1}}>
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleSignup} style={newAuthFormInner}>
              <input 
                type="text" 
                placeholder="Full Name"
                value={signupName}
                onChange={(e)=>setSignupName(e.target.value)}
                style={newAuthInput}
                required
              />
              <input 
                type="email" 
                placeholder="Email"
                value={signupEmail}
                onChange={(e)=>setSignupEmail(e.target.value)}
                style={newAuthInput}
                required
              />
              <input 
                type="password" 
                placeholder="Password"
                value={signupPassword}
                onChange={(e)=>setSignupPassword(e.target.value)}
                style={newAuthInput}
                required
              />
              <motion.button 
                type="submit"
                style={newAuthBtn}
                whileHover={{scale:1.05}}
                whileTap={{scale:0.98}}
                disabled={isLoading}
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </motion.button>
            </form>

            <div style={newAuthDivider}>OR</div>

            {/* Google Sign-In */}
            <div style={{width:'100%'}}>
              <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(err)=>setError(err)} />
            </div>

            <p style={newAuthSwitchText}>
              Already have an account? <span style={newAuthSwitchLink} onClick={toggle}>Login</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <StyleInjector />
      <div style={{color:"#fff",fontFamily:"Inter, -apple-system, BlinkMacSystemFont, sans-serif",background:"#070b14",minHeight:"100vh"}}>
        <Nav/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/inventory" element={<Inventory/>}/>
          <Route path="/car/:id" element={<Car/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/login" element={<AuthPage mode="login"/>}/>
          <Route path="/signup" element={<AuthPage mode="signup"/>}/>
          <Route path="/admin" element={<ProtectedRoute requireUnlock={true}><Dashboard/></ProtectedRoute>}/>
        </Routes>
      </div>
    </AuthProvider>
  )
}

const nav = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  padding:"20px 48px",
  background:"rgba(7,11,20,0.8)",
  backdropFilter:"blur(10px)",
  position:"sticky",
  top:0,
  zIndex:100,
}

const logo = {
  color:"#fff",
  textDecoration:"none",
  fontWeight:700,
  fontSize:20,
  letterSpacing:"-0.5px",
  display:"flex",
  alignItems:"center"
}

const a = {
  color:"white",
  textDecoration:"none",
  opacity:0.7,
  fontSize:15,
  transition:"opacity 0.2s",
  ":hover":{opacity:1}
}

const btnPrimary = {
  color:"#070b14",
  background:"#fff",
  padding:"10px 20px",
  borderRadius:8,
  textDecoration:"none",
  fontSize:14,
  fontWeight:500,
}

const page = {
  padding:"48px",
  minHeight:"90vh",
  maxWidth:1400,
  margin:"0 auto"
}

const heroSection = {
  minHeight:"100vh",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  padding:"48px",
  backgroundImage:"url('https://images.unsplash.com/photo-1503376763036-066120622c74?w=1920&q=80')",
  backgroundSize:"cover",
  backgroundPosition:"center",
  position:"relative",
}

const heroOverlay = {
  position:"absolute",
  inset:0,
  background:"linear-gradient(180deg, rgba(7,11,20,0.7) 0%, rgba(7,11,20,0.9) 100%)",
}

const heroBadge = {
  display:"inline-block",
  padding:"10px 20px",
  background:"rgba(255,255,255,0.1)",
  backdropFilter:"blur(10px)",
  borderRadius:50,
  fontSize:13,
  fontWeight:600,
  letterSpacing:"2px",
  textTransform:"uppercase",
  border:"1px solid rgba(255,255,255,0.1)",
}

const heroStat = {
  textAlign:"center",
}

const heroStatNumber = {
  fontSize:36,
  fontWeight:700,
  color:"#64d2ff",
}

const heroStatLabel = {
  fontSize:14,
  opacity:0.6,
  marginTop:4,
}

const heroTitle = {
  fontSize:"72px",
  fontWeight:700,
  marginBottom:24,
  letterSpacing:"-2px",
  lineHeight:1.1,
}

const heroSubtitle = {
  fontSize:24,
  opacity:0.7,
  marginBottom:40,
}

const heroBtn = {
  background:"#fff",
  color:"#070b14",
  padding:"16px 32px",
  borderRadius:12,
  border:"none",
  fontSize:16,
  fontWeight:600,
  cursor:"pointer",
}

const section = {
  padding:"80px 48px",
}

const sectionTitle = {
  fontSize:40,
  fontWeight:700,
  marginBottom:16,
  textAlign:"center",
}

const sectionSubtitle = {
  fontSize:18,
  opacity:0.6,
  marginBottom:48,
  textAlign:"center",
}

const featuredGrid = {
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:24,
}

const featuredCard = {
  background:"rgba(255,255,255,0.03)",
  borderRadius:16,
  border:"1px solid rgba(255,255,255,0.06)",
  overflow:"hidden",
  cursor:"pointer",
}

const carImagePlaceholder = {
  height:200,
  background:"linear-gradient(135deg, #1a2035 0%, #0d1321 100%)",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
}

const carYear = {
  fontSize:13,
  opacity:0.5,
  textTransform:"uppercase",
  letterSpacing:"1px",
  marginBottom:8,
}

const carName = {
  fontSize:18,
  fontWeight:600,
  marginBottom:12,
  lineHeight:1.3,
}

const carPrice = {
  fontSize:20,
  fontWeight:700,
  color:"#64d2ff",
}

const featuresGrid = {
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:32,
  maxWidth:1200,
  margin:"0 auto",
}

const featureCard = {
  textAlign:"center",
  padding:32,
}

const featureTitle = {
  fontSize:24,
  fontWeight:600,
  marginBottom:16,
}

const featureDesc = {
  fontSize:16,
  opacity:0.6,
  lineHeight:1.6,
}

const ctaSection = {
  padding:"120px 48px",
  background:"linear-gradient(180deg, #0a0e1a 0%, #070b14 100%)",
}

const ctaTitle = {
  fontSize:48,
  fontWeight:700,
  marginBottom:16,
}

const ctaSubtitle = {
  fontSize:18,
  opacity:0.6,
  marginBottom:32,
}

const ctaBtn = {
  background:"#fff",
  color:"#070b14",
  padding:"16px 32px",
  borderRadius:12,
  border:"none",
  fontSize:16,
  fontWeight:600,
  cursor:"pointer",
}

const contactForm = {
  display:"flex",
  flexDirection:"column",
  gap:16,
}

const inputStyle = {
  padding:"16px",
  borderRadius:8,
  border:"1px solid rgba(255,255,255,0.1)",
  background:"rgba(255,255,255,0.03)",
  color:"#fff",
  fontSize:16,
}

const footer = {
  padding:"80px 48px 40px",
  background:"#050811",
  borderTop:"1px solid rgba(255,255,255,0.06)",
}

const footerGrid = {
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:48,
  maxWidth:1200,
  margin:"0 auto",
}

const footerLink = {
  display:"block",
  color:"rgba(255,255,255,0.6)",
  textDecoration:"none",
  padding:"8px 0",
  fontSize:15,
}

const heroBtnSecondary = {
  background:"transparent",
  color:"#fff",
  padding:"16px 32px",
  borderRadius:12,
  border:"2px solid rgba(255,255,255,0.3)",
  fontSize:16,
  fontWeight:600,
  cursor:"pointer",
  transition:"all 0.3s",
}

const sectionBadge = {
  display:"inline-block",
  padding:"8px 16px",
  background:"rgba(100,210,255,0.1)",
  color:"#64d2ff",
  borderRadius:50,
  fontSize:12,
  fontWeight:600,
  letterSpacing:"1px",
  textTransform:"uppercase",
  marginBottom:20,
}

const carImageContainer = {
  position:"relative",
  height:220,
  overflow:"hidden",
}

const carImage = {
  width:"100%",
  height:"100%",
  objectFit:"cover",
  transition:"transform 0.5s",
}

const carImageOverlay = {
  position:"absolute",
  inset:0,
  background:"linear-gradient(180deg, transparent 0%, rgba(7,11,20,0.8) 100%)",
  opacity:0.6,
}

const viewDetailsBtn = {
  position:"absolute",
  top:"50%",
  left:"50%",
  transform:"translate(-50%,-50%)",
  padding:"12px 24px",
  background:"rgba(255,255,255,0.95)",
  color:"#070b14",
  borderRadius:8,
  fontWeight:600,
  fontSize:14,
  opacity:0,
  transition:"opacity 0.3s",
  pointerEvents:"none",
}

const carBadge = {
  padding:"6px 12px",
  background:"rgba(100,210,255,0.15)",
  color:"#64d2ff",
  borderRadius:6,
  fontSize:12,
  fontWeight:600,
}

const carSpec = {
  padding:"6px 12px",
  background:"rgba(255,255,255,0.05)",
  borderRadius:6,
  fontSize:12,
  opacity:0.7,
}

const cardBtn = {
  padding:"10px 20px",
  background:"#fff",
  color:"#070b14",
  borderRadius:8,
  border:"none",
  fontSize:13,
  fontWeight:600,
  cursor:"pointer",
}

const outlineBtn = {
  padding:"14px 28px",
  background:"transparent",
  color:"#fff",
  borderRadius:8,
  border:"2px solid rgba(255,255,255,0.2)",
  fontSize:15,
  fontWeight:600,
  cursor:"pointer",
}

const featureIcon = {
  width:60,
  height:60,
  borderRadius:16,
  background:"rgba(255,255,255,0.05)",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontSize:28,
  marginBottom:24,
}

const featureLink = {
  color:"#64d2ff",
  textDecoration:"none",
  fontSize:14,
  fontWeight:600,
  marginTop:16,
  display:"inline-block",
}

const whyItem = {
  display:"flex",
  alignItems:"flex-start",
  gap:16,
}

const whyIcon = {
  width:28,
  height:28,
  borderRadius:"50%",
  background:"rgba(100,210,255,0.2)",
  color:"#64d2ff",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontSize:14,
  fontWeight:700,
  flexShrink:0,
}

const whyTitle = {
  fontSize:17,
  fontWeight:600,
  marginBottom:4,
}

const whyDesc = {
  fontSize:14,
  opacity:0.6,
}

const whyImageContainer = {
  position:"relative",
  borderRadius:24,
  overflow:"hidden",
  boxShadow:"0 40px 80px rgba(0,0,0,0.4)",
}

const whyImage = {
  width:"100%",
  height:400,
  objectFit:"cover",
}

const whyImageOverlay = {
  position:"absolute",
  inset:0,
  background:"linear-gradient(180deg, transparent 50%, rgba(7,11,20,0.6) 100%)",
}

const whyFloatingCard = {
  position:"absolute",
  bottom:24,
  right:24,
  padding:"20px 28px",
  background:"rgba(255,255,255,0.1)",
  backdropFilter:"blur(20px)",
  borderRadius:16,
  border:"1px solid rgba(255,255,255,0.1)",
}

const whyFloatingNumber = {
  fontSize:36,
  fontWeight:700,
  color:"#64d2ff",
}

const whyFloatingText = {
  fontSize:14,
  opacity:0.8,
}

const backBtn = {
  padding:"10px 20px",
  background:"transparent",
  color:"rgba(255,255,255,0.7)",
  border:"none",
  borderRadius:8,
  fontSize:15,
  cursor:"pointer",
  display:"flex",
  alignItems:"center",
  gap:8,
}

const carDetailImageContainer = {
  position:"relative",
  borderRadius:24,
  overflow:"hidden",
  boxShadow:"0 40px 80px rgba(0,0,0,0.4)",
}

const carDetailImage = {
  width:"100%",
  height:500,
  objectFit:"cover",
}

const carDetailImageOverlay = {
  position:"absolute",
  inset:0,
  background:"linear-gradient(180deg, transparent 60%, rgba(7,11,20,0.8) 100%)",
}

const detailBadge = {
  padding:"8px 16px",
  background:"rgba(100,210,255,0.15)",
  color:"#64d2ff",
  borderRadius:8,
  fontSize:14,
  fontWeight:600,
}

const detailBadgeOutline = {
  padding:"8px 16px",
  background:"transparent",
  color:"#22c55e",
  border:"1px solid #22c55e",
  borderRadius:8,
  fontSize:14,
  fontWeight:600,
}

const specsGrid = {
  display:"grid",
  gridTemplateColumns:"1fr 1fr",
  gap:20,
  padding:28,
  background:"rgba(255,255,255,0.03)",
  borderRadius:16,
  border:"1px solid rgba(255,255,255,0.06)",
}

const specItem = {
  display:"flex",
  flexDirection:"column",
  gap:6,
}

const specLabel = {
  fontSize:13,
  opacity:0.5,
  textTransform:"uppercase",
  letterSpacing:"1px",
}

const specValue = {
  fontSize:16,
  fontWeight:600,
}

const authPage = {
  minHeight:"90vh",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  padding:"48px",
  background:"linear-gradient(180deg, #070b14 0%, #0d1321 100%)",
}

const authCard = {
  width:"100%",
  maxWidth:420,
  padding:"48px",
  background:"rgba(255,255,255,0.03)",
  borderRadius:24,
  border:"1px solid rgba(255,255,255,0.08)",
  backdropFilter:"blur(20px)",
}

const authTitle = {
  fontSize:32,
  fontWeight:700,
  marginBottom:12,
  textAlign:"center",
}

const authSubtitle = {
  fontSize:16,
  opacity:0.6,
  marginBottom:32,
  textAlign:"center",
}

const authForm = {
  display:"flex",
  flexDirection:"column",
  gap:20,
}

const authInputGroup = {
  display:"flex",
  flexDirection:"column",
  gap:8,
}

const authLabel = {
  fontSize:14,
  fontWeight:500,
  opacity:0.8,
}

const authInput = {
  padding:"14px 16px",
  borderRadius:10,
  border:"1px solid rgba(255,255,255,0.1)",
  background:"rgba(255,255,255,0.05)",
  color:"#fff",
  fontSize:15,
  outline:"none",
  transition:"border-color 0.2s",
}

const authBtn = {
  padding:"14px",
  background:"#fff",
  color:"#070b14",
  borderRadius:10,
  border:"none",
  fontSize:16,
  fontWeight:600,
  cursor:"pointer",
  marginTop:8,
}

const authError = {
  padding:"12px 16px",
  background:"rgba(239,68,68,0.1)",
  color:"#ef4444",
  borderRadius:8,
  fontSize:14,
  marginBottom:20,
}

const authFooter = {
  textAlign:"center",
  marginTop:24,
  fontSize:14,
  opacity:0.7,
}

const authLink = {
  color:"#64d2ff",
  textDecoration:"none",
  fontWeight:600,
}

const divider = {
  display:"flex",
  alignItems:"center",
  margin:"24px 0",
  color:"rgba(255,255,255,0.5)",
  fontSize:14,
}

const dividerText = {
  position:"relative",
  padding:"0 16px",
  background:"rgba(10,14,26,0.8)",
}

// New 3D Flip Card Auth Styles
const newAuthPage = {
  minHeight:"90vh",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  background:"linear-gradient(-45deg,#0f172a,#1e293b,#0ea5e9,#6366f1)",
  backgroundSize:"400% 400%",
  animation:"gradient 10s ease infinite",
}

const newAuthContainer = {
  width:"400px",
  perspective:"1000px",
}

const newAuthCard = {
  width:"100%",
  height:"520px",
  position:"relative",
  transformStyle:"preserve-3d",
  transition:"transform 0.8s",
}

const newAuthFormBase = {
  position:"absolute",
  width:"100%",
  height:"100%",
  background:"rgba(255,255,255,0.1)",
  backdropFilter:"blur(15px)",
  borderRadius:"20px",
  padding:"30px",
  color:"white",
  display:"flex",
  flexDirection:"column",
  justifyContent:"center",
  gap:"15px",
  boxShadow:"0 20px 40px rgba(0,0,0,0.3)",
  backfaceVisibility:"hidden",
}

const newAuthFormFront = {
  ...newAuthFormBase,
  transform:"rotateY(0deg)",
}

const newAuthFormBack = {
  ...newAuthFormBase,
  transform:"rotateY(180deg)",
}

const newAuthTitle = {
  fontSize:"28px",
  fontWeight:700,
  textAlign:"center",
  marginBottom:"10px",
}

const newAuthFormInner = {
  display:"flex",
  flexDirection:"column",
  gap:"15px",
}

const newAuthInput = {
  padding:"14px",
  border:"none",
  borderRadius:"10px",
  outline:"none",
  fontSize:"15px",
  background:"rgba(255,255,255,0.9)",
  color:"#1e293b",
}

const newAuthBtn = {
  padding:"14px",
  border:"none",
  borderRadius:"10px",
  background:"#0ea5e9",
  color:"white",
  cursor:"pointer",
  fontSize:"16px",
  fontWeight:600,
  transition:"all 0.3s",
  marginTop:"5px",
}

const newAuthDivider = {
  textAlign:"center",
  opacity:0.7,
  fontSize:"14px",
  margin:"10px 0",
}

const newAuthSwitchText = {
  textAlign:"center",
  fontSize:"14px",
  opacity:0.9,
  marginTop:"10px",
}

const newAuthSwitchLink = {
  color:"#0ea5e9",
  cursor:"pointer",
  fontWeight:600,
  textDecoration:"underline",
}

const newAuthError = {
  padding:"12px",
  background:"rgba(239,68,68,0.2)",
  color:"#fecaca",
  borderRadius:"10px",
  fontSize:"14px",
  textAlign:"center",
}

// ==================== RESPONSIVE STYLES ====================

// Mobile Navigation
const mobileMenuBtn = {
  display:"none",
  background:"none",
  border:"none",
  color:"#fff",
  fontSize:"24px",
  cursor:"pointer",
  padding:"8px",
}

const mobileNav = {
  display:"none",
  position:"fixed",
  top:"70px",
  left:0,
  right:0,
  background:"rgba(7,11,20,0.95)",
  backdropFilter:"blur(20px)",
  padding:"20px",
  flexDirection:"column",
  gap:"20px",
  zIndex:100,
  borderBottom:"1px solid rgba(255,255,255,0.1)",
}

const mobileNavLink = {
  color:"#fff",
  textDecoration:"none",
  fontSize:"18px",
  padding:"12px 0",
  borderBottom:"1px solid rgba(255,255,255,0.1)",
}

// Responsive Media Queries (injected via style tag)
const responsiveStyles = `
  /* Mobile - up to 768px */
  @media (max-width: 768px) {
    /* Navigation */
    .nav-links {
      display: none !important;
    }
    .mobile-menu-btn {
      display: block !important;
    }
    .mobile-nav.open {
      display: flex !important;
    }
    
    /* Hero Section */
    .hero-title {
      font-size: 40px !important;
      letter-spacing: -1px !important;
    }
    .hero-subtitle {
      font-size: 16px !important;
      padding: 0 20px !important;
    }
    .hero-stats {
      flex-direction: column !important;
      gap: 24px !important;
      margin-top: 40px !important;
    }
    .hero-stat-number {
      font-size: 28px !important;
    }
    
    /* Featured Grid */
    .featured-grid {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
      padding: 0 20px !important;
    }
    
    /* Features Section */
    .features-grid {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
      padding: 0 20px !important;
    }
    
    /* Why Choose Us */
    .why-grid {
      grid-template-columns: 1fr !important;
      gap: 40px !important;
      padding: 0 20px !important;
    }
    .why-image {
      height: 300px !important;
    }
    
    /* Car Detail Page */
    .car-detail-grid {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
    }
    .car-detail-image {
      height: 300px !important;
    }
    .specs-grid {
      grid-template-columns: 1fr !important;
    }
    
    /* Footer */
    .footer-grid {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
      text-align: center !important;
    }
    
    /* Auth Page */
    .auth-container {
      width: 90% !important;
      max-width: 360px !important;
    }
    .auth-card {
      height: 540px !important;
    }
    
    /* Section padding */
    .section {
      padding: 60px 16px !important;
    }
    
    /* Inventory page */
    .inventory-grid {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
      padding: 0 16px !important;
    }
    
    /* Navigation adjustments */
    nav {
      padding: 16px 20px !important;
    }
    
    /* CTA buttons */
    .hero-buttons {
      flex-direction: column !important;
      width: 100% !important;
      padding: 0 20px !important;
    }
    .hero-buttons button {
      width: 100% !important;
    }
    
    /* Section titles */
    .section-title {
      font-size: 32px !important;
    }
    .section-subtitle {
      font-size: 16px !important;
      padding: 0 20px !important;
    }
  }
  
  /* Tablet - 769px to 1024px */
  @media (min-width: 769px) and (max-width: 1024px) {
    .featured-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .features-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .why-grid {
      grid-template-columns: 1fr !important;
    }
    .car-detail-grid {
      grid-template-columns: 1fr !important;
    }
    .footer-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .hero-title {
      font-size: 56px !important;
    }
    .section {
      padding: 80px 32px !important;
    }
  }
  
  /* Large screens - above 1400px */
  @media (min-width: 1400px) {
    .featured-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
    .hero-title {
      font-size: 80px !important;
    }
  }
  
  /* Extra small phones - below 375px */
  @media (max-width: 375px) {
    .hero-title {
      font-size: 32px !important;
    }
    .auth-container {
      width: 95% !important;
    }
    .auth-card {
      height: 560px !important;
    }
    .section-title {
      font-size: 28px !important;
    }
  }
  
  /* Prevent horizontal scroll */
  html, body {
    max-width: 100%;
    overflow-x: hidden;
  }
  
  /* Better touch targets on mobile */
  @media (max-width: 768px) {
    button, a, input {
      min-height: 44px;
      min-width: 44px;
    }
    input {
      font-size: 16px !important; /* Prevents zoom on iOS */
    }
    
    /* Contact form responsive */
    .contact-page form input,
    .contact-page form textarea {
      width: 100% !important;
    }
    
    /* Google button fit on mobile */
    .auth-container iframe,
    .auth-container div[role="button"] {
      max-width: 100% !important;
    }
    
    /* Card specs on mobile */
    .car-specs {
      flex-direction: column !important;
      gap: 8px !important;
    }
    
    /* Dashboard responsive */
    .dashboard-grid {
      grid-template-columns: 1fr !important;
    }
    
    /* Modal responsive */
    .modal-content {
      width: 95% !important;
      max-width: 400px !important;
      padding: 20px !important;
    }
    
    /* Why floating card */
    .floating-card {
      bottom: 10px !important;
      right: 10px !important;
      padding: 15px 20px !important;
    }
    .floating-card .number {
      font-size: 24px !important;
    }
    
    /* Dashboard sidebar responsive */
    .dashboard-layout {
      flex-direction: column !important;
      height: auto !important;
      min-height: calc(100vh - 58px) !important;
    }
    .dashboard-sidebar {
      width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid rgba(255,255,255,0.06) !important;
      padding: 15px !important;
    }
    .dashboard-sidebar h2 {
      font-size: 18px !important;
      margin-bottom: 10px !important;
    }
    .dashboard-sidebar > div {
      display: inline-block !important;
      margin: 4px !important;
      padding: 8px 12px !important;
      font-size: 14px !important;
    }
    
    /* Topbar responsive */
    .dashboard-main > div:first-child {
      padding: 10px 15px !important;
      height: auto !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }
    
    /* Dashboard grid 1 column on mobile */
    .dashboard-grid {
      grid-template-columns: 1fr !important;
      padding: 15px !important;
    }
    
    /* Profile page responsive */
    .profile-page > div:first-child {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .profile-page h1 {
      font-size: 32px !important;
    }
    .profile-page .unlock-section,
    .profile-page > div > div:last-child {
      width: 100% !important;
      min-width: auto !important;
      margin-top: 20px !important;
    }
    .profile-grid {
      grid-template-columns: 1fr !important;
    }
    
    /* New Admin Dashboard Responsive */
    .dashboard-main-grid,
    .dashboard-bottom-grid {
      grid-template-columns: 1fr !important;
    }
    .stats-cards {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .dashboard-sidebar {
      width: 100% !important;
      min-height: auto !important;
    }
    .dashboard-layout {
      flex-direction: column !important;
    }
    .dashboard-main {
      padding: 16px !important;
    }
    .dashboard-main header {
      flex-direction: column !important;
      gap: 16px !important;
      align-items: stretch !important;
    }
    .dashboard-main header h1 {
      font-size: 24px !important;
    }
    .dashboard-main header button {
      width: 100% !important;
      justify-content: center !important;
    }
  }
  
  /* Extra small screens */
  @media (max-width: 480px) {
    .stats-cards {
      grid-template-columns: 1fr !important;
    }
  }
`
