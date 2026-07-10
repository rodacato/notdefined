// Single source of truth for professional history.
// /cv renders this in full; /about reads a curated subset.
// English on purpose: the CV is an artifact for international applications.

export const cv = {
  name: 'Adrian Castillo',
  title: 'Backend & Platform Engineer',
  lane: 'Domain-Driven Design · AI Infrastructure',
  location: 'Colima, México',
  email: 'rodacato@gmail.com',
  links: [
    { label: 'github.com/rodacato', href: 'https://github.com/rodacato' },
    {
      label: 'linkedin.com/in/rodacato',
      href: 'https://www.linkedin.com/in/rodacato/',
    },
    { label: 'notdefined.dev', href: 'https://notdefined.dev' },
  ],
  summary:
    'Backend-heavy engineer with 17+ years shipping production systems — fintech payments, HIPAA healthcare, crypto exchanges, eCommerce, IoT/telematics, and AI/LLM infrastructure. Core stack Ruby/Rails and Node.js/TypeScript, with Rust in production for real-time device communications. Designs around Domain-Driven Design, hexagonal architecture, and event-driven patterns; builds AI tooling rather than just consuming it. Prefers boring infrastructure that works over clever infrastructure that doesn’t.',

  // Curated skills taxonomy — professional/proven first. LinkedIn's dated
  // endorsements (jQuery, CoffeeScript, ActionScript, etc.) are intentionally
  // left out; they date the profile without adding signal.
  skills: [
    {
      group: 'Backend',
      items: [
        'Ruby',
        'Ruby on Rails',
        'Sinatra',
        'Node.js',
        'Rust',
        'API design (REST & GraphQL)',
        'Event-driven systems',
      ],
    },
    {
      group: 'Architecture',
      items: [
        'Domain-Driven Design',
        'Hexagonal architecture',
        'Clean architecture',
        'Microservices & modular monoliths',
        'dry-rb / dry-system',
      ],
    },
    {
      group: 'Frontend',
      items: ['JavaScript', 'TypeScript', 'React', 'React Native'],
    },
    {
      group: 'Data & messaging',
      items: ['PostgreSQL', 'MySQL', 'Redis', 'RabbitMQ'],
    },
    {
      group: 'Cloud & DevOps',
      items: [
        'AWS (EC2, Lambda, VPC)',
        'Terraform',
        'Docker',
        'Kamal',
        'CI/CD',
      ],
    },
    {
      group: 'Practices',
      items: [
        'TDD / BDD (RSpec)',
        'Agile / XP',
        'Technical leadership & mentoring',
      ],
    },
  ],

  experience: [
    {
      company: 'Encontrack',
      role: 'Senior Software Engineer (Consultant)',
      period: 'Jun 2025 – Present',
      location: 'Remote',
      highlights: [
        'Core software team for a vehicle-tracking platform covering 200,000+ vehicles across México — maintaining the device-communications and message-processing systems.',
        'iotHub — the Rust processing layer that ingests and handles real-time device communications.',
        'DeviceManager (Rails) — equipment inventory and command dispatch; led the team building it.',
        'Encontrol — React Native apps with a Node/Express backend; lead engineer.',
        'DeviceManager and Encontrol both started as prototypes and consolidated into production internal systems and products by proving their value in daily operations.',
      ],
      stack: ['Rust', 'Ruby on Rails', 'Node.js', 'Express', 'React Native'],
    },
    {
      company: 'Monato',
      role: 'Senior Engineer (Consultant)',
      period: 'Mar 2025 – Mar 2026',
      location: 'Remote',
      highlights: [
        'Led the audit, architectural redesign, and optimization of a cloud-based bill-payments platform (Ruby API).',
        'Designed a DDD + hexagonal + event-driven architecture; migrated the API V1 → V2 behind a canary proxy for zero-downtime rollout.',
        'Established a formal technical-proposal process — authored and documented 17 FIPs (Finco Improvement Proposals) — to guide engineering decisions across the team.',
        'Implemented a persisted Event Store for domain events, dependency injection with dry-system, and OAuth 2.0 for the V2 API.',
        'Set up an E2E regression suite and a DevContainer to streamline team onboarding.',
      ],
      stack: [
        'Ruby',
        'dry-rb',
        'dry-system',
        'DDD',
        'Hexagonal',
        'Event-Driven',
        'OAuth 2.0',
      ],
    },
    {
      company: 'Invoy',
      role: 'Senior Full Stack Engineer',
      period: 'Sep 2019 – Mar 2025',
      location: 'Irvine, CA (Remote)',
      highlights: [
        'Core team scaling a HIPAA healthcare platform to 10x traffic — multi-tenancy, real-time availability, strict security on medical data.',
        'Migrated infrastructure from Heroku to AWS — better performance and cost.',
        'Evolved architecture: independent services → microservices → consolidated scalable monolith.',
        'Implemented HIPAA-compliant safeguards for sensitive medical data.',
        'Built and maintained core Sinatra/Ruby APIs and React frontends.',
      ],
      stack: [
        'Ruby',
        'Sinatra',
        'Sequel',
        'dry-rb',
        'React',
        'AWS',
        'Terraform',
        'Docker',
      ],
    },
    {
      company: 'michelada.io',
      role: 'Senior Software Engineer · Team Lead',
      period: 'Feb 2018 – Sep 2019',
      location: 'Colima, México',
      highlights: [
        'Led a team of 5 building a cryptocurrency exchange; RabbitMQ for order-book processing.',
        'Built a reporting microservice over a legacy system with JasperReports.',
        'Worked directly with clients; established reading clubs, blog posts, and internal training.',
      ],
      stack: ['Ruby on Rails', 'Sinatra', 'React', 'RabbitMQ'],
    },
    {
      company: 'Maker',
      role: 'Senior Software Engineer',
      period: '2017 – 2019 (two engagements)',
      location: 'San Francisco Bay Area',
      highlights: [
        'Led a Rails version upgrade for security and maintainability; designed the hiring eval and hired 2 senior Rails engineers.',
        'Built a Rails Engine generating email templates from marketing pages (MJML + Inkscape), tuned for Outlook.',
      ],
      stack: ['Ruby on Rails', 'MJML', 'AWS Lambda'],
    },
    {
      company: 'eFORMance',
      role: 'Senior Software Engineer',
      period: 'Jul 2017 – Mar 2019',
      location: 'Edmonton, Canada (Remote)',
      highlights: [
        'Rewrote an underperforming Rails prototype into a production B2B SaaS; refocused scope to core needs.',
        'Integrated Kendo UI; deployed on DigitalOcean for cost efficiency.',
      ],
      stack: ['Ruby on Rails', 'Node.js', 'Kendo UI', 'DigitalOcean'],
    },
    {
      company: 'Pay By Group',
      role: 'Senior Software Engineer',
      period: 'Apr 2016 – May 2018',
      location: 'San Francisco Bay Area',
      highlights: [
        'Led the transition to an API-first model for group-payment integrations.',
        'Migrated payments to Stripe Connected Accounts — compliance and efficiency.',
        'Introduced Domain-Driven Design for the payment domain; Sinatra APIs; XP practices.',
      ],
      stack: ['Ruby', 'Sinatra', 'Stripe', 'DDD'],
    },
    {
      company: 'Grupo Regalii (now Arcus, a Mastercard company)',
      role: 'Senior Software Engineer',
      period: 'Feb 2016 – May 2016',
      location: 'Remote',
      highlights: [
        'Maintained and improved cross-border payment APIs; private network links with providers in El Salvador & Costa Rica.',
        'AWS VPC setup for secure provider communication.',
      ],
      stack: ['Ruby', 'AWS (VPC)'],
    },
    {
      company: 'MagmaLabs (formerly Crowd Interactive)',
      role: 'Senior Software Engineer',
      period: 'Oct 2015 – Feb 2016',
      location: 'Colima, México',
      highlights: [
        'PayPal integration for eCommerce refunds; return-label automation; Heroku infrastructure.',
      ],
      stack: ['Ruby on Rails', 'PayPal', 'Heroku'],
    },
    {
      company: 'Crowd Interactive',
      role: 'Senior Software Engineer · Team Lead',
      period: 'Mar 2013 – Oct 2015',
      location: 'Colima, México',
      highlights: [
        'Led the team for Igobono, a high-demand social marketplace.',
        'Built a Sinatra & Angular API for Red Bull’s photo-sharing media system.',
        'Balanced Heroku & Engine Yard; direct client engagement on product and feasibility.',
      ],
      stack: ['Ruby', 'Sinatra', 'AngularJS', 'Heroku', 'Engine Yard'],
    },
    {
      company: 'Freshout',
      role: 'Backend & DevOps Engineer',
      period: 'Nov 2010 – Mar 2013',
      location: 'Guadalajara, México',
      highlights: [
        'Built Rails backends for eCommerce, marketing, and social platforms.',
        'Managed Engine Yard / Rackspace infra; CI pipelines with RSpec.',
      ],
      stack: ['Ruby on Rails', 'Engine Yard', 'Rackspace', 'RSpec'],
    },
    {
      company: 'Crowd Interactive',
      role: 'Agile Web Developer',
      period: 'Dec 2008 – Nov 2010',
      location: 'Colima, México',
      highlights: [
        'Transitioned from PHP/Flex to Ruby on Rails; Flex UI for AI-powered assistants and Google Ads monitoring.',
        'PHP support for the Barack Obama Foundation website; built the Modcloth eCommerce platform.',
      ],
      stack: ['PHP', 'Flex', 'Ruby on Rails'],
    },
    {
      company: 'Secretaría de Salud',
      role: 'Web Developer',
      period: 'Dec 2007 – Dec 2008',
      location: 'Colima, México',
      highlights: [
        'First professional role: a digital medical-records system replacing manual workflows.',
        'Built a parallel prototype for a smooth legacy transition (PHP, Flex 3).',
      ],
      stack: ['PHP', 'Flex 3'],
    },
  ],

  education: [
    {
      school: 'Universidad de Colima',
      degree: 'B.E. Telemática',
      period: '2003 – 2007',
    },
  ],

  awards: ['Rails Rumble 2015 — Winner'],

  interests: [
    'Woodworking & DIY',
    'Board games & miniature painting',
    'Boxing',
  ],

  languages: [
    { name: 'Spanish', level: 'Native' },
    { name: 'English', level: 'Professional working' },
  ],
};
