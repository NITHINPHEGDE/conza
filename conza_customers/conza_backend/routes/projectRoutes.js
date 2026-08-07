const express = require('express');
const router  = express.Router();
const {
  getAttachableItems, createProject, getMyProjects, getProjectById,
  updateProject, addAttachment, removeAttachment, deleteProject,
} = require('../controllers/projectController');
const { protect, checkSuspended } = require('../middleware/authMiddleware');

router.get('/attachable-items', protect, getAttachableItems);
router.get('/my',  protect, getMyProjects);
router.get('/:id', protect, getProjectById);

router.post('/', protect, checkSuspended, createProject);
router.patch('/:id', protect, checkSuspended, updateProject);
router.patch('/:id/attachments', protect, checkSuspended, addAttachment);
router.delete('/:id/attachments/:attachmentId', protect, checkSuspended, removeAttachment);
router.delete('/:id', protect, checkSuspended, deleteProject);

module.exports = router;
