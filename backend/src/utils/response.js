export const success = (data = null) => ({ success: true, data })

export const failure = (status, message) => {
  const error = new Error(message)
  error.status = status
  throw error
}
