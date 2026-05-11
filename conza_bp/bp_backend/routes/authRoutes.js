const router     = require('express').Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect }              = require('../middleware/auth');
const { signupRules, loginRules } = require('../validators/workerValidators');

router.post('/signup', signupRules, signup);
router.post('/login',  loginRules,  login);
router.get('/me',      protect,     getMe);

module.exports = router;
