export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const isValidPhone = (phone) => {
  const re = /^[6-9]\d{9}$/
  return re.test(phone.replace(/\D/g, ''))
}

export const isValidPassword = (password) => {
  return password.length >= 8
}

export const isRequired = (value) => {
  return value !== undefined && value !== null && value.toString().trim() !== ''
}

export const minLength = (value, length) => {
  return value && value.length >= length
}

export const maxLength = (value, length) => {
  return value && value.length <= length
}
