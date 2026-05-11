const asyncHandler  = require('../utils/asyncHandler');
const workerService = require('../services/workerService');

// POST /api/workers/signup
const signup = asyncHandler(async (req, res) => {
  const { worker, token } = await workerService.signUpWorker(req.body);
  res.status(201).json({ success: true, token, worker });
});

// POST /api/workers/login
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const { worker, token } = await workerService.loginWorker(identifier, password);
  res.status(200).json({ success: true, token, worker });
});

// GET /api/workers/me  (protected)
const getMe = asyncHandler(async (req, res) => {
  let worker = await workerService.getWorkerProfile(req.worker._id);
  worker = await workerService.checkAndAutoOffline(worker);
  res.status(200).json({ success: true, worker });
});

module.exports = { signup, login, getMe };
