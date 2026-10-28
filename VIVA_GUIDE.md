# SkillBridge — Presentation Outline & Viva Voce Guide
## Web Technology III (IA3) College Evaluation

This guide is designed to help any student confidently explain the architecture, design choices, database models, security, and distinctive innovations of **SkillBridge** during a college presentation or viva voce exam.

---

## ⏱️ Recommended 2-Minute Live Demo Walkthrough

When the examiner asks for a live demonstration, follow this exact sequence:

1. **Step 1: Landing Page & Live Statistics (`http://localhost:3000`)**
   - Point out the Hero section and explain: *"These metrics (verified students, active services, completed orders, and client ratings) are dynamically computed from real MongoDB documents, not hardcoded."*
   - Scroll down to show Popular Categories and Featured Student Services.

2. **Step 2: Marketplace Discovery & Rule-Based Matcher (`/marketplace`)**
   - Demonstrate the sidebar filter: search for `React` or `Figma`, adjust the budget slider, and show dynamic filtering.
   - Click a service (e.g. *Full-Stack Custom Responsive Web Application*).
   - Show the **Rule-Based Skill Match Calculator**: enter `React, Node.js, Python` and click *Calculate Match*. Explain the mathematical set-overlap formula.

3. **Step 3: Student Skill Passport (`/freelancers/:id`)**
   - Click on the student's name (e.g., *Aarav Sharma*).
   - Point out the **Verified Skill Passport Ribbon**, college credentials, verified completed orders count, 5-star rating breakdown, and portfolio links.

4. **Step 4: Role-Based Order Progression Lifecycle**
   - Click **Sign Up** (`/register`) to register as a student freelancer or client, or **Log In** (`/login`) with registered credentials.
   - Go to Client Hub (`/dashboard/client`) or Freelancer Studio (`/dashboard/freelancer`). Show commission workflow.
   - Explain the 5-stage order workflow: `Pending` → `Accepted` → `In Progress` → `Delivered` → `Completed`.
   - Show that reviews can **only** be submitted once an order is approved as `Completed`.

5. **Step 5: Administrator Control Hub (`/admin`)**
   - Log in using the admin account created via `npm run create-admin` (configured securely in `.env`).
   - Show the Admin Hub with platform KPIs, User Directory, Service Moderation, and Category Management.
   - Click **Verify** on a student to show how the **Skill Passport Badge** is granted.

---

## 🎯 18 Core Viva Questions & Model Answers

### Q1: Why did you choose this problem statement?
> **Answer:**  
> University students develop valuable technical skills in web development, design, and programming, but global platforms like Upwork or Fiverr are dominated by large agencies and charge high commission fees. On-campus clients, such as professors, research labs, and student startups, often need small, affordable projects done. SkillBridge creates a dedicated campus freelance marketplace connecting these two groups with transparent portfolios and trusted ratings.

---

### Q2: Why did you choose Node.js, Express, MongoDB, EJS, and Bootstrap 5?
> **Answer:**  
> - **Node.js:** Its asynchronous, event-driven non-blocking I/O model handles concurrent requests efficiently with low memory overhead.  
> - **Express.js:** It is a minimal, fast web framework that lets us build clean middleware pipelines for authentication, rate limiting, and CSRF protection.  
> - **MongoDB with Mongoose:** A NoSQL document database allows flexible schema design, perfect for nested portfolio links, dynamic review arrays, and referencing related documents.  
> - **EJS:** Server-side templating renders clean HTML directly from the server. It avoids the complex state hydration and client-side bundle overhead of React or Angular, making the application easier to explain and debug.  
> - **Bootstrap 5:** Provides responsive grid layouts and accessible UI components, styled with custom CSS variables for a modern aesthetic.

---

### Q3: How do the Frontend, Backend, and Database communicate?
> **Answer:**  
> 1. The client browser sends an HTTP request (GET, POST) to the Express web server.  
> 2. The request passes through security middleware (Helmet, Rate Limiter, CSRF validator, and Session checker).  
> 3. The designated Route calls a Controller method.  
> 4. The Controller uses Mongoose models to execute asynchronous queries against MongoDB.  
> 5. The retrieved data is injected into an EJS template, which renders complete HTML returned to the browser.

