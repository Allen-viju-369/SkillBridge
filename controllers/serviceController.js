const Service = require('../models/Service');
const Category = require('../models/Category');

/**
 * Service Controller
 * CRUD operations for student freelancer service listings.
 */

const getCreateService = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.render('pages/create-service', {
      title: 'Publish a New Service Listing — SkillBridge',
      categories,
      service: {}
    });
  } catch (error) {
    console.error('[getCreateService Error]', error);
    req.flash('error', 'Unable to load service creation form.');
    res.redirect('/dashboard/freelancer');
  }
};

const postCreateService = async (req, res) => {
  const { title, category, price, deliveryDays, description, skills, thumbnailUrl } = req.body;

  try {
    // 1. Validation
    if (!title || !category || !price || !deliveryDays || !description) {
      req.flash('error', 'Please fill in all required fields.');
      return res.redirect('/services/create');
    }

    const numPrice = Number(price);
    const numDays = Number(deliveryDays);

    if (isNaN(numPrice) || numPrice < 5 || numPrice > 100000) {
      req.flash('error', 'Price must be a valid amount between ₹5 and ₹100,000.');
      return res.redirect('/services/create');
    }

    if (isNaN(numDays) || numDays < 1 || numDays > 60) {
      req.flash('error', 'Delivery days must be between 1 and 60 days.');
      return res.redirect('/services/create');
    }

    if (description.length < 20) {
      req.flash('error', 'Please provide a more detailed description (at least 20 characters).');
      return res.redirect('/services/create');
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      req.flash('error', 'Selected category does not exist.');
      return res.redirect('/services/create');
    }

    // Process skills array
    let skillsList = [];
    if (skills && typeof skills === 'string') {
      skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Default icon/thumbnail based on category if none specified
    const defaultThumbnail = thumbnailUrl && thumbnailUrl.trim() 
      ? thumbnailUrl.trim() 
      : '/images/default-service.svg';

    const newService = await Service.create({
      title: title.trim(),
      freelancer: req.session.user._id,
      category,
      price: numPrice,
      deliveryDays: numDays,
      description: description.trim(),
      skills: skillsList,
      thumbnailUrl: defaultThumbnail,
      isActive: true
    });

    req.flash('success', 'Your service listing has been successfully published!');
    res.redirect(`/marketplace/${newService._id}`);

  } catch (error) {
    console.error('[postCreateService Error]', error);
    req.flash('error', error.message || 'Failed to create service.');
    res.redirect('/services/create');
  }
};

const getEditService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      req.flash('error', 'Service listing not found.');
      return res.redirect('/dashboard/freelancer');
    }

    // Authorization: only the owner or an admin can edit
    if (service.freelancer.toString() !== req.session.user._id && req.session.user.role !== 'admin') {
      req.flash('error', 'Unauthorized: You can only edit your own services.');
      return res.redirect('/dashboard/freelancer');
    }

    const categories = await Category.find({ isActive: true });

    res.render('pages/edit-service', {
      title: `Edit ${service.title} — SkillBridge`,
      service,
      categories
    });

  } catch (error) {
    console.error('[getEditService Error]', error);
    req.flash('error', 'Error loading service for editing.');
    res.redirect('/dashboard/freelancer');
  }
};

const postUpdateService = async (req, res) => {
  const { id } = req.params;
  const { title, category, price, deliveryDays, description, skills, isActive, thumbnailUrl } = req.body;

  try {
    const service = await Service.findById(id);

    if (!service) {
      req.flash('error', 'Service not found.');
      return res.redirect('/dashboard/freelancer');
    }

    if (service.freelancer.toString() !== req.session.user._id && req.session.user.role !== 'admin') {
      req.flash('error', 'Access denied.');
      return res.redirect('/dashboard/freelancer');
    }

    // Validation
    const numPrice = Number(price);
    const numDays = Number(deliveryDays);

    if (isNaN(numPrice) || numPrice < 5 || numPrice > 100000) {
      req.flash('error', 'Price must be between ₹5 and ₹100,000.');
      return res.redirect(`/services/${id}/edit`);
    }

    if (isNaN(numDays) || numDays < 1 || numDays > 60) {
      req.flash('error', 'Delivery days must be between 1 and 60 days.');
      return res.redirect(`/services/${id}/edit`);
    }

    let skillsList = [];
    if (skills && typeof skills === 'string') {
      skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    service.title = title.trim();
    service.category = category;
    service.price = numPrice;
    service.deliveryDays = numDays;
    service.description = description.trim();
    service.skills = skillsList;
    service.isActive = isActive === 'on' || isActive === 'true' || isActive === true;
    if (thumbnailUrl && thumbnailUrl.trim()) {
      service.thumbnailUrl = thumbnailUrl.trim();
    }

    await service.save();

    req.flash('success', 'Service updated successfully.');
    res.redirect(`/marketplace/${service._id}`);

  } catch (error) {
    console.error('[postUpdateService Error]', error);
    req.flash('error', 'Failed to update service.');
    res.redirect(`/services/${id}/edit`);
  }
};

const postDeleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);

    if (!service) {
      req.flash('error', 'Service not found.');
      return res.redirect('/dashboard/freelancer');
    }

    if (service.freelancer.toString() !== req.session.user._id && req.session.user.role !== 'admin') {
      req.flash('error', 'Unauthorized action.');
      return res.redirect('/dashboard/freelancer');
    }

    await Service.findByIdAndDelete(id);

    req.flash('success', 'Service listing permanently removed.');
    res.redirect('/dashboard/freelancer');

  } catch (error) {
    console.error('[postDeleteService Error]', error);
    req.flash('error', 'Could not delete service.');
    res.redirect('/dashboard/freelancer');
  }
};

module.exports = {
  getCreateService,
  postCreateService,
  getEditService,
  postUpdateService,
  postDeleteService
};
