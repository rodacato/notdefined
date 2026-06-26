export const siteProfile = {
  name: 'Adrian Castillo',
  handle: 'rodacato',
  tagline: 'Resuelvo problemas reales con código real.',
  bio: 'Llevo más de 17 años construyendo software — de startups en San Francisco a proyectos propios desde Colima. Escribo sobre arquitectura, decisiones técnicas y experimentos con IA porque me cuesta entender algo si no lo explico.',
  location: 'Colima, México',
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/rodacato',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/rodacato/',
    },
  ],
  expertise: [
    'Backend & diseño de APIs',
    'DDD (funcional y táctico) + arquitectura hexagonal',
    'Fintech & payments (Stripe Connect)',
    'Healthtech bajo HIPAA',
    'Ruby/Rails y Node/TypeScript',
    'Infra self-hosted (Kamal, Hetzner, Cloudflare, Tailscale)',
  ],
  experience: [
    {
      company: 'Monato',
      role: 'Senior Engineer',
      period: '2025–2026',
      note: 'DDD funcional con Rails + dry-rb, arrancando un equipo nuevo en el paradigma.',
    },
    {
      company: 'Invoy',
      role: 'Senior Engineer',
      period: '5.5 años',
      note: 'Healthtech bajo HIPAA. De microservicios a monolito, stack Sinatra + Sequel + dry-rb.',
    },
    {
      company: 'Pay By Group',
      role: 'Engineer',
      period: 'San Francisco',
      note: 'Fintech con Stripe Connected Accounts. Clean Architecture con chispitas de DDD, cultura XP.',
    },
    {
      company: 'michelada.io',
      role: 'Tech Lead',
      period: 'Consultoría',
      note: 'Lideré un equipo de 5. Exchange de cripto con RabbitMQ y varios backends de eCommerce/payments.',
    },
  ],
};