---

### Q4: How does user authentication and password hashing work?
> **Answer:**  
> When a user registers, their plain-text password is never saved. We use `bcryptjs` with 10 salt rounds to generate an irreversible cryptographic hash. During login, `bcrypt.compare()` compares the entered password against the stored hash. If valid, Express generates a new session ID stored in a secure cookie on the user's browser, while session data is persisted in MongoDB.

---

### Q5: How do sessions and Role-Based Access Control (RBAC) work?
> **Answer:**  
> When a user logs in, their user ID, name, email, and role (`student`, `client`, or `admin`) are stored in `req.session.user`. Our authorization middleware (`requireRole('admin')`, etc.) checks this role on protected routes. If an unauthorized user tries to access `/admin` or `/dashboard/freelancer`, the server rejects the request with an HTTP 403 Forbidden response. Permissions are enforced on the server, not just by hiding buttons in HTML.

---

### Q6: What is CSRF and how did you protect against it?
> **Answer:**  
> Cross-Site Request Forgery (CSRF) is an attack where an unauthorized website tricks a user's browser into executing an unwanted action on a site where they are logged in. We implemented cryptographic CSRF protection: a unique 32-byte token is generated and stored in the user's session. Every form submission (`POST`, `PUT`, `DELETE`) must send this token in a hidden field (`_csrf`). The server compares the token before processing the request; if it is missing or mismatched, the request is rejected with HTTP 403.

---

### Q7: What makes the "Student Skill Passport" innovative?
> **Answer:**  
> Standard platforms suffer from fake reviews and inflated resumes. The **Student Skill Passport** introduces three verifiable elements:  
> 1. **Verified Completed Projects Count:** Calculated dynamically using `Order.countDocuments({ freelancer: id, status: 'completed' })`.  
> 2. **Authentic Reviews:** Client reviews are restricted strictly to completed orders; duplicate reviews on the same order are blocked by a unique database index.  
> 3. **Rule-Based Skill Matcher:** An algorithm comparing client project requirements against the freelancer's skills:  
>    $$\text{Match Percentage} = \left(\frac{|\text{Declared Skills} \cap \text{Requested Skills}|}{|\text{Requested Skills}|}\right) \times 100$$  
>    This gives clients an honest, transparent compatibility score before hiring.

---

### Q8: How does the Order Lifecycle state machine work?
> **Answer:**  
> An order progresses through a strictly defined state machine:  
> - **Pending:** Client submits a request.  
> - **Accepted / Rejected:** Student decides to take the project or decline.  
> - **In Progress:** Student begins working on the deliverables.  
> - **Delivered:** Student submits delivery notes and proof links (GitHub/Figma/Drive).  
> - **Completed:** Client reviews the deliverables and approves completion.  
> We enforce valid state transitions on the backend using `Order.isValidTransition()` so no user can skip stages or reopen a completed order.

---

### Q9: How are relationships between Users, Services, Orders, and Reviews established in MongoDB?
> **Answer:**  
> While MongoDB is a document database, we maintain referential integrity using Mongoose `Schema.Types.ObjectId` references:  
> - A **Service** references its `freelancer` (User) and `category` (Category).  
> - An **Order** references the `client` (User), `freelancer` (User), and `service` (Service).  
> - A **Review** references the `order` (Order, unique index), `client`, `freelancer`, and `service`.  
> We use Mongoose `.populate()` to join these documents when rendering views.

---

### Q10: How does search and filtering work in the marketplace?
> **Answer:**  
> The marketplace controller constructs a dynamic MongoDB query object based on URL query parameters:  
> - For keywords: regex matching across `title`, `description`, and `skills`.  
> - For categories: filtering by category ID.  
> - For budgets: MongoDB `$gte` and `$lte` range operators on `price`.  
> - For sorting: `.sort({ price: 1 })` or `.sort({ createdAt: -1 })`.  
> Pagination is achieved using `.skip((page - 1) * limit).limit(limit)`.

