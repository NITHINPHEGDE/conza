const { validationResult } = require('express-validator')
const { createError } = require('../utils/error')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ')
    return next(createError(400, messages))
  }
  next()
}

module.exports = validate
