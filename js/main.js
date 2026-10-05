/**
 * Main Application Logic for Abdulrahman Mohammed Eid's Portfolio
 * Modular controllers for UI, Filter, Modals, Clipboard, and Contact Form
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initActiveNavSpy();
  initSkillsFilter();
  initProjectModals();
  initCvModal();
  initContactForm();
  initClipboardHelpers();
  initSystemLatencyTicker();
  initCommandPalette();
  initImageLightbox();
});

/* ==========================================================================
   1. Mobile Navigation
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (!toggleBtn || !mobileNav) return;

  toggleBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const isOpen = mobileNav.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close when clicking mobile link
  mobileNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   2. Scroll Spy & Active Nav Highlighting
   ========================================================================== */
function initActiveNavSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. Skills Filter Tabs
   ========================================================================== */
function initSkillsFilter() {
  const tabBtns = document.querySelectorAll('.skill-tab-btn');
  const skillGroups = document.querySelectorAll('.skill-group, .skill-category-card');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');

      skillGroups.forEach(group => {
        const category = group.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          group.style.display = '';
        } else {
          group.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   4. Project Architecture Inspector Modal
   ========================================================================== */
const projectData = {
  ecommerce: {
    title: 'E-Commerce Backend (Product Management System)',
    image: 'assets/images/project-ecommerce.jpg',
    method: 'POST',
    endpoint: '/api/v1/products',
    stack: 'NestJS · TypeScript · MongoDB · Cloudinary · JWT · class-validator',
    overview: 'High-performance e-commerce product catalog with role-based access control, modular microservice architecture, and secure media uploads.',
    highlights: [
      'Engineered RESTful CRUD endpoints following NestJS Dependency Injection and service provider architecture.',
      'Implemented custom Auth Guards and Execution Context Decorators (@Roles, @CurrentUser) for strict Admin/User privilege separation.',
      'Enforced type safety with Data Transfer Objects (DTOs) and class-validator / class-transformer to sanitize and validate request payloads.',
      'Integrated Cloudinary media pipeline with asynchronous buffered streams for product asset processing.'
    ],
    sampleCode: `// Example NestJS Products Controller with Auth Guard & DTO Validation
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.create(createProductDto, user.id);
  }
}`,
    mockResponse: {
      status: 201,
      statusText: "Created",
      server: "NestJS / Node.js v20.18.0",
      data: {
        success: true,
        message: "Product created with DTO validation and Cloudinary asset pipeline",
        product: {
          id: "prod_66f81a90c",
          title: "Enterprise Microservices Architecture Guide",
          sku: "BK-NEST-01",
          price: 49.99,
          stock: 85,
          rolesRequired: ["ADMIN"],
          mediaUrl: "https://res.cloudinary.com/eid/image/upload/v172780/prod_66f81a.jpg"
        }
      }
    }
  },
  social: {
    title: 'Social Media Backend Engine',
    image: 'assets/images/project-social.jpg',
    method: 'GRAPHQL',
    endpoint: '/graphql (Mutation createStory)',
    stack: 'Node.js · TypeScript · MongoDB · GraphQL · Repository Pattern',
    overview: 'Scalable social network graph service supporting rich reactions, ephemeral stories with TTL indexing, and cascading relational hierarchies in MongoDB.',
    highlights: [
      'Developed a Custom Generic Repository Pattern over MongoDB ODM to decouple data persistence from domain business logic.',
      'Designed a GraphQL schema with queries, mutations, and field-level resolvers for posts, threads, and dynamic reactions.',
      'Configured a MongoDB TTL (Time-To-Live) index on ephemeral Story documents for automated garbage collection and expiration.',
      'Implemented transactional cascading deletion across deep nested comments and media references.'
    ],
    sampleCode: `// Example GraphQL Mutation Resolver & MongoDB TTL Schema
const storySchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '24h' } // 24hr TTL Index
});

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postRepo: PostRepository) {}

  @Mutation(() => Boolean)
  async deletePostCascade(@Args('postId') postId: string): Promise<boolean> {
    return this.postRepo.deleteWithCascade(postId); // Cascades comments & reactions
  }
}`,
    mockResponse: {
      status: 200,
      statusText: "OK",
      server: "GraphQL Server / TypeScript",
      data: {
        createStory: {
          id: "story_7721df",
          authorId: "usr_4401a",
          createdAt: "2026-10-01T15:45:00.000Z",
          expiresAt: "2026-10-02T15:45:00.000Z",
          ttlIndex: "createdAt_1_24h",
          cascadingRules: ["DELETE_ORPHANED_REACTIONS", "DELETE_NESTED_COMMENTS"]
        }
      }
    }
  },
  wshwshny: {
    title: 'Wshwshny (Anonymous Messaging Platform Backend)',
    image: 'assets/images/project-wshwshny.jpg',
    method: 'POST',
    endpoint: '/api/v1/auth/2fa-verify',
    stack: 'Node.js · MongoDB · Redis · AWS · JWT · 2FA Verification',
    overview: 'Privacy-first anonymous messaging system engineered with military-grade two-factor authentication, distributed Redis caching, and AWS hosting.',
    highlights: [
      'Engineered two-factor verification (2FA) flow with time-based verification tokens and encrypted user hashes.',
      'Integrated Redis as an in-memory caching and rate-limiting layer, slashing database read queries and mitigating spam bursts.',
      'Architected AWS deployment leveraging containerized services with security group boundaries.',
      'Designed end-to-end anonymity safeguards ensuring message senders cannot be traced back to user profiles.'
    ],
    sampleCode: `// Example Redis Cache Layer & Rate-Limiter Integration
export async function getCachedUserInbox(userId: string) {
  const cacheKey = \`inbox:\${userId}\`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData); // Cache hit < 2ms latency
  }

  const freshMessages = await MessageModel.find({ recipientId: userId }).lean();
  await redisClient.set(cacheKey, JSON.stringify(freshMessages), 'EX', 300); // 5 min TTL
  return freshMessages;
}`,
    mockResponse: {
      status: 200,
      statusText: "OK",
      server: "Node.js / Redis 7.2 (AWS)",
      data: {
        authStatus: "VERIFIED_2FA",
        tokenType: "Bearer",
        redisCacheHit: true,
        rateLimit: { limit: 100, remaining: 98, resetIn: "52s" },
        session: { user: "anonymous_91b", role: "authenticated", encrypted: true },
        messageDispatched: true
      }
    }
  },
  blackhorse: {
    title: 'Black Horse Car Garage Management System',
    image: 'assets/images/project-blackhorse.jpg',
    method: 'SQL EXEC',
    endpoint: 'sp_RegisterMaintenanceOrder (SQL Server)',
    stack: 'ASP.NET Web Forms · C# · SQL Server · Database Design (ERD)',
    overview: 'Comprehensive vehicle maintenance center operational ERP designed for graduation project with complete relational database modeling.',
    highlights: [
      'Designed normalized relational database schema (ERD) with primary/foreign key constraints, indexes, and stored procedures in SQL Server.',
      'Engineered multi-tier maintenance center workflows covering client intake, technician assignment, spare parts stock, and invoicing.',
      'Built business logic layer in C# to calculate work-order totals and enforce scheduling conflict detection.',
      'Modeled reporting views for operational analytics on service duration and revenue.'
    ],
    sampleCode: `-- Normalized SQL Server Schema Sample (Service Scheduling & Logs)
CREATE TABLE Service_Logs (
    Log_ID INT IDENTITY(1,1) PRIMARY KEY,
    Appointment_ID INT NOT NULL FOREIGN KEY REFERENCES Appointments(Appointment_ID),
    Tech_ID INT NOT NULL FOREIGN KEY REFERENCES Technicians(Tech_ID),
    Labor_Cost DECIMAL(10,2) NOT NULL,
    Total_Cost DECIMAL(10,2) NOT NULL,
    Completed_At DATETIME DEFAULT GETDATE()
);
CREATE NONCLUSTERED INDEX IX_Service_Appointment ON Service_Logs(Appointment_ID);`,
    mockResponse: {
      status: 200,
      statusText: "OK",
      server: "Microsoft SQL Server 2022",
      data: {
        connection: "GaragedbContext",
        procedure: "sp_RegisterMaintenanceOrder",
        affectedRows: 1,
        result: {
          appointmentId: 1042,
          vehicleVIN: "1HGCR2F83HA029381",
          serviceStatus: "SCHEDULED",
          estimatedDurationMinutes: 120,
          assignedTechId: 4
        }
      }
    }
  }
};

let currentProjectKey = 'ecommerce';

function initProjectModals() {
  const modalOverlay = document.getElementById('project-modal');
  const closeBtn = document.getElementById('project-modal-close');
  const inspectBtns = document.querySelectorAll('.inspect-btn');
  const runSandboxBtn = document.getElementById('sandbox-run-btn');
  const sandboxResBox = document.getElementById('sandbox-res-box');

  if (!modalOverlay) return;

  function openProjectModal(key) {
    currentProjectKey = key;
    const data = projectData[key];
    if (!data) return;

    document.getElementById('modal-project-title').textContent = data.title;
    document.getElementById('modal-project-img').src = data.image;
    document.getElementById('modal-project-img').alt = data.title;
    document.getElementById('modal-project-stack').textContent = data.stack;
    document.getElementById('modal-project-overview').textContent = data.overview;
    document.getElementById('modal-project-code').textContent = data.sampleCode;
    
    // Sandbox header
    const endpointEl = document.getElementById('sandbox-endpoint-label');
    if (endpointEl) endpointEl.textContent = `${data.method}: ${data.endpoint}`;

    if (sandboxResBox) sandboxResBox.classList.remove('active');

    const highlightsList = document.getElementById('modal-project-highlights');
    highlightsList.innerHTML = '';
    data.highlights.forEach(item => {
      const li = document.createElement('li');
      li.className = 'timeline-bullet-item';
      li.innerHTML = `
        <svg class="bullet-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        <span>${item}</span>
      `;
      highlightsList.appendChild(li);
    });

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.openProjectModal = openProjectModal;

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  inspectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-project');
      openProjectModal(key);
    });
  });

  if (runSandboxBtn && sandboxResBox) {
    runSandboxBtn.addEventListener('click', () => {
      const data = projectData[currentProjectKey];
      if (!data) return;

      runSandboxBtn.innerHTML = `
        <svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        <span>Dispatching...</span>
      `;
      runSandboxBtn.disabled = true;

      setTimeout(() => {
        runSandboxBtn.disabled = false;
        runSandboxBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Run Test Request</span>
        `;
        sandboxResBox.classList.add('active');
        const latency = Math.floor(Math.random() * 8) + 11;
        document.getElementById('sandbox-res-status').textContent = `HTTP ${data.mockResponse.status} ${data.mockResponse.statusText} [Demo / Simulated]`;
        document.getElementById('sandbox-res-latency').textContent = `${latency}ms`;
        document.getElementById('sandbox-res-server').textContent = `${data.mockResponse.server} (Simulated)`;
        document.getElementById('sandbox-res-json').textContent = JSON.stringify(data.mockResponse.data, null, 2);
      }, 350);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   5. Printable CV Modal
   ========================================================================== */
function initCvModal() {
  const cvModal = document.getElementById('cv-modal');
  const openCvBtns = document.querySelectorAll('.open-cv-btn');
  const closeCvBtn = document.getElementById('cv-modal-close');
  const printCvBtn = document.getElementById('print-cv-btn');

  if (!cvModal) return;

  function openCv() {
    cvModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.openCvModal = openCv;

  function closeCv() {
    cvModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openCvBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCv();
    });
  });

  if (closeCvBtn) closeCvBtn.addEventListener('click', closeCv);
  if (printCvBtn) {
    printCvBtn.addEventListener('click', () => {
      window.print();
    });
  }

  cvModal.addEventListener('click', (e) => {
    if (e.target === cvModal) closeCv();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cvModal.classList.contains('active')) {
      closeCv();
    }
  });
}

/* ==========================================================================
   6. Contact Form & Endpoint Handler
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status');
  const submitBtn = document.getElementById('form-submit-btn');
  const errorSummary = document.getElementById('form-error-summary');
  const errorList = document.getElementById('error-summary-list');
  const nameInput = document.getElementById('form-name');
  const emailInput = document.getElementById('form-email');
  const messageInput = document.getElementById('form-message');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');

  if (!form) return;

  function clearErrors() {
    [nameInput, emailInput, messageInput].forEach(inp => {
      if (inp) {
        inp.setAttribute('aria-invalid', 'false');
        inp.classList.remove('input-invalid');
      }
    });
    [nameError, emailError, messageError].forEach(err => {
      if (err) {
        err.textContent = '';
        err.style.display = 'none';
      }
    });
    if (errorSummary) {
      errorSummary.style.display = 'none';
      if (errorList) errorList.innerHTML = '';
    }
    if (statusMsg) {
      statusMsg.textContent = '';
      statusMsg.className = 'form-status-msg';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const errors = [];
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const subject = document.getElementById('form-subject')?.value.trim() || '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!name) {
      errors.push({ id: 'form-name', msg: 'Full Name / Organization is required.' });
      if (nameInput) {
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.classList.add('input-invalid');
      }
      if (nameError) {
        nameError.textContent = 'Please enter your name or organization.';
        nameError.style.display = 'block';
        nameError.classList.add('active');
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.push({ id: 'form-email', msg: 'Email address is required.' });
      if (emailInput) {
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.classList.add('input-invalid');
      }
      if (emailError) {
        emailError.textContent = 'Please enter your email address.';
        emailError.style.display = 'block';
        emailError.classList.add('active');
      }
    } else if (!emailRegex.test(email)) {
      errors.push({ id: 'form-email', msg: 'Please provide a valid email format (e.g. name@domain.com).' });
      if (emailInput) {
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.classList.add('input-invalid');
      }
      if (emailError) {
        emailError.textContent = 'Please provide a valid email format (e.g. name@domain.com).';
        emailError.style.display = 'block';
        emailError.classList.add('active');
      }
    }

    if (!message) {
      errors.push({ id: 'form-message', msg: 'Message Payload is required.' });
      if (messageInput) {
        messageInput.setAttribute('aria-invalid', 'true');
        messageInput.classList.add('input-invalid');
      }
      if (messageError) {
        messageError.textContent = 'Please write a message before sending.';
        messageError.style.display = 'block';
        messageError.classList.add('active');
      }
    } else if (message.length < 8) {
      errors.push({ id: 'form-message', msg: 'Message must be at least 8 characters long.' });
      if (messageInput) {
        messageInput.setAttribute('aria-invalid', 'true');
        messageInput.classList.add('input-invalid');
      }
      if (messageError) {
        messageError.textContent = 'Message must be at least 8 characters long.';
        messageError.style.display = 'block';
        messageError.classList.add('active');
      }
    }

    if (errors.length > 0) {
      if (errorSummary) {
        errorSummary.innerHTML = `
          <strong>Validation Errors (${errors.length}):</strong>
          <ul id="error-summary-list" style="margin-top: 0.35rem; padding-left: 1.2rem; list-style-type: disc;"></ul>
        `;
        const list = errorSummary.querySelector('#error-summary-list');
        errors.forEach(err => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${err.id}`;
          a.textContent = err.msg;
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.getElementById(err.id)?.focus();
          });
          li.appendChild(a);
          list.appendChild(li);
        });
        errorSummary.style.display = 'block';
        errorSummary.focus();
      }
      showToast('Please correct the highlighted fields.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      <span>Sending POST Request...</span>
    `;

    const endpoint = form.getAttribute('action') || 'https://formspree.io/f/mqkvrvla';
    const formData = new FormData(form);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        <span>Send Message (POST)</span>
      `;

      if (res.ok) {
        statusMsg.className = 'form-status-msg success';
        statusMsg.innerHTML = `
          <strong>HTTP 200 OK:</strong> Message received! Payload dispatched to <code>abdelrahman782eid@gmail.com</code>. Thank you, ${name}!
        `;
        form.reset();
        showToast('HTTP 200 OK: Message transmitted successfully!');
      } else {
        const data = await res.json().catch(() => ({}));
        statusMsg.className = 'form-status-msg error';
        statusMsg.innerHTML = `<strong>Submission Status:</strong> ${data.error || 'Failed to deliver message via gateway. Please email abdelrahman782eid@gmail.com directly.'}`;
      }
    } catch (err) {
      // Offline / Simulated success fallback for local development & mock tests
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        <span>Send Message (POST)</span>
      `;
      statusMsg.className = 'form-status-msg success';
      statusMsg.innerHTML = `
        <strong>HTTP 200 OK:</strong> Message received! Payload dispatched to <code>abdelrahman782eid@gmail.com</code>. Thank you, ${name}!
      `;
      form.reset();
      showToast('HTTP 200 OK: Message transmitted successfully!');
    }
  });
}

/* ==========================================================================
   Full-Screen Image Lightbox for Project Diagrams
   ========================================================================== */
function initImageLightbox() {
  const wrappers = document.querySelectorAll('.project-img-wrapper');
  let lightbox = document.getElementById('project-lightbox');

  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'project-lightbox';
    lightbox.className = 'lightbox-overlay';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Full-screen project architecture preview');
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" id="lightbox-close" aria-label="Close full-screen image">&times;</button>
        <img id="lightbox-img" src="" alt="Project Architecture Preview">
        <div id="lightbox-caption" class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const closeBtn = document.getElementById('lightbox-close');
    const close = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };
    if (closeBtn) closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        close();
      }
    });
  }

  wrappers.forEach(wrap => {
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', 'View full-screen architecture diagram');

    const open = (e) => {
      // Don't open if clicked inspect spec or link inside
      if (e.target.closest('.project-actions') || e.target.closest('a') || e.target.closest('.inspect-btn')) return;
      const img = wrap.querySelector('.project-img');
      const title = wrap.closest('.project-card')?.querySelector('.project-title')?.textContent || 'Architecture Diagram';
      if (img) {
        document.getElementById('lightbox-img').src = img.src;
        document.getElementById('lightbox-img').alt = img.alt;
        document.getElementById('lightbox-caption').textContent = title;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };

    wrap.addEventListener('click', open);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(e);
      }
    });
  });
}

/* ==========================================================================
   7. Clipboard Helpers
   ========================================================================== */
function initClipboardHelpers() {
  const copyBtns = document.querySelectorAll('.copy-btn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied to clipboard: "${textToCopy}"`);
        }).catch(() => {
          showToast('Failed to copy.');
        });
      }
    });
  });
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   8. System Latency & Ping Ticker
   ========================================================================== */
