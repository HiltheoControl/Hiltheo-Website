import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

const NAV = [
  { id: "Overview", icon: "📊" },
  { id: "Inventory", icon: "🚗" },
  { id: "Sales", icon: "💰" },
  { id: "Customers", icon: "👥" },
  { id: "Analytics", icon: "📈" },
  { id: "Messages", icon: "✉️" },
  { id: "Settings", icon: "⚙️" }
]

const emptyCar = {
  id: null, make: "", model: "", year: "", price: "",
  mileage: "", status: "Available", vin: "", images: []
}

// Stats Cards Component
function StatsCards({ carCount }) {
  const stats = [
    { title: "Total Cars", value: carCount?.toString() || "0", icon: "🚗", color: "#3b82f6" },
    { title: "Monthly Sales", value: "$148K", icon: "💰", color: "#10b981" },
    { title: "Customers", value: "1,245", icon: "👥", color: "#8b5cf6" },
    { title: "Messages", value: "32 New", icon: "✉️", color: "#f59e0b" }
  ]

  return (
    <div className="stats-cards" style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginBottom: "25px"
    }}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{
            background: "rgba(255,255,255,0.03)",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", opacity: 0.6, marginBottom: "8px" }}>{stat.title}</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            </div>
            <div style={{ fontSize: "24px" }}>{stat.icon}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Sales Chart Component
function SalesChart() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Chart data
    const data = [12, 19, 8, 15, 22, 17]
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const maxVal = Math.max(...data)
    const barWidth = (rect.width - 60) / data.length * 0.6
    const spacing = (rect.width - 60) / data.length

    // Draw bars
    data.forEach((val, i) => {
      const barHeight = (val / maxVal) * (rect.height - 80)
      const x = 40 + i * spacing + (spacing - barWidth) / 2
      const y = rect.height - 40 - barHeight

      // Gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#1d4ed8')

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)

      // Value label
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(val, x + barWidth / 2, y - 8)

      // Month label
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText(labels[i], x + barWidth / 2, rect.height - 20)
    })
  }, [])

  return (
    <div style={{ height: "200px", width: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}

// Sidebar Component
function Sidebar({ active, setActive, onLogout }) {
  return (
    <div className="dashboard-sidebar" style={{
      width: "250px",
      background: "#0f172a",
      color: "#fff",
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)"
    }}>
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#3b82f6" }}>Hiltheo Admin</h2>
        <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "4px" }}>Car Dealership</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {NAV.map(n => (
          <div
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              background: active === n.id ? "#3b82f6" : "transparent",
              borderRadius: "10px",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "15px",
              color: active === n.id ? "#fff" : "rgba(255,255,255,0.7)",
            }}
          >
            <span>{n.icon}</span>
            <span>{n.id}</span>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          onClick={onLogout}
          style={{
            padding: "12px 16px",
            cursor: "pointer",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "15px",
            color: "rgba(255,255,255,0.7)",
            transition: "all 0.3s"
          }}
        >
          <span>🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </div>
  )
}

