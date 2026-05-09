// API client for backend communication
const API_URL = 'http://localhost:5000/api'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hiltheo_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  return response
}

// Auth API
export const authAPI = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  googleLogin: (token) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),
  
  signup: (name, email, password) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),
  
  verify: () =>
    apiRequest('/auth/verify'),
  
  getGoogleClientId: () =>
    fetch(`${API_URL}/config/google`).then(r => r.json())
}

// Admin API
export const adminAPI = {
  getCars: () =>
    apiRequest('/admin/cars'),
  
  createCar: (car) =>
    apiRequest('/admin/cars', {
      method: 'POST',
      body: JSON.stringify(car)
    }),
  
  updateCar: (id, car) =>
    apiRequest(`/admin/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(car)
    }),
  
  deleteCar: (id) =>
    apiRequest(`/admin/cars/${id}`, {
      method: 'DELETE'
    })
}
