const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  res.status(statusCode).json({ success: true, message, ...data })
}

const sendError = (res, statusCode = 500, message = 'Error') => {
  res.status(statusCode).json({ success: false, message })
}

const sendPaginated = (res, data, total, page, limit) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  })
}

module.exports = { sendSuccess, sendError, sendPaginated }
