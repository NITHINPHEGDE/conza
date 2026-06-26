const express = require('express')
const router = express.Router()
const c = require('../controllers/walletController')
const { protect, requirePermission } = require('../middleware/auth')
const { logAction } = require('../middleware/auditLogger')

router.use(protect)
router.use(requirePermission('wallets'))

router.get('/customers', c.getCustomerWallets)
router.get('/workers', c.getWorkerWallets)
router.get('/vendors', c.getVendorWallets)
router.get('/business-partners', c.getBPWallets)
router.put('/:id/credit', logAction('Wallets', 'Wallet Credited', 'wallet', 'high'), c.creditWallet)
router.put('/:id/debit', logAction('Wallets', 'Wallet Debited', 'wallet', 'high'), c.debitWallet)

module.exports = router
