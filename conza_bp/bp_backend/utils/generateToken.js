const { signToken } = require('./jwt');

const generateToken = (id) => signToken({ id });

module.exports = generateToken;
