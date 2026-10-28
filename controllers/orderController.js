const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');
const Review = require('../models/Review');

/**
 * Order Controller
 * Enforces the strict 5-stage order progression lifecycle:
 * Pending -> Accepted -> In Progress -> Delivered -> Completed (and Rejected/Cancelled).
 */

const postCreateOrder = async (req, res) => {
  const { serviceId, requirements, deadline } = req.body;

  try {
    const service = await Service.findById(serviceId).populate('freelancer');

    if (!service || !service.isActive) {
      req.flash('error', 'The requested service is not currently available.');
      return res.redirect('/marketplace');
    }

    // A student cannot hire themselves
    if (service.freelancer._id.toString() === req.session.user._id) {
      req.flash('error', 'You cannot hire your own service listing.');
      return res.redirect(`/marketplace/${serviceId}`);
    }

    if (!requirements || requirements.trim().length < 10) {
      req.flash('error', 'Please provide detailed project requirements (at least 10 characters).');
      return res.redirect(`/marketplace/${serviceId}`);
    }

    if (!deadline) {
      req.flash('error', 'Please specify a target completion deadline.');
      return res.redirect(`/marketplace/${serviceId}`);
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(deadlineDate.getTime()) || deadlineDate < today) {
      req.flash('error', 'Project deadline must be a valid future date.');
      return res.redirect(`/marketplace/${serviceId}`);
    }

    const order = await Order.create({
      client: req.session.user._id,
      freelancer: service.freelancer._id,
      service: service._id,
      requirements: requirements.trim(),
      deadline: deadlineDate,
      price: service.price,
      status: 'pending'
    });

    req.flash('success', `Service request submitted successfully! Freelancer ${service.freelancer.name} has been notified.`);
    res.redirect(`/orders/${order._id}`);

  } catch (error) {
    console.error('[postCreateOrder Error]', error);
    req.flash('error', error.message || 'Failed to submit service request.');
    res.redirect(`/marketplace/${serviceId}`);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash('error', 'Invalid order ID.');
      return res.redirect('/');
    }

    const order = await Order.findById(id)
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage isVerified college degree')
      .populate('service');

    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/');
    }

    // Role-based authorization: only client, freelancer, or admin can view this order
    const userId = req.session.user._id;
    const isOrderClient = order.client._id.toString() === userId;
    const isOrderFreelancer = order.freelancer._id.toString() === userId;
    const isAdmin = req.session.user.role === 'admin';

    if (!isOrderClient && !isOrderFreelancer && !isAdmin) {
      req.flash('error', 'Unauthorized access to this order.');
      return res.redirect('/');
    }

    // Check if review exists for this order
    const existingReview = await Review.findOne({ order: order._id });

    res.render('pages/order-detail', {
      title: `Order #${order._id.toString().substring(18)} — SkillBridge`,
      order,
      existingReview,
      isOrderClient,
      isOrderFreelancer,
      isAdmin
    });

  } catch (error) {
    console.error('[getOrderDetail Error]', error);
    req.flash('error', 'Error loading order details.');
    res.redirect('/');
  }
};

const postUpdateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { targetStatus, deliveryNotes, deliveryUrl } = req.body;

  try {
    const order = await Order.findById(id);

    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/');
    }

    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const isOrderClient = order.client.toString() === userId;
    const isOrderFreelancer = order.freelancer.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOrderClient && !isOrderFreelancer && !isAdmin) {
      req.flash('error', 'Unauthorized action.');
      return res.redirect('/');
    }

    // Determine acting role context for transition rules
    let actingRole = userRole;
    if (isAdmin) {
      actingRole = 'admin';
    } else if (isOrderFreelancer) {
      actingRole = 'student';
    } else if (isOrderClient) {
      actingRole = 'client';
    }

    // Enforce backend state transition rules
    const isValid = Order.isValidTransition(order.status, targetStatus, actingRole);

    if (!isValid) {
      req.flash('error', `Invalid status transition from "${order.status}" to "${targetStatus}" by role "${actingRole}".`);
      return res.redirect(`/orders/${order._id}`);
    }

    // Specific validation when submitting delivery
    if (targetStatus === 'delivered') {
      if (!deliveryNotes || deliveryNotes.trim().length < 5) {
        req.flash('error', 'Please provide delivery notes or instructions explaining your completed work (minimum 5 characters).');
        return res.redirect(`/orders/${order._id}`);
      }
      order.deliveryNotes = deliveryNotes.trim();
      order.deliveryUrl = deliveryUrl ? deliveryUrl.trim() : '';
      order.deliveredAt = new Date();
    }

    // Timestamp when completed
    if (targetStatus === 'completed') {
      order.completedAt = new Date();
    }

    order.status = targetStatus;
    await order.save();

    req.flash('success', `Order status updated to "${targetStatus.replace('_', ' ').toUpperCase()}".`);
    res.redirect(`/orders/${order._id}`);

  } catch (error) {
    console.error('[postUpdateOrderStatus Error]', error);
    req.flash('error', 'Failed to update order status.');
    res.redirect(`/orders/${id}`);
  }
};

const getFreelancerDashboard = async (req, res) => {
  try {
    const freelancerId = req.session.user._id;

    // 1. Fetch all student's services
    const services = await Service.find({ freelancer: freelancerId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // 2. Fetch all orders assigned to this student
    const orders = await Order.find({ freelancer: freelancerId })
      .populate('client', 'name email profileImage')
      .populate('service', 'title')
      .sort({ createdAt: -1 });

    // 3. Compute real earnings and status counts
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const pendingRequests = orders.filter(o => o.status === 'pending');
    const inProgressOrders = orders.filter(o => ['accepted', 'in_progress', 'delivered'].includes(o.status));

    // 4. Fetch actual reviews
    const reviews = await Review.find({ freelancer: freelancerId })
      .populate('client', 'name profileImage')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    // 5. User document for verification badge & profile completion
    const user = await User.findById(freelancerId);

    res.render('pages/freelancer-dashboard', {
      title: 'Student Freelancer Dashboard — SkillBridge',
      services,
      orders,
      pendingRequests,
      inProgressOrders,
      completedOrders,
      totalEarnings,
      avgRating,
      reviewCount: reviews.length,
      user
    });

  } catch (error) {
    console.error('[getFreelancerDashboard Error]', error);
    res.status(500).render('pages/error', {
      title: 'Dashboard Error',
      statusCode: 500,
      message: 'Failed to load freelancer dashboard.'
    });
  }
};

const getClientDashboard = async (req, res) => {
  try {
    const clientId = req.session.user._id;

    // Fetch all orders made by this client
    const orders = await Order.find({ client: clientId })
      .populate('freelancer', 'name email profileImage college isVerified')
      .populate('service', 'title price')
      .sort({ createdAt: -1 });

    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.price || 0), 0);

    const activeOrders = orders.filter(o => ['pending', 'accepted', 'in_progress', 'delivered'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'completed');

    res.render('pages/client-dashboard', {
      title: 'Client Project Dashboard — SkillBridge',
      orders,
      activeOrders,
      completedOrders,
      totalSpent
    });

  } catch (error) {
    console.error('[getClientDashboard Error]', error);
    res.status(500).render('pages/error', {
      title: 'Dashboard Error',
      statusCode: 500,
      message: 'Failed to load client dashboard.'
    });
  }
};

module.exports = {
  postCreateOrder,
  getOrderDetail,
  postUpdateOrderStatus,
  getFreelancerDashboard,
  getClientDashboard
};