// Inventory Table Component
function InventoryTable({ cars, onEdit, onDelete }) {
  return (
    <div style={{ overflow: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px"
      }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Image</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Vehicle</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Year</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Price</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map(car => (
            <tr key={car.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td style={{ padding: "12px" }}>
                <img
                  src={car.image || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200"}
                  alt={`${car.make} ${car.model}`}
                  style={{
                    width: "80px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.1)"
                  }}
                />
              </td>
              <td style={{ padding: "12px", fontWeight: 500 }}>{car.make} {car.model}</td>
              <td style={{ padding: "12px", opacity: 0.8 }}>{car.year}</td>
              <td style={{ padding: "12px", color: "#3b82f6", fontWeight: 600 }}>{car.price || "-"}</td>
              <td style={{ padding: "12px" }}>
                <button
                  onClick={() => onEdit(car)}
                  style={{
                    background: "#3b82f6",
                    border: "none",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginRight: "8px",
                    fontSize: "12px"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(car.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(239,68,68,0.5)",
                    color: "#ef4444",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Recent Messages Component
function RecentMessages() {
  const messages = [
    { id: 1, text: "Customer inquiry about BMW X5 availability.", time: "2 min ago" },
    { id: 2, text: "Service request for Toyota Corolla.", time: "1 hour ago" },
    { id: 3, text: "New financing application received.", time: "3 hours ago" }
  ]

  return (
    <div>
      <h3 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>Recent Messages</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {messages.map(msg => (
          <li
            key={msg.id}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              fontSize: "14px"
            }}
          >
            <div style={{ opacity: 0.9 }}>{msg.text}</div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "4px" }}>{msg.time}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Settings Panel Component
function SettingsPanel() {
  const [settings, setSettings] = useState({
    dealershipName: "Hiltheo Synergy",
    notifications: "Enabled",
    theme: "Dark"
  })

  return (
    <div>
      <h3 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>Settings</h3>
      <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", opacity: 0.6, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Dealership Name
          </label>
          <input
            type="text"
            value={settings.dealershipName}
            onChange={e => setSettings({ ...settings, dealershipName: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px"
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", opacity: 0.6, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Email Notifications
          </label>
          <select
            value={settings.notifications}
            onChange={e => setSettings({ ...settings, notifications: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px"
            }}
          >
            <option style={{ background: "#1f2937" }}>Enabled</option>
            <option style={{ background: "#1f2937" }}>Disabled</option>
          </select>
        </div>
        <button
          type="button"
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            marginTop: "8px"
          }}
        >
          Save Settings
        </button>
      </form>
    </div>
  )
}

// Modal Component
function Modal({ open, onClose, onSave, editing }) {
  const [f, setF] = useState(emptyCar)

  useEffect(() => {
    setF(editing || emptyCar)
  }, [editing])

  const update = (k, v) => setF({ ...f, [k]: v })

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "#1f2937",
          padding: "28px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "450px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}
      >
        <h3 style={{ fontSize: "20px", marginBottom: "20px", fontWeight: 600 }}>
          {editing ? "Edit Vehicle" : "Add New Vehicle"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            placeholder="Make (e.g., BMW)"
            value={f.make}
            onChange={e => update("make", e.target.value)}
            style={{
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px"
            }}
          />
          <input
            placeholder="Model (e.g., X5)"
            value={f.model}
            onChange={e => update("model", e.target.value)}
            style={{
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px"
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              placeholder="Year"
              value={f.year}
              onChange={e => update("year", e.target.value)}
              style={{
                padding: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px"
              }}
            />
            <input
              placeholder="Price"
              value={f.price}
              onChange={e => update("price", e.target.value)}
              style={{
                padding: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ marginTop: "8px" }}>
            <label style={{ display: "block", fontSize: "12px", opacity: 0.6, marginBottom: "6px" }}>
              Image URL (optional)
            </label>
            <input
              placeholder="https://images.unsplash.com/..."
              value={f.image || ""}
              onChange={e => update("image", e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "12px"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", opacity: 0.6, marginBottom: "6px" }}>
              Or upload images
            </label>
            <input
              type="file"
              multiple
              onChange={e => {
                const files = [...e.target.files]
                Promise.all(files.map(f => {
                  return new Promise(res => {
                    const r = new FileReader()
                    r.onload = () => res(r.result)
                    r.readAsDataURL(f)
                  })
                })).then(imgs => update("images", imgs))
              }}
              style={{ fontSize: "14px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              onClick={() => { onSave({ ...f, id: f.id || Date.now() }); onClose() }}
              style={{
                flex: 1,
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600
              }}
            >
              Save Vehicle
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Overview Dashboard Component
function OverviewDashboard({ cars }) {
  return (
    <div>
      <StatsCards carCount={cars.length} />

      {/* Main Grid - Inventory + Chart */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "20px",
        marginBottom: "25px"
      }} className="dashboard-main-grid">
        {/* Inventory Panel */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Recent Inventory</h3>
            <span style={{ fontSize: "14px", opacity: 0.5 }}>{cars.length} vehicles</span>
          </div>
          <div style={{ overflow: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Image</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Vehicle</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Year</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, opacity: 0.6 }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {cars.slice(0, 5).map(car => (
                  <tr key={car.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>
                      <img
                        src={car.image || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200"}
                        alt={`${car.make} ${car.model}`}
                        style={{
                          width: "60px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          background: "rgba(255,255,255,0.1)"
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", fontWeight: 500 }}>{car.make} {car.model}</td>
                    <td style={{ padding: "12px", opacity: 0.8 }}>{car.year}</td>
                    <td style={{ padding: "12px", color: "#3b82f6", fontWeight: 600 }}>{car.price || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Chart Panel */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Sales Analytics</h3>
          <SalesChart />
        </div>
      </div>

      {/* Bottom Grid - Messages + Settings */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px"
      }} className="dashboard-bottom-grid">
        <div style={{
          background: "rgba(255,255,255,0.03)",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <RecentMessages />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <SettingsPanel />
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const [active, setActive] = useState("Overview")
  const [cars, setCars] = useState([
    { id: 1, make: "Mercedes-Benz", model: "S-Class", year: "2023", price: "$125,000", image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400" },
    { id: 2, make: "BMW", model: "7 Series", year: "2024", price: "$140,000", image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400" },
    { id: 3, make: "Audi", model: "Q8", year: "2023", price: "$95,000", image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400" },
    { id: 4, make: "Tesla", model: "Model S", year: "2023", price: "$89,000", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400" },
    { id: 5, make: "Porsche", model: "Panamera", year: "2024", price: "$105,000", image: "https://images.unsplash.com/photo-1503376763036-066120622c74?w=400" },
    { id: 6, make: "Lamborghini", model: "Huracan", year: "2023", price: "$230,000", image: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=400" },
    { id: 7, make: "Ferrari", model: "488 GTB", year: "2022", price: "$285,000", image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400" },
    { id: 8, make: "Range Rover", model: "Sport", year: "2024", price: "$95,000", image: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400" },
    { id: 9, make: "Lexus", model: "LS 500", year: "2023", price: "$78,000", image: "https://images.unsplash.com/photo-1552519507-da3b1425c29d?w=400" },
    { id: 10, make: "Bentley", model: "Continental GT", year: "2024", price: "$210,000", image: "https://images.unsplash.com/photo-1563720223185-11003d70e89b?w=400" },
    { id: 11, make: "Rolls Royce", model: "Ghost", year: "2023", price: "$340,000", image: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=400" },
    { id: 12, make: "Aston Martin", model: "DB11", year: "2022", price: "$205,000", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400" },
    { id: 13, make: "Maserati", model: "Quattroporte", year: "2023", price: "$145,000", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400" },
    { id: 14, make: "Cadillac", model: "Escalade", year: "2024", price: "$105,000", image: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?w=400" },
    { id: 15, make: "Jaguar", model: "F-Type", year: "2023", price: "$75,000", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400" }
  ])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleLogout = () => {
    // Clear admin unlocked state
    localStorage.removeItem('hiltheo_admin_unlocked')
    window.location.href = '/'
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setCars(cars.filter(c => c.id !== id))
    }
  }

  return (
    <div className="dashboard-layout" style={{
      display: "flex",
      minHeight: "calc(100vh - 58px)",
      background: "#070b14",
      color: "#fff"
    }}>
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

      <div className="dashboard-main" style={{ flex: 1, padding: "24px", overflow: "auto" }}>
        {/* Header */}
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
              {active === "Overview" ? "Dashboard" : active}
            </h1>
            <p style={{ fontSize: "14px", opacity: 0.5, marginTop: "4px" }}>
              Welcome back, manage your dealership
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setOpen(true) }}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>+</span> Add Vehicle
          </button>
        </header>

        {/* Content Based on Active Tab */}
        {active === "Overview" && <OverviewDashboard cars={cars} />}

        {active === "Inventory" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600 }}>All Vehicles</h3>
              <span style={{ fontSize: "14px", opacity: 0.5 }}>{cars.length} total</span>
            </div>
            <InventoryTable
              cars={cars}
              onEdit={(c) => { setEditing(c); setOpen(true) }}
              onDelete={handleDelete}
            />
          </div>
        )}

        {active === "Sales" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Sales Performance</h3>
            <SalesChart />
          </div>
        )}

        {active === "Customers" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Customer Management</h3>
            <p style={{ opacity: 0.6 }}>Customer list coming soon...</p>
          </div>
        )}

        {active === "Analytics" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Analytics Dashboard</h3>
            <StatsCards carCount={cars.length} />
          </div>
        )}

        {active === "Messages" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Messages</h3>
            <RecentMessages />
          </div>
        )}

        {active === "Settings" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            maxWidth: "500px"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>System Settings</h3>
            <SettingsPanel />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(car) => {
          setCars(prev => {
            const ex = prev.find(c => c.id === car.id)
            if (ex) return prev.map(c => c.id === car.id ? car : c)
            return [...prev, car]
          })
        }}
      />
    </div>
  )
}
