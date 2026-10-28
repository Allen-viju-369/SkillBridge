const User = require('../models/User');

/**
 * Profile Controller
 * Manages user profile details, student education info, skills, and portfolio items.
 */

const getEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/login');
    }

    res.render('pages/edit-profile', {
      title: 'Edit Profile & Skill Passport — SkillBridge',
      user
    });
  } catch (error) {
    console.error('[getEditProfile Error]', error);
    req.flash('error', 'Failed to load profile editor.');
    res.redirect('/');
  }
};

const postUpdateProfile = async (req, res) => {
  const { name, bio, college, degree, yearOfStudy, skills, portfolioTitle, portfolioUrl, portfolioDesc } = req.body;

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/login');
    }

    if (!name || name.trim().length < 2) {
      req.flash('error', 'Name must be at least 2 characters long.');
      return res.redirect('/profile/edit');
    }

    user.name = name.trim();
    user.bio = bio ? bio.trim() : '';
    user.college = college ? college.trim() : '';
    user.degree = degree ? degree.trim() : '';
    user.yearOfStudy = yearOfStudy ? yearOfStudy.trim() : '';

    // Parse skills
    if (skills !== undefined) {
      user.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Process portfolio link additions
    if (portfolioTitle && portfolioUrl) {
      const titles = Array.isArray(portfolioTitle) ? portfolioTitle : [portfolioTitle];
      const urls = Array.isArray(portfolioUrl) ? portfolioUrl : [portfolioUrl];
      const descs = Array.isArray(portfolioDesc) ? portfolioDesc : [portfolioDesc];

      const newItems = [];
      for (let i = 0; i < titles.length; i++) {
        if (titles[i] && urls[i]) {
          newItems.push({
            title: titles[i].trim(),
            url: urls[i].trim(),
            description: descs[i] ? descs[i].trim() : ''
          });
        }
      }
      user.portfolioLinks = newItems;
    }

    await user.save();

    // Update active session metadata
    req.session.user.name = user.name;

    req.flash('success', 'Your profile and Skill Passport details have been updated successfully.');

    if (user.role === 'student') {
      res.redirect(`/freelancers/${user._id}`);
    } else {
      res.redirect('/dashboard/client');
    }

  } catch (error) {
    console.error('[postUpdateProfile Error]', error);
    req.flash('error', error.message || 'Failed to update profile.');
    res.redirect('/profile/edit');
  }
};

module.exports = {
  getEditProfile,
  postUpdateProfile
};
