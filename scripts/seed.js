require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Review = require('../models/Review');

const runSeed = async () => {
  console.log('[Seed] Starting database seeding...');

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({})
  ]);

  console.log('[Seed] Cleared existing records.');

  // 1. Create Categories
  const categoriesData = [
    {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Custom responsive websites, full-stack web applications, bug fixes, and API integrations.',
      icon: 'bi-code-slash'
    },
    {
      name: 'UI/UX & Graphic Design',
      slug: 'ui-ux-design',
      description: 'Modern Figma prototypes, wireframes, logo branding, and social media creative assets.',
      icon: 'bi-palette'
    },
    {
      name: 'Mobile App Development',
      slug: 'mobile-app-development',
      description: 'Cross-platform mobile apps using Flutter and React Native for Android and iOS.',
      icon: 'bi-phone'
    },
    {
      name: 'AI, Data & Python',
      slug: 'ai-data-python',
      description: 'Data analysis, machine learning models, web scraping, and automation scripts.',
      icon: 'bi-cpu'
    },
    {
      name: 'Content & Technical Writing',
      slug: 'content-technical-writing',
      description: 'Technical documentation, blog posts, project reports, and SEO content.',
      icon: 'bi-pencil-square'
    },
    {
      name: 'Academic Tutoring & Code Review',
      slug: 'academic-tutoring',
      description: 'One-on-one code debugging, data structures tutoring, and college lab assistance.',
      icon: 'bi-book'
    }
  ];

  const categories = await Category.insertMany(categoriesData);
  const catMap = {};
  categories.forEach(c => { catMap[c.slug] = c._id; });

  // 2. Hash shared passwords
  const adminPass = await User.hashPassword('AdminPassword123!');
  const studentPass = await User.hashPassword('StudentPass123!');
  const clientPass = await User.hashPassword('ClientPass123!');

  // 3. Create Users
  const usersData = [
    // Administrator
    {
      name: 'System Administrator',
      email: 'admin@skillbridge.edu',
      passwordHash: adminPass,
      role: 'admin',
      bio: 'Head administrator overseeing student verification and marketplace integrity.',
      college: 'SkillBridge University System',
      isVerified: true
    },
    // Student 1: Full-Stack Web Dev (Verified)
    {
      name: 'Aarav Sharma',
      email: 'aarav@student.edu',
      passwordHash: studentPass,
      role: 'student',
      college: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science',
      yearOfStudy: '3rd Year',
      bio: 'Passionate full-stack developer specializing in Node.js, Express, React, and MongoDB. Winner of Smart Campus Hackathon 2025. Love building clean, accessible web apps.',
      skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Bootstrap 5', 'REST APIs', 'Git'],
      portfolioLinks: [
        { title: 'Campus Event Portal', url: 'https://github.com/example/campus-portal', description: 'Event booking system for college clubs' },
        { title: 'Personal Tech Blog', url: 'https://example.com/aarav-blog', description: 'Full-stack blog with markdown support' }
      ],
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    // Student 2: UI/UX Designer (Verified)
    {
      name: 'Priya Patel',
      email: 'priya@student.edu',
      passwordHash: studentPass,
      role: 'student',
      college: 'College of Engineering & Technology',
      degree: 'B.Tech in Information Technology',
      yearOfStudy: '2nd Year',
      bio: 'UI/UX enthusiast with 3 years of hands-on Figma and design systems experience. I transform complex ideas into modern, intuitive interfaces with micro-interactions.',
      skills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'HTML/CSS', 'Adobe Illustrator'],
      portfolioLinks: [
        { title: 'Fintech App UI Kit', url: 'https://figma.com/@priyadesigns', description: 'Complete mobile banking UI kit with 60+ components' },
        { title: 'Dribbble Portfolio', url: 'https://dribbble.com/example-priya', description: 'Featured design showcase' }
      ],
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    // Student 3: Python & AI Engineer (Verified)
    {
      name: 'Rohan Verma',
      email: 'rohan@student.edu',
      passwordHash: studentPass,
      role: 'student',
      college: 'Institute of Technical Education',
      degree: 'B.Tech in Artificial Intelligence',
      yearOfStudy: '4th Year',
      bio: 'Data science practitioner. Experienced with machine learning pipelines, predictive modeling, BeautifulSoup web scraping, and automated ETL workflows.',
      skills: ['Python', 'Pandas', 'Scikit-Learn', 'Flask', 'Data Scraping', 'SQL', 'Data Visualization'],
      portfolioLinks: [
        { title: 'Stock Sentiment Analyzer', url: 'https://github.com/example/stock-sentiment', description: 'NLP model scoring financial news headlines' }
      ],
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      isVerified: true
    },
    // Student 4: Technical Writer (Unverified - perfect for viva demonstration)
    {
      name: 'Ananya Iyer',
      email: 'ananya@student.edu',
      passwordHash: studentPass,
      role: 'student',
      college: 'City University College',
      degree: 'B.Tech in Computer Science',
      yearOfStudy: '1st Year',
      bio: 'Technical writer and developer advocate. I write crisp developer documentation, API guides, and academic project papers that communicate complex ideas simply.',
      skills: ['Technical Writing', 'Markdown', 'Documentation', 'SEO', 'Research Papers', 'Editing'],
      portfolioLinks: [
        { title: 'Developer Documentation Hub', url: 'https://dev.to/example-ananya', description: 'Published tutorials on modern web architecture' }
      ],
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isVerified: false
    },
    // Clients
    {
      name: 'Dr. Vikram Malhotra',
      email: 'vikram@client.com',
      passwordHash: clientPass,
      role: 'client',
      bio: 'Faculty Lead, Robotics and Cyber-Physical Systems Lab. Regularly hiring students for research portal development and lab site updates.',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'TechNova Incubator',
      email: 'technova@client.com',
      passwordHash: clientPass,
      role: 'client',
      bio: 'Startup accelerator connecting early-stage student ventures with freelance development talent.',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Neha Gupta',
      email: 'neha@client.com',
      passwordHash: clientPass,
      role: 'client',
      bio: 'President of University Coding Society. Seeking graphic designs, logos, and hackathon landing pages.',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const createdUsers = await User.insertMany(usersData);
  const userMap = {};
  createdUsers.forEach(u => { userMap[u.email] = u; });

  // 4. Create Services
  const servicesData = [
    {
      title: 'Full-Stack Custom Responsive Web Application (Node + Express + MongoDB)',
      freelancer: userMap['aarav@student.edu']._id,
      category: catMap['web-development'],
      description: 'I will build a complete, high-performance responsive web application tailored to your project requirements. Includes secure user authentication, database integration with Mongoose, clean server-rendered EJS or REST API endpoints, and modern mobile-ready UI with Bootstrap 5.',
      price: 3500,
      deliveryDays: 5,
      skills: ['Node.js', 'Express', 'MongoDB', 'JavaScript', 'Bootstrap 5', 'HTML/CSS'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'RESTful API Backend Architecture & Database Design',
      freelancer: userMap['aarav@student.edu']._id,
      category: catMap['web-development'],
      description: 'Need a solid, scalable backend? I will design normalized MongoDB schemas, implement JWT/Session authentication, write protected API routes with rate-limiting, and provide complete Postman API documentation.',
      price: 2200,
      deliveryDays: 3,
      skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Postman'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'High-Fidelity Modern Mobile & Web UI/UX Design in Figma',
      freelancer: userMap['priya@student.edu']._id,
      category: catMap['ui-ux-design'],
      description: 'I will craft stunning, pixel-perfect user interface designs in Figma complete with interactive prototypes, reusable design components, typography systems, and developer handoff guidelines.',
      price: 2800,
      deliveryDays: 4,
      skills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Mobile UI'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'Startup Brand Identity Package: Logo, Color Palette & Social Kit',
      freelancer: userMap['priya@student.edu']._id,
      category: catMap['ui-ux-design'],
      description: 'Get a clean, memorable visual identity for your student startup, club, or college event. Includes 3 unique logo concepts, vector SVG files, color guidelines, and social banner templates.',
      price: 1500,
      deliveryDays: 2,
      skills: ['Logo Design', 'Branding', 'Figma', 'Graphic Design'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'Python Web Scraping, Data Cleaning & Automated ETL Scripting',
      freelancer: userMap['rohan@student.edu']._id,
      category: catMap['ai-data-python'],
      description: 'I will write custom Python automation scripts using BeautifulSoup, Scrapy, and Pandas to collect, clean, and export structured data into CSV, Excel, or JSON formats.',
      price: 1800,
      deliveryDays: 2,
      skills: ['Python', 'Web Scraping', 'Pandas', 'Automation', 'Data Cleaning'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'Machine Learning Model Development & Predictive Analysis',
      freelancer: userMap['rohan@student.edu']._id,
      category: catMap['ai-data-python'],
      description: 'I will build, train, and evaluate machine learning models (classification, regression, clustering) using Scikit-Learn with comprehensive visualization charts and performance metrics.',
      price: 4500,
      deliveryDays: 6,
      skills: ['Python', 'Machine Learning', 'Scikit-Learn', 'Data Visualization', 'Pandas'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      isActive: true
    },
    {
      title: 'Comprehensive Technical Documentation & API Reference Guides',
      freelancer: userMap['ananya@student.edu']._id,
      category: catMap['content-technical-writing'],
      description: 'Clear, readable technical writing for your open-source libraries, academic project reports, or REST API endpoints. Well-structured markdown formatting and architecture diagrams included.',
      price: 1200,
      deliveryDays: 3,
      skills: ['Technical Writing', 'Markdown', 'API Documentation', 'Research'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
      isActive: true
    }
  ];

  const createdServices = await Service.insertMany(servicesData);
  const sMap = {};
  createdServices.forEach(s => { sMap[s.title] = s; });

  // 5. Create Orders (Covering the entire workflow!)
  const order1Date = new Date();
  order1Date.setDate(order1Date.getDate() + 5);

  const order2Date = new Date();
  order2Date.setDate(order2Date.getDate() + 3);

  const order3Date = new Date();
  order3Date.setDate(order3Date.getDate() + 7);

  const order4Date = new Date();
  order4Date.setDate(order4Date.getDate() + 4);

  const ordersData = [
    // Completed Order 1: Dr. Vikram hired Aarav
    {
      client: userMap['vikram@client.com']._id,
      freelancer: userMap['aarav@student.edu']._id,
      service: sMap['Full-Stack Custom Responsive Web Application (Node + Express + MongoDB)']._id,
      requirements: 'Need an online portal for managing research lab equipment reservations and student slot bookings. Must include role permissions.',
      deadline: order1Date,
      price: 3500,
      status: 'completed',
      deliveryNotes: 'All booking features, MongoDB models, and test suites are complete. Deployed on live staging environment and GitHub repository pushed.',
      deliveryUrl: 'https://github.com/example/lab-booking-system',
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      hasReview: true
    },
    // Completed Order 2: Neha Gupta hired Priya
    {
      client: userMap['neha@client.com']._id,
      freelancer: userMap['priya@student.edu']._id,
      service: sMap['High-Fidelity Modern Mobile & Web UI/UX Design in Figma']._id,
      requirements: 'Create UI design for our annual college hackathon web page, including sponsor tiers, countdown timer, and registration modal.',
      deadline: order2Date,
      price: 2800,
      status: 'completed',
      deliveryNotes: 'Figma link with high-fidelity frames, mobile layouts, and complete component library organized in dark mode.',
      deliveryUrl: 'https://figma.com/file/hackathon-2026-showcase',
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
      hasReview: true
    },
    // Delivered Order (Ready for Client to test Mark Completed!): TechNova hired Rohan
    {
      client: userMap['technova@client.com']._id,
      freelancer: userMap['rohan@student.edu']._id,
      service: sMap['Python Web Scraping, Data Cleaning & Automated ETL Scripting']._id,
      requirements: 'Scrape university patent directory and parse research abstracts into a searchable JSON database for our incubator analysis.',
      deadline: order3Date,
      price: 1800,
      status: 'delivered',
      deliveryNotes: 'Scraping script executed across 450 patent pages. JSON output file and cleaning script uploaded to Google Drive folder.',
      deliveryUrl: 'https://drive.google.com/sample-patent-data',
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      hasReview: false
    },
    // In Progress Order: Neha hired Aarav
    {
      client: userMap['neha@client.com']._id,
      freelancer: userMap['aarav@student.edu']._id,
      service: sMap['RESTful API Backend Architecture & Database Design']._id,
      requirements: 'Build a voting API for student council elections with rate limiting to prevent spam votes.',
      deadline: order4Date,
      price: 2200,
      status: 'in_progress',
      hasReview: false
    },
    // Pending Request: Dr. Vikram requested Ananya
    {
      client: userMap['vikram@client.com']._id,
      freelancer: userMap['ananya@student.edu']._id,
      service: sMap['Comprehensive Technical Documentation & API Reference Guides']._id,
      requirements: 'Draft a 10-page technical user guide for the lab’s sensor telemetry platform for first-year research interns.',
      deadline: order1Date,
      price: 1200,
      status: 'pending',
      hasReview: false
    }
  ];

  const createdOrders = await Order.insertMany(ordersData);

  // 6. Create Reviews for Completed Orders
  const reviewsData = [
    {
      order: createdOrders[0]._id,
      client: userMap['vikram@client.com']._id,
      freelancer: userMap['aarav@student.edu']._id,
      service: createdOrders[0].service,
      rating: 5,
      comment: 'Exceptional full-stack delivery! Aarav completed the lab reservation system ahead of time with clean documentation and solid test cases. Highly recommended student talent.'
    },
    {
      order: createdOrders[1]._id,
      client: userMap['neha@client.com']._id,
      freelancer: userMap['priya@student.edu']._id,
      service: createdOrders[1].service,
      rating: 5,
      comment: 'Priya designed an incredible UI for our hackathon. The dark mode theme and responsive Figma components saved our frontend team days of effort.'
    }
  ];

  await Review.insertMany(reviewsData);

  console.log('[Seed] Database seeded successfully with realistic students, clients, admin, services, orders, and reviews!');
};

// Allow standalone execution: `node scripts/seed.js`
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  connectDB()
    .then(() => runSeed())
    .then(() => disconnectDB())
    .then(() => {
      console.log('[Seed] Standalone seed execution finished. Exiting.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
