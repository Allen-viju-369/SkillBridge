const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * Review Controller
 * Handles client ratings and genuine feedback submission for completed orders.
 */

const getCreateReview = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate('freelancer', 'name profileImage college')
      .populate('service', 'title');

    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/dashboard/client');
    }

    // Role check: Only the client who placed the order can review
    if (order.client.toString() !== req.session.user._id) {
      req.flash('error', 'Only the client who commissioned this project can submit a review.');
      return res.redirect(`/orders/${orderId}`);
    }

    // Status check: Order must be completed
    if (order.status !== 'completed') {
      req.flash('error', 'Reviews can only be submitted after an order is marked as completed.');
      return res.redirect(`/orders/${orderId}`);
    }

    // Check if already reviewed
    const existing = await Review.findOne({ order: order._id });
    if (existing) {
      req.flash('info', 'You have already submitted a review for this project.');
      return res.redirect(`/orders/${orderId}`);
    }

    res.render('pages/create-review', {
      title: 'Review Project Delivery — SkillBridge',
      order
    });

  } catch (error) {
    console.error('[getCreateReview Error]', error);
    req.flash('error', 'Error opening review submission form.');
    res.redirect('/dashboard/client');
  }
};

const postCreateReview = async (req, res) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/dashboard/client');
    }

    if (order.client.toString() !== req.session.user._id) {
      req.flash('error', 'Unauthorized.');
      return res.redirect(`/orders/${orderId}`);
    }

    if (order.status !== 'completed') {
      req.flash('error', 'Reviews are only permitted for completed orders.');
      return res.redirect(`/orders/${orderId}`);
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      req.flash('error', 'Please select a star rating between 1 and 5.');
      return res.redirect(`/orders/${orderId}/review`);
    }

    if (!comment || comment.trim().length < 5) {
      req.flash('error', 'Please provide a descriptive feedback comment (at least 5 characters).');
      return res.redirect(`/orders/${orderId}/review`);
    }

    // Guard against duplicate reviews
    const existing = await Review.findOne({ order: order._id });
    if (existing) {
      req.flash('error', 'A review for this order has already been recorded.');
      return res.redirect(`/orders/${orderId}`);
    }

    const review = await Review.create({
      order: order._id,
      client: req.session.user._id,
      freelancer: order.freelancer,
      service: order.service,
      rating: numRating,
      comment: comment.trim()
    });

    order.hasReview = true;
    await order.save();

    req.flash('success', 'Your review and rating have been posted to the student freelancer’s Skill Passport!');
    res.redirect(`/freelancers/${order.freelancer}`);

  } catch (error) {
    console.error('[postCreateReview Error]', error);
    req.flash('error', error.message || 'Failed to submit review.');
    res.redirect(`/orders/${orderId}/review`);
  }
};

module.exports = {
  getCreateReview,
  postCreateReview
};
