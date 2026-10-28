require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

/**
 * SkillBridge Database Seed Script
 * Inserts essential base categories. No demo users, orders, or reviews are created.
 */
const runSeed = async () => {
  console.log('[Seed] Seeding required base categories...');

  // Clear existing categories to ensure clean base data
  await Category.deleteMany({});

  const categoriesData = [
    {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Custom responsive websites, full-stack web applications, bug fixes, and API integrations.',
      icon: 'bi-code-slash',
      isActive: true
    },
    {
      name: 'UI/UX & Graphic Design',
      slug: 'ui-ux-design',
      description: 'Modern Figma prototypes, wireframes, logo branding, and social media creative assets.',
      icon: 'bi-palette',
      isActive: true
    },
    {
      name: 'Mobile App Development',
      slug: 'mobile-app-development',
      description: 'Cross-platform mobile apps using Flutter and React Native for Android and iOS.',
      icon: 'bi-phone',
      isActive: true
    },
    {
      name: 'AI, Data & Python',
      slug: 'ai-data-python',
      description: 'Data analysis, machine learning models, web scraping, and automation scripts.',
      icon: 'bi-cpu',
      isActive: true
    },
    {
      name: 'Content & Technical Writing',
      slug: 'content-technical-writing',
      description: 'Technical documentation, blog posts, project reports, and SEO content.',
      icon: 'bi-pencil-square',
      isActive: true
    },
    {
      name: 'Academic Tutoring & Code Review',
      slug: 'academic-tutoring',
      description: 'One-on-one code debugging, data structures tutoring, and college lab assistance.',
      icon: 'bi-book',
      isActive: true
    }
  ];

  await Category.insertMany(categoriesData);

  console.log(`[Seed] Successfully inserted ${categoriesData.length} base categories.`);
};

// Allow standalone execution: `node scripts/seed.js`
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  connectDB()
    .then(() => runSeed())
    .then(() => disconnectDB())
    .then(() => {
      console.log('[Seed] Standalone seed finished. Exiting.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
