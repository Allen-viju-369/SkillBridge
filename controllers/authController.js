const User = require('../models/User');

/**
 * Auth Controller
 * Handles user registration, secure session authentication, and logout.
 */

const getLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Login to SkillBridge',
    returnTo: req.query.returnTo || ''
  });
};

const postLogin = async (req, res) => {
  const { email, password, returnTo } = req.body;

  try {
    if (!email || !password) {
      req.flash('error', 'Please provide both email address and password.');
      return res.redirect(`/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect(`/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    }

    if (user.accountStatus === 'suspended') {
      req.flash('error', 'Your account has been suspended. Please contact platform administration.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect(`/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('[Session Error]', err);
        req.flash('error', 'Failed to establish secure session.');
        return res.redirect('/auth/login');
      }

      req.session.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      };

      req.flash('success', `Welcome back, ${user.name}!`);

      if (returnTo && returnTo.startsWith('/')) {
        return res.redirect(returnTo);
      }

      if (user.role === 'admin') return res.redirect('/admin');
      if (user.role === 'student') return res.redirect('/dashboard/freelancer');
      return res.redirect('/dashboard/client');
    });

  } catch (error) {
    console.error('[postLogin Error]', error);
    req.flash('error', 'An unexpected error occurred during login. Please try again.');
    res.redirect('/auth/login');
  }
};

const getRegister = (req, res) => {
  res.render('pages/register', {
    title: 'Create an Account — SkillBridge',
    selectedRole: req.query.role || 'student'
  });
};

const postRegister = async (req, res) => {
  const { name, email, password, confirmPassword, role, college, degree, skills } = req.body;

  try {
    // 1. Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      req.flash('error', 'All required fields must be filled.');
      return res.redirect('/auth/register');
    }

    if (!['student', 'client'].includes(role)) {
      req.flash('error', 'Invalid role selected. Public registration allows Student or Client only.');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/register');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      req.flash('error', 'An account with this email address already exists. Please log in.');
      return res.redirect('/auth/login');
    }

    // 2. Hash password securely
    const passwordHash = await User.hashPassword(password);

    // 3. Process skills array if student
    let parsedSkills = [];
    if (skills && typeof skills === 'string') {
      parsedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // 4. Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      college: college ? college.trim() : '',
      degree: degree ? degree.trim() : '',
      skills: parsedSkills,
      profileImage: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalizedEmail)}`
    });

    // 5. Establish session
    req.session.regenerate((err) => {
      if (err) {
        req.flash('success', 'Registration successful! Please log in.');
        return res.redirect('/auth/login');
      }

      req.session.user = {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileImage: newUser.profileImage,
        isVerified: newUser.isVerified
      };

      req.flash('success', `Welcome to SkillBridge, ${newUser.name}! Your account has been created.`);

      if (newUser.role === 'student') {
        res.redirect('/dashboard/freelancer');
      } else {
        res.redirect('/dashboard/client');
      }
    });

  } catch (error) {
    console.error('[postRegister Error]', error);
    req.flash('error', error.message || 'Failed to complete registration.');
    res.redirect('/auth/register');
  }
};

const postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Logout Error]', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/?loggedOut=1');
  });
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  postLogout
};