---

### Q11: How do you prevent a student from hiring themselves?
> **Answer:**  
> In `orderController.js`, before an order is created, the server checks if `service.freelancer._id.toString() === req.session.user._id`. If true, the request is immediately rejected with a flash error: *"You cannot hire your own service listing."*

---

### Q12: How do you prevent duplicate reviews for the same order?
> **Answer:**  
> At the database layer, the `order` field in the Review schema has `unique: true`. At the controller layer, we query `Review.findOne({ order: orderId })`. If a review already exists, the server rejects the request. This guarantees exactly one review per completed order.

---

### Q13: How did you validate user inputs?
> **Answer:**  
> We implemented two layers of validation:  
> 1. **Client-side:** HTML5 validation attributes (`required`, `minlength`, `type="email"`, `min`, `max`) and Bootstrap feedback classes for immediate user feedback.  
> 2. **Server-side:** Controller-level checks verifying non-empty fields, valid email regex, future deadline dates, positive integer prices (₹5 to ₹100,000), valid role enums, and valid MongoDB ObjectIds. Server-side validation guarantees safety even if the browser interface is bypassed.

---

### Q14: What happens if MongoDB is not installed on the examiner's computer?
> **Answer:**  
> We designed `config/db.js` with an intelligent fallback engine. On startup, it performs a 300ms socket probe on port 27017. If native MongoDB is not running, it automatically spins up an embedded in-memory MongoDB instance (`mongodb-memory-server`) and auto-seeds it with realistic university data. This means anyone can run `npm start` with zero external database configuration.

---

### Q15: How did you test the application?
> **Answer:**  
> We wrote an automated integration test suite in `tests/run-tests.js` using `supertest`. It runs 16 automated tests verifying health checks, password hashing, registration, duplicate email rejection, role-based access control, service CRUD, order transitions, review constraints, and the skill matching algorithm. All 16 tests pass with 100% success.

---

### Q16: How do you handle security headers and rate limiting?
> **Answer:**  
> We use `helmet` to set secure HTTP response headers (disabling MIME-sniffing, configuring XSS filters, and establishing Content Security Policy). We use `express-rate-limit` to restrict brute-force attacks on `/auth/login` and `/auth/register` to 30 requests per 15 minutes per IP address.

---

### Q17: What are the current limitations of the project?
> **Answer:**  
> 1. **Payment Processing:** Financial transactions record agreed prices and simulate milestone releases; live payment gateways like Razorpay or Stripe are not yet integrated.  
> 2. **File Storage:** Deliverables and portfolio links currently accept validated external URLs rather than direct AWS S3 multi-part binary file uploads.  
> 3. **Real-Time Notifications:** Status updates refresh on page navigation rather than live WebSockets.

---

### Q18: What future improvements could be added?
> **Answer:**  
> 1. Integrating Razorpay or Stripe for automated escrow payments.  
> 2. Socket.io for live chat between students and clients inside order rooms.  
> 3. PDF resume parsing to automatically extract skills into the Student Skill Passport.  
> 4. An administrative dispute arbitration workflow.

---

## 📋 Summary of Key Architecture Terms for Viva

- **MVC (Model-View-Controller):** Architectural pattern separating database schemas (Models), visual presentation (Views), and business logic (Controllers).
- **ODM (Object Document Mapper):** Mongoose translates MongoDB BSON documents into JavaScript objects with schema validation.
- **Bcrypt:** Adaptive hashing function incorporating a random salt to defeat rainbow-table attacks.
- **Session Cookie:** A signed, HTTP-only cookie (`connect.sid`) identifying the user's active session without storing sensitive passwords in the browser.
- **CSRF Token:** A one-time or session-bound cryptographic secret preventing cross-site state-changing request forgery.
- **State Machine:** A behavioral model where an order can only transition between strictly valid states based on actor permissions.
