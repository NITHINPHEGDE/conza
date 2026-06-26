const Worker = require('../models/Worker')
const Vendor = require('../models/Vendor')
const { sendSuccess } = require('../utils/response')

exports.getLiveTracking = async (req, res, next) => {
  try {
    const workers = await Worker.find({ isOnline: true, latitude: { $ne: null } })
      .select('fullName category latitude longitude isAvailable status rating')

    const vendors = await Vendor.find({ status: 'active', latitude: { $ne: null } })
      .select('name shopName latitude longitude status rating')

    sendSuccess(res, 200, 'Live tracking data fetched', { workers, vendors })
  } catch (err) {
    next(err)
  }
}