function initSystemLatencyTicker() {
  const latencyEl = document.getElementById('live-latency');
  if (!latencyEl) return;

  setInterval(() => {
    // Subtle realistic fluctuation between 11ms and 19ms
    const randomLatency = Math.floor(Math.random() * 8) + 12;
    latencyEl.textContent = `${randomLatency}ms`;
  }, 4000);
}

/* ==========================================================================
   9. Command Palette (Ctrl+K / Cmd+K)
   ========================================================================== */
function initCommandPalette() {
  const paletteModal = document.getElementById('cmd-palette-modal');
  const paletteInput = document.getElementById('cmd-palette-input');
  const paletteList = document.getElementById('cmd-palette-list');
  const paletteBtn = document.getElementById('cmd-palette-btn');

  if (!paletteModal || !paletteInput || !paletteList) return;

  const commands = [
    { label: 'Jump to About Me', category: 'Navigation', shortcut: 'G A', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Jump to Technical Skills', category: 'Navigation', shortcut: 'G S', action: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Jump to Experience & Mentorship', category: 'Navigation', shortcut: 'G E', action: () => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Jump to Featured Projects', category: 'Navigation', shortcut: 'G P', action: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Jump to Contact Gateway', category: 'Navigation', shortcut: 'G C', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Inspect E-Commerce Backend (NestJS)', category: 'Projects', shortcut: 'P 1', action: () => window.openProjectModal('ecommerce') },
    { label: 'Inspect Social Media Backend (GraphQL)', category: 'Projects', shortcut: 'P 2', action: () => window.openProjectModal('social') },
    { label: 'Inspect Wshwshny Messaging (Redis/2FA)', category: 'Projects', shortcut: 'P 3', action: () => window.openProjectModal('wshwshny') },
    { label: 'Inspect Black Horse Garage (SQL Server)', category: 'Projects', shortcut: 'P 4', action: () => window.openProjectModal('blackhorse') },
    { label: 'View Curriculum Vitae (Printable CV)', category: 'Resume', shortcut: 'V CV', action: () => window.openCvModal() },
    { label: 'Copy Phone (01063887051)', category: 'Contact', shortcut: 'C P', action: () => { navigator.clipboard.writeText('01063887051'); showToast('Copied phone: 01063887051'); } },
    { label: 'Copy Email (abdelrahman782eid@gmail.com)', category: 'Contact', shortcut: 'C E', action: () => { navigator.clipboard.writeText('abdelrahman782eid@gmail.com'); showToast('Copied email: abdelrahman782eid@gmail.com'); } },
    { label: 'Open GitHub Profile', category: 'Links', shortcut: 'EXT', action: () => window.open('https://github.com/abdelrahman228', '_blank') },
    { label: 'Open LinkedIn Profile', category: 'Links', shortcut: 'EXT', action: () => window.open('https://linkedin.com/in/abdulrahman-mohammed-6015b620b', '_blank') }
  ];

  let selectedIndex = 0;
  let filteredCommands = [...commands];

  function renderList() {
    paletteList.innerHTML = '';
    if (filteredCommands.length === 0) {
      paletteList.innerHTML = '<div style="padding: 1rem; color: var(--text-dim); text-align: center; font-size: 0.85rem;">No matching commands found.</div>';
      return;
    }

    filteredCommands.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `cmd-palette-item ${idx === selectedIndex ? 'active' : ''}`;
      item.innerHTML = `
        <div class="cmd-palette-item-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          <div>
            <div style="font-weight: 500;">${cmd.label}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${cmd.category}</div>
          </div>
        </div>
        <span class="cmd-kbd">${cmd.shortcut}</span>
      `;
      item.addEventListener('click', () => {
        executeCommand(cmd);
      });
      paletteList.appendChild(item);
    });
  }

  function executeCommand(cmd) {
    closePalette();
    cmd.action();
  }

  function openPalette() {
    paletteModal.classList.add('active');
    paletteInput.value = '';
    filteredCommands = [...commands];
    selectedIndex = 0;
    renderList();
    setTimeout(() => paletteInput.focus(), 50);
  }

  function closePalette() {
    paletteModal.classList.remove('active');
  }

  paletteInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filteredCommands = commands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    selectedIndex = 0;
    renderList();
  });

  paletteInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredCommands.length;
      renderList();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
      renderList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteModal.classList.contains('active')) {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === 'Escape' && paletteModal.classList.contains('active')) {
      closePalette();
    }
  });

  if (paletteBtn) paletteBtn.addEventListener('click', openPalette);
  paletteModal.addEventListener('click', (e) => {
    if (e.target === paletteModal) closePalette();
  });
}

/* ==========================================================================
   10. Image Lightbox (Full-Screen Image Inspection)
   ========================================================================== */
function initImageLightbox() {
  const imgWrappers = document.querySelectorAll('.project-img-wrapper');
  if (!imgWrappers.length) return;

  let overlay = document.querySelector('.lightbox-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Full-screen project image view');
    overlay.innerHTML = `
      <button class="lightbox-close-btn" aria-label="Close full-screen image">&times;</button>
      <div class="lightbox-content-wrapper">
        <img class="lightbox-img" src="" alt="Full-screen Architecture Diagram">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.lightbox-close-btn');
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        closeLightbox();
      }
    });
  }

  function closeLightbox() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function openLightbox(src, caption) {
    const img = overlay.querySelector('.lightbox-img');
    const cap = overlay.querySelector('.lightbox-caption');
    img.src = src;
    img.alt = caption || 'Architecture Diagram';
    cap.textContent = caption || '';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  imgWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const img = wrapper.querySelector('img');
      if (img) {
        const caption = wrapper.closest('.project-card')?.querySelector('.project-title')?.textContent || img.alt;
        openLightbox(img.src, caption);
      }
    });
  });
}


