module.exports = {
  handleError: (error) => ({
    statusCode: error.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: error.message })
  }),
  createResponse: (statusCode, body) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  })
};
