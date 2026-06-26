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
    'Backend-heavy engineer with 17+ years shipping production systems — fintech payments, HIPAA healthcare, crypto exchanges, eCommerce, and AI/LLM infrastructure. Core stack Ruby/Rails and Node.js/TypeScript, with growing Rust and Python. Designs around Domain-Driven Design, hexagonal architecture, and event-driven patterns; builds AI tooling rather than just consuming it. Prefers boring infrastructure that works over clever infrastructure that doesn’t.',

  experience: [
    {
      company: 'Monato',
      role: 'Senior Engineer (Consultant)',
      period: 'Mar 2025 – Mar 2026',
      location: 'Remote',
      highlights: [
        'Functional DDD with Rails + dry-rb, helping a new team adopt the paradigm.',
        'Explicit contracts and railway-oriented flows over implicit, exception-driven code.',
      ],
      stack: ['Ruby', 'Rails', 'dry-rb', 'DDD'],
    },
    {
      company: 'Invoy',
      role: 'Senior Full Stack Engineer',
      period: 'Sep 2019 – Mar 2025',
      location: 'Irvine, CA (Remote)',
      highlights: [
        'Core team driving infrastructure for a HIPAA healthcare/fintech platform.',
        'Scaled the platform to 10x traffic with Sinatra/Ruby, React, and AWS/Terraform.',
        'Migrated infrastructure from Heroku to AWS — better performance and cost.',
        'Evolved architecture: independent services → microservices → consolidated scalable monolith.',
        'Implemented HIPAA-compliant safeguards for sensitive medical data.',
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
        'Led a team of 5 building a cryptocurrency exchange.',
        'RabbitMQ for order-book processing; legacy report microservice with JasperReports.',
        'Established engineering culture: reading clubs, internal training, blog posts.',
      ],
      stack: ['Ruby on Rails', 'Sinatra', 'React', 'RabbitMQ'],
    },
    {
      company: 'eFORMance',
      role: 'Senior Software Engineer',
      period: 'Jul 2017 – Mar 2019',
      location: 'Edmonton, Canada (Remote)',
      highlights: [
        'Rewrote an underperforming Rails prototype into a production B2B SaaS.',
        'Simplified scope to core business needs; deployed on DigitalOcean for cost efficiency.',
      ],
      stack: ['Ruby on Rails', 'Kendo UI', 'DigitalOcean'],
    },
    {
      company: 'Pay By Group',
      role: 'Senior Software Engineer',
      period: 'Apr 2016 – May 2018',
      location: 'San Francisco Bay Area',
      highlights: [
        'Led the transition to an API-first model for business integrations.',
        'Migrated payments to Stripe Connected Accounts — compliance and efficiency.',
        'Introduced Domain-Driven Design for the payment domain boundaries; XP practices.',
      ],
      stack: ['Ruby', 'Sinatra', 'Stripe', 'DDD'],
    },
    {
      company: 'Maker',
      role: 'Senior Software Engineer',
      period: '2017 – 2019 (two engagements)',
      location: 'San Francisco Bay Area',
      highlights: [
        'Led a Rails version upgrade for security and maintainability; designed the hiring eval, hired 2 senior Rails engineers.',
        'Built a Rails Engine generating email templates from marketing pages (MJML, Outlook compatibility).',
      ],
      stack: ['Ruby on Rails', 'MJML'],
    },
    {
      company: 'Grupo Regalii',
      role: 'Senior Software Engineer',
      period: 'Feb 2016 – May 2016',
      location: 'Remote',
      highlights: [
        'Cross-border payment APIs; private network links with providers in El Salvador & Costa Rica.',
        'AWS VPC setup for secure provider communication.',
      ],
      stack: ['Ruby', 'AWS (VPC)'],
    },
    {
      company: 'Crowd Interactive / MagmaLabs',
      role: 'Senior Software Engineer · Team Lead',
      period: 'Dec 2008 – Feb 2016',
      location: 'Colima, México',
      highlights: [
        'Started in PHP/Flex, moved to Ruby on Rails (~2009); later led teams.',
        'Built APIs for high-demand platforms (Red Bull media system, social marketplaces).',
        'eCommerce/payments integrations (PayPal, Modcloth), infra on Heroku & Engine Yard.',
      ],
      stack: ['Ruby', 'Rails', 'Sinatra', 'PHP', 'Flex'],
    },
    {
      company: 'Freshout',
      role: 'Backend & DevOps Engineer',
      period: 'Nov 2010 – Mar 2013',
      location: 'Guadalajara, México',
      highlights: [
        'Rails backends for eCommerce, marketing, and social platforms.',
        'Managed Engine Yard / Rackspace infra; CI pipelines with RSpec.',
      ],
      stack: ['Ruby on Rails', 'Engine Yard', 'Rackspace', 'RSpec'],
    },
    {
      company: 'Secretaría de Salud',
      role: 'Web Developer',
      period: 'Dec 2007 – Dec 2008',
      location: 'Colima, México',
      highlights: [
        'First professional role: digital medical records replacing manual workflows.',
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

  languages: [
    { name: 'Spanish', level: 'Native' },
    { name: 'English', level: 'Professional working' },
  ],
};
