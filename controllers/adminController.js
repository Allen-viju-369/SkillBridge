const User = require('../models/User');
const Service = require('../models/Service');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * Admin Controller
 * Platform oversight, moderation, user verification, and category management.
 */

const getDashboard = async (req, res) => {
  try {
    const [
      totalStudents,
      totalClients,
      totalServices,
      activeServices,
      totalOrders,
      completedOrders,
      reviews,
      recentUsers,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'client' }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Review.find({}),
      User.find().sort({ createdAt: -1 }).limit(5),
      Order.find().populate('client', 'name').populate('freelancer', 'name').populate('service', 'title').sort({ createdAt: -1 }).limit(5)
    ]);

    // Financial transaction sum
    const completedOrderList = await Order.find({ status: 'completed' }).select('price');
    const totalVolume = completedOrderList.reduce((sum, o) => sum + (o.price || 0), 0);

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

    res.render('pages/admin/dashboard', {
      title: 'Administrator Control Hub — SkillBridge',
      stats: {
        totalStudents,
        totalClients,
        totalServices,
        activeServices,
        totalOrders,
        completedOrders,
        totalVolume,
        totalReviews: reviews.length,
        avgRating
      },
      recentUsers,
      recentOrders
    });

  } catch (error) {
    console.error('[admin.getDashboard Error]', error);
    res.status(500).render('pages/error', {
      title: 'Admin Error',
      statusCode: 500,
      message: 'Failed to load administrator statistics.'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.accountStatus = status;

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.render('pages/admin/users', {
      title: 'User Management — SkillBridge Admin',
      users,
      query: req.query
    });
  } catch (error) {
    console.error('[admin.getUsers Error]', error);
    res.redirect('/admin');
  }
};

const postToggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    if (id === req.session.user._id) {
      req.flash('error', 'You cannot suspend your own administrator account.');
      return res.redirect('/admin/users');
    }

    const user = await User.findById(id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.accountStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    await user.save();

    req.flash('success', `User account status changed to "${user.accountStatus.toUpperCase()}".`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('[postToggleUserStatus Error]', error);
    req.flash('error', 'Failed to update account status.');
    res.redirect('/admin/users');
  }
};

const postToggleUserVerification = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.isVerified = !user.isVerified;
    await user.save();

    const action = user.isVerified ? 'verified with the Skill Passport Badge' : 'unverified';
    req.flash('success', `Student "${user.name}" has been ${action}.`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('[postToggleUserVerification Error]', error);
    req.flash('error', 'Failed to toggle student verification.');
    res.redirect('/admin/users');
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('freelancer', 'name email isVerified')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.render('pages/admin/services', {
      title: 'Service Moderation — SkillBridge Admin',
      services
    });
  } catch (error) {
    console.error('[admin.getServices Error]', error);
    res.redirect('/admin');
  }
};

const postToggleService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);
    if (!service) {
      req.flash('error', 'Service listing not found.');
      return res.redirect('/admin/services');
    }

    service.isActive = !service.isActive;
    await service.save();

    req.flash('success', `Service "${service.title}" visibility toggled to ${service.isActive ? 'Active' : 'Inactive'}.`);
    res.redirect('/admin/services');
  } catch (error) {
    console.error('[postToggleService Error]', error);
    req.flash('error', 'Failed to modify service visibility.');
    res.redirect('/admin/services');
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Count services per category
    const categoryCounts = {};
    for (const cat of categories) {
      categoryCounts[cat._id.toString()] = await Service.countDocuments({ category: cat._id });
    }

    res.render('pages/admin/categories', {
      title: 'Manage Categories — SkillBridge Admin',
      categories,
      categoryCounts
    });
  } catch (error) {
    console.error('[admin.getCategories Error]', error);
    res.redirect('/admin');
  }
};

const postCreateCategory = async (req, res) => {
  const { name, description, icon } = req.body;

  try {
    if (!name || name.trim().length < 2) {
      req.flash('error', 'Category name is required (minimum 2 characters).');
      return res.redirect('/admin/categories');
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Category.findOne({ slug });
    if (existing) {
      req.flash('error', 'A category with this name or slug already exists.');
      return res.redirect('/admin/categories');
    }

    await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : 'bi-briefcase',
      isActive: true
    });

    req.flash('success', `Category "${name}" successfully created.`);
    res.redirect('/admin/categories');

  } catch (error) {
    console.error('[postCreateCategory Error]', error);
    req.flash('error', error.message || 'Failed to create category.');
    res.redirect('/admin/categories');
  }
};

const postToggleCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }

    category.isActive = !category.isActive;
    await category.save();

    req.flash('success', `Category "${category.name}" active status updated to ${category.isActive}.`);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('[postToggleCategory Error]', error);
    req.flash('error', 'Failed to toggle category.');
    res.redirect('/admin/categories');
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('client', 'name email')
      .populate('freelancer', 'name email isVerified')
      .populate('service', 'title price')
      .sort({ createdAt: -1 });

    res.render('pages/admin/orders', {
      title: 'Platform Order Oversight — SkillBridge Admin',
      orders
    });
  } catch (error) {
    console.error('[admin.getOrders Error]', error);
    res.redirect('/admin');
  }
};

module.exports = {
  getDashboard,
  getUsers,
  postToggleUserStatus,
  postToggleUserVerification,
  getServices,
  postToggleService,
  getCategories,
  postCreateCategory,
  postToggleCategory,
  getOrders
};
