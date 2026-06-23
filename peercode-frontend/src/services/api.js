import axios from 'axios'

let accessTokenRef = null
let refreshingToken = false
let refreshSubscribers = []
let tokenRefreshHandler = null
let sharedRefreshPromise = null

const isDev = import.meta.env.DEV
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:5000/api' : null)

if (!API_BASE_URL) {
 throw new Error('VITE_API_URL must be configured')
}

// Persist access token in sessionStorage across page refreshes
function loadToken() {
 try {
 const stored = sessionStorage.getItem('peercode_access_token')
 if (stored) {
 accessTokenRef = stored
 }
 } catch (_) {}
}

function saveToken(token) {
 try {
 if (token) {
 sessionStorage.setItem('peercode_access_token', token)
 } else {
 sessionStorage.removeItem('peercode_access_token')
 }
 } catch (_) {}
}

loadToken()

export function setAccessToken(token) {
 accessTokenRef = token
 saveToken(token)
}

export function getAccessToken() {
 return accessTokenRef
}

export function setTokenRefreshHandler(handler) {
 tokenRefreshHandler = handler
}

// Shared refresh function with global dedup — used by both AuthContext and API interceptor
export async function refreshAccessToken() {
 if (sharedRefreshPromise) return sharedRefreshPromise

 sharedRefreshPromise = (async () => {
 try {
 const response = await axios.post(
 `${API_BASE_URL}/auth/refresh`,
 {},
 { withCredentials: true, timeout: 5000 }
 )
 accessTokenRef = response.data.accessToken
 tokenRefreshHandler?.(response.data.accessToken, response.data.user)
 return response.data.accessToken
 } catch (err) {
 accessTokenRef = null
 return null
 } finally {
 sharedRefreshPromise = null
 }
 })()

 return sharedRefreshPromise
}

let geminiKeyRef = null
export function setGeminiKey(key) {
 geminiKeyRef = key
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
 return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
}

const api = axios.create({
 baseURL: API_BASE_URL,
 withCredentials: true,
 timeout: 15000,
})

api.interceptors.request.use(config => {
 if (accessTokenRef) {
 config.headers['Authorization'] = `Bearer ${accessTokenRef}`
 }
 if (geminiKeyRef) {
 config.headers['x-gemini-key'] = geminiKeyRef
 }
 return config
})

api.interceptors.response.use(
 response => response,
 async error => {
 const originalRequest = error.config
 
 // Only retry on 401 and if we haven't already retried this request
 if (error.response?.status === 401 && !originalRequest._retry) {
 // Prevent multiple simultaneous refresh attempts
 if (refreshingToken) {
 return new Promise((resolve, reject) => {
 refreshSubscribers.push({ resolve, reject, originalRequest })
 })
 }
 
 originalRequest._retry = true
 refreshingToken = true
 
 try {
 const newToken = await refreshAccessToken()
 if (!newToken) throw new Error('Refresh failed')

 // Retry all queued requests with new token
 refreshSubscribers.forEach(({ resolve, originalRequest: req }) => {
 req.headers['Authorization'] = `Bearer ${accessTokenRef}`
 resolve(api(req))
 })
 refreshSubscribers = []

 // Retry original request with new token
 originalRequest.headers['Authorization'] = `Bearer ${accessTokenRef}`
 return api(originalRequest)
 } catch (refreshError) {
 // Refresh failed - reject all queued requests
 refreshSubscribers.forEach(({ reject }) => reject(refreshError))
 refreshSubscribers = []
 
 accessTokenRef = null
 sessionStorage.removeItem('peercode_access_token')
 
 // Redirect to login on refresh failure
 if (typeof window !== 'undefined') {
 window.location.href = '/'
 }
 
 return Promise.reject(refreshError)
 } finally {
 refreshingToken = false
 }
 }
 
 return Promise.reject(error)
 }
)

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (username, email, password) => api.post('/auth/register', { username, email, password })
export const refreshToken = () => api.post('/auth/refresh')
export const logout = () => api.post('/auth/logout')
export const googleAuth = (code) => api.post('/auth/google', { code })
export const linkGoogleAccount = (code) => api.post('/auth/link-google', { code })
export const unlinkGoogleAccount = () => api.post('/auth/unlink-google')

