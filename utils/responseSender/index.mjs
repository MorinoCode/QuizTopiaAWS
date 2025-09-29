export const response = (statusCode, success, message, data = null) => {
  return {
    statusCode, 
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success, 
      message,
      data
    })
  }
}
