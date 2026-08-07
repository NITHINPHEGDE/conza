const Project     = require('../models/Project');
const Booking      = require('../models/Booking');
const SellerOrder  = require('../models/SellerOrder');

// ── Status bucket helpers (mirror StatusScreen.js bucket logic on the frontend) ──
const labourBucket = (status) => {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const materialBucket = (status) => {
  if (status === 'delivered') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const rentalBucket = (status) => {
  if (status === 'returned') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const combineStatus = (buckets) => {
  if (!buckets.length) return 'no_attachments';
  if (buckets.includes('active')) return 'in_progress';
  if (buckets.every((b) => b === 'cancelled')) return 'cancelled';
  return 'completed';
};

// Loads the live Booking / SellerOrder document behind every attachment and
// returns a flat, display-ready array (skips attachments whose underlying
// booking/order no longer exists).
const loadAttachments = async (attachments) => {
  const bookingIds = attachments.filter((a) => a.refModel === 'Booking').map((a) => a.refId);
  const orderIds    = attachments.filter((a) => a.refModel === 'SellerOrder').map((a) => a.refId);

  const [bookings, orders] = await Promise.all([
    bookingIds.length
      ? Booking.find({ _id: { $in: bookingIds } }).select('category status total city createdAt').lean()
      : [],
    orderIds.length
      ? SellerOrder.find({ _id: { $in: orderIds } }).select('orderType items status total city createdAt').lean()
      : [],
  ]);

  const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
  const orderMap    = new Map(orders.map((o) => [o._id.toString(), o]));

  const items = [];
  for (const a of attachments) {
    const idStr = a.refId.toString();
    if (a.refModel === 'Booking') {
      const doc = bookingMap.get(idStr);
      if (!doc) continue;
      items.push({
        attachmentId: a._id,
        refModel: 'Booking',
        refId: doc._id,
        type: 'labour',
        title: doc.category ? `${doc.category} Booking` : 'Labour Booking',
        status: doc.status,
        bucket: labourBucket(doc.status),
        total: doc.total,
        city: doc.city,
        createdAt: doc.createdAt,
      });
    } else {
      const doc = orderMap.get(idStr);
      if (!doc) continue;
      const bucket = doc.orderType === 'rental' ? rentalBucket(doc.status) : materialBucket(doc.status);
      items.push({
        attachmentId: a._id,
        refModel: 'SellerOrder',
        refId: doc._id,
        type: doc.orderType,
        title: (doc.items || []).map((i) => i.title).filter(Boolean).join(', ') ||
          (doc.orderType === 'rental' ? 'Equipment Rental' : 'Material Order'),
        status: doc.status,
        bucket,
        total: doc.total,
        city: doc.city,
        createdAt: doc.createdAt,
      });
    }
  }
  return items;
};

// Validates that every requested attachment belongs to this customer AND is
// currently ongoing (not completed / cancelled / delivered / returned),
// matching "only ongoing labour bookings and placed orders" can be attached.
const sanitizeAttachments = async (attachments, userId) => {
  if (!Array.isArray(attachments) || !attachments.length) return [];

  const bookingIds = attachments.filter((a) => a && a.refModel === 'Booking' && a.refId).map((a) => a.refId);
  const orderIds    = attachments.filter((a) => a && a.refModel === 'SellerOrder' && a.refId).map((a) => a.refId);

  const [ownedBookings, ownedOrders] = await Promise.all([
    bookingIds.length
      ? Booking.find({ _id: { $in: bookingIds }, user: userId, status: { $nin: ['completed', 'cancelled'] } }).select('_id').lean()
      : [],
    orderIds.length
      ? SellerOrder.find({ _id: { $in: orderIds }, customer: userId, status: { $nin: ['delivered', 'returned', 'cancelled'] } }).select('_id').lean()
      : [],
  ]);

  const bookingSet = new Set(ownedBookings.map((b) => b._id.toString()));
  const orderSet    = new Set(ownedOrders.map((o) => o._id.toString()));

  const seen  = new Set();
  const clean = [];
  for (const a of attachments) {
    if (!a || !a.refId || !a.refModel) continue;
    const key = `${a.refModel}:${a.refId}`;
    if (seen.has(key)) continue;
    if (a.refModel === 'Booking' && bookingSet.has(a.refId.toString())) {
      seen.add(key);
      clean.push({ refModel: 'Booking', refId: a.refId });
    } else if (a.refModel === 'SellerOrder' && orderSet.has(a.refId.toString())) {
      seen.add(key);
      clean.push({ refModel: 'SellerOrder', refId: a.refId });
    }
  }
  return clean;
};

// @desc    Get the customer's ongoing labour bookings + orders that can be attached to a project
// @route   GET /api/projects/attachable-items
// @access  Private
const getAttachableItems = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [bookings, orders] = await Promise.all([
      Booking.find({ user: userId, status: { $nin: ['completed', 'cancelled'] } })
        .sort({ createdAt: -1 })
        .select('category status total city createdAt')
        .lean(),
      SellerOrder.find({ customer: userId, status: { $nin: ['delivered', 'returned', 'cancelled'] } })
        .sort({ createdAt: -1 })
        .select('orderType items status total city createdAt')
        .lean(),
    ]);

    const labourBookings = bookings.map((b) => ({
      refModel: 'Booking',
      refId: b._id,
      title: b.category ? `${b.category} Booking` : 'Labour Booking',
      status: b.status,
      total: b.total,
      city: b.city,
      createdAt: b.createdAt,
    }));

    const orderItems = orders.map((o) => ({
      refModel: 'SellerOrder',
      refId: o._id,
      type: o.orderType,
      title: (o.items || []).map((i) => i.title).filter(Boolean).join(', ') ||
        (o.orderType === 'rental' ? 'Equipment Rental' : 'Material Order'),
      status: o.status,
      total: o.total,
      city: o.city,
      createdAt: o.createdAt,
    }));

    res.json({ success: true, labourBookings, orders: orderItems });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a project with a name and optional initial attachments
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description = '', attachments = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const cleanAttachments = await sanitizeAttachments(attachments, req.user._id);

    const project = await Project.create({
      user: req.user._id,
      name: name.trim(),
      description: description ? String(description).trim() : '',
      attachments: cleanAttachments,
    });

    const items = await loadAttachments(project.attachments);
    project.status = combineStatus(items.map((i) => i.bucket));
    await project.save();

    res.status(201).json({ success: true, project: { ...project.toObject(), attachments: items } });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all projects created by the logged-in customer
// @route   GET /api/projects/my
// @access  Private
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });

    const result = [];
    for (const project of projects) {
      const items = await loadAttachments(project.attachments);
      const newStatus = combineStatus(items.map((i) => i.bucket));
      if (newStatus !== project.status) {
        project.status = newStatus;
        await project.save();
      }
      result.push({ ...project.toObject(), attachments: items });
    }

    res.json({ success: true, projects: result });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single project owned by the logged-in customer
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const items = await loadAttachments(project.attachments);
    const newStatus = combineStatus(items.map((i) => i.bucket));
    if (newStatus !== project.status) {
      project.status = newStatus;
      await project.save();
    }

    res.json({ success: true, project: { ...project.toObject(), attachments: items } });
  } catch (err) {
    next(err);
  }
};