// Rooms
export const createRoom = (data) => api.post('/rooms', data)
export const getRoom = (roomId) => api.get(`/rooms/${roomId}`)
export const joinRoom = (roomId, data) => api.post(`/rooms/${roomId}/join`, data)
export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`)
export const createPrivateRoom = (data) => api.post('/rooms/private', data)
export const joinPrivateRoom = (inviteCode) => api.get(`/rooms/join/${inviteCode}`)

// Problems
export const getProblems = (params, signal) => api.get('/problems', { params, signal })
export const getProblem = (slug) => api.get(`/problems/${slug}`)
export const getProblemStats = () => api.get('/problems/stats')
export const createProblem = (data) => api.post('/problems', data)
export const updateProblem = (id, data) => api.put(`/problems/${id}`, data)
export const reportProblem = (id, data) => api.post(`/problems/${id}/report`, data)

// Sessions
export const getSession = (roomId) => api.get(`/sessions/${roomId}`)
export const getPlayback = (roomId) => api.get(`/sessions/${roomId}/playback`)
export const endSession = (roomId) => api.post(`/sessions/${roomId}/end`)
export const getDebrief = (roomId) => api.get(`/sessions/${roomId}/debrief`)
export const generateDebrief = (sessionId) => api.post(`/debrief/${sessionId}/generate`)
export const getAnalytics = (roomId) => api.get(`/sessions/${roomId}/analytics`)

// Ratings
export const submitRating = (sessionId, toUserId, score, feedback) => api.post('/ratings', { sessionId, toUserId, score, feedback })
export const getUserRatings = (userId) => api.get(`/ratings/${userId || 'me'}`)
export const getSolutions = (problemId, params) => api.get(`/solutions/${problemId}`, { params })
export const createSolution = (problemId, data) => api.post(`/solutions/${problemId}`, data)
export const upvoteSolution = (id) => api.put(`/solutions/${id}/upvote`)

// Users
export const getProfile = () => api.get('/users/profile')
export const updateProfile = (data) => api.put('/profile', data)
export const updateApiKey = (apiKey) => api.put('/users/api-key', { apiKey })
export const getUserSessions = (params) => api.get('/sessions', { params })
export const getUserSolvedProblems = () => api.get('/users/solved-problems')
export const changePassword = (currentPassword, newPassword, confirmPassword) => api.put('/profile/password', { currentPassword, newPassword, confirmPassword })

// Gemini
export const getHint = (data) => api.post('/gemini/hint', data)
export const analyzeCode = (data) => api.post('/gemini/analyze', data)
export const validateGeminiKey = (apiKey) => api.post('/gemini-key/validate', { apiKey })

// Partner ratings
export const submitPartnerRating = (data) => api.post('/ratings', data)
export const getMyRatings = () => api.get('/ratings/me')
export const getUserRatingsById = (userId) => api.get(`/ratings/${userId}`)

// AI Interview
export const generateInterviewQuestions = (data) => api.post('/interview/questions', data)
export const evaluateInterviewAnswer = (data) => api.post('/interview/evaluate', data)
export const generateInterviewFeedback = (data) => api.post('/interview/feedback', data)

// Execute
export const executeCode = (data) => api.post('/execute', data)
export const runTests = (data) => api.post('/execute', data)

// Tracks
export const getTracks = () => api.get('/tracks')
export const getTrack = (slug) => api.get(`/tracks/${slug}`)
export const getAllTracksProgress = () => api.get('/tracks/progress')
export const getTrackProgress = (slug) => api.get(`/tracks/${slug}/progress`)
export const completeTrackProblem = (slug, problemId) => api.post(`/tracks/${slug}/problems/${problemId}/complete`)

// Solve
export const solveProblem = (slug, language) => api.post(`/problems/${slug}/solve`, { language })

// Admin
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminUsers = (params) => api.get('/admin/users', { params })
export const toggleBanUser = (userId) => api.put(`/admin/users/${userId}/toggle-ban`)
export const getAdminProblems = (params) => api.get('/admin/problems', { params })
export const updateAdminProblem = (id, data) => api.put(`/admin/problems/${id}`, data)
export const softDeleteProblem = (id) => api.delete(`/admin/problems/${id}`)
export const getAdminReports = () => api.get('/admin/reports')
export const resolveAdminReport = (id) => api.put(`/admin/reports/${id}/resolve`)

// Contests
export const getContests = () => api.get('/contests')
export const getContest = (slug) => api.get(`/contests/${slug}`)
export const joinContest = (slug) => api.post(`/contests/${slug}/join`)
export const recordContestSolve = (slug, problemId) => api.post(`/contests/${slug}/solve`, { problemId })
export const getContestHistory = () => api.get('/contests/history')

// Subscription
export const getPlans = () => api.get('/subscription/plans')
export const getSubscriptionStatus = () => api.get('/subscription/status')
export const createSubscription = (planId) => api.post('/subscription/create', { planId })
export const verifyPayment = (data) => api.post('/subscription/verify-payment', data)
export const getCancelInfo = () => api.post('/subscription/cancel-info')
export const cancelSubscription = (immediately) => api.post('/subscription/cancel', { immediately })

export default api
