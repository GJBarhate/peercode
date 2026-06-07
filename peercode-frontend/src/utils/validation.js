/**
 * Input validation and sanitization utilities
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must include at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must include at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must include at least one special character (!@#$%^&*)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUsername = (username) => {
  const errors = []

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters')
  }
  if (username.length > 20) {
    errors.push('Username must be at most 20 characters')
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .slice(0, 500) // Limit length
}

export const validateLoginForm = (email, password) => {
  const errors = {}

  if (!email || !email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateRegisterForm = (username, email, password, confirmPassword) => {
  const errors = {}

  // Username validation
  if (!username || !username.trim()) {
    errors.username = 'Username is required'
  } else {
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors[0]
    }
  }

  // Email validation
  if (!email || !email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required'
  } else {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0] // Show first error only
    }
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeInput,
  validateLoginForm,
  validateRegisterForm
}