// @desc    Rename / update a project's description
// @route   PATCH /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Project name is required.' });
      }
      project.name = String(name).trim();
    }
    if (description !== undefined) project.description = String(description).trim();

    await project.save();

    const items = await loadAttachments(project.attachments);
    res.json({ success: true, project: { ...project.toObject(), attachments: items } });
  } catch (err) {
    next(err);
  }
};

// @desc    Attach an ongoing labour booking or order to a project
// @route   PATCH /api/projects/:id/attachments
// @access  Private
const addAttachment = async (req, res, next) => {
  try {
    const { refModel, refId } = req.body;
    if (!refModel || !refId) {
      return res.status(400).json({ success: false, message: 'refModel and refId are required.' });
    }

    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const [clean] = await sanitizeAttachments([{ refModel, refId }], req.user._id);
    if (!clean) {
      return res.status(400).json({ success: false, message: 'That booking or order could not be attached.' });
    }

    const alreadyAttached = project.attachments.some(
      (a) => a.refModel === clean.refModel && a.refId.toString() === clean.refId.toString()
    );
    if (!alreadyAttached) {
      project.attachments.push(clean);
    }

    const items = await loadAttachments(project.attachments);
    project.status = combineStatus(items.map((i) => i.bucket));
    await project.save();

    res.json({ success: true, project: { ...project.toObject(), attachments: items } });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove an attachment from a project
// @route   DELETE /api/projects/:id/attachments/:attachmentId
// @access  Private
const removeAttachment = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    project.attachments = project.attachments.filter(
      (a) => a._id.toString() !== req.params.attachmentId
    );

    const items = await loadAttachments(project.attachments);
    project.status = combineStatus(items.map((i) => i.bucket));
    await project.save();

    res.json({ success: true, project: { ...project.toObject(), attachments: items } });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttachableItems,
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  addAttachment,
  removeAttachment,
  deleteProject,
};
