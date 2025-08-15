import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org_seed_1' },
    update: {},
    create: {
      id: 'org_seed_1',
      name: 'Seed Org',
      subdomain: 'seed',
    },
  });

  // Create Clients
  const [c1, c2, c3] = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client_seed_1' },
      update: {},
      create: {
        id: 'client_seed_1',
        organizationId: org.id,
        name: 'Acme Corp',
        email: 'contact@acme.com',
        company: 'Acme',
        valueUsd: 50000,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client_seed_2' },
      update: {},
      create: {
        id: 'client_seed_2',
        organizationId: org.id,
        name: 'TechStart Inc',
        email: 'info@techstart.com',
        company: 'TechStart',
        valueUsd: 25000,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client_seed_3' },
      update: {},
      create: {
        id: 'client_seed_3',
        organizationId: org.id,
        name: 'Global Solutions',
        email: 'hello@globalsolutions.com',
        company: 'Global Solutions',
        valueUsd: 150000,
      },
    }),
  ]);

  // Create Pipeline + Stages
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'pipeline_seed_1' },
    update: {},
    create: {
      id: 'pipeline_seed_1',
      organizationId: org.id,
      name: 'Default Pipeline',
      description: 'Seeded pipeline',
      isDefault: true,
      stages: {
        create: [
          { id: 'stage_seed_lead', name: 'Lead', position: 0, color: '#3B82F6' },
          { id: 'stage_seed_contacted', name: 'Contacted', position: 1, color: '#8B5CF6' },
          { id: 'stage_seed_negotiation', name: 'Negotiation', position: 2, color: '#F59E0B' },
          { id: 'stage_seed_closed', name: 'Closed', position: 3, color: '#10B981' },
        ],
      },
    },
    include: { stages: true },
  });

  // Create Cards
  await prisma.pipelineCard.createMany({
    data: [
      {
        id: 'card_seed_1',
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: 'stage_seed_lead',
        clientId: c1.id,
        title: 'Acme Corp',
        description: 'Software company looking for CRM solution',
        value: 50000,
        priority: 'high',
        position: 0,
      },
      {
        id: 'card_seed_2',
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: 'stage_seed_lead',
        clientId: c2.id,
        title: 'TechStart Inc',
        description: 'Startup seeking marketing automation',
        value: 25000,
        priority: 'medium',
        position: 1,
      },
      {
        id: 'card_seed_3',
        organizationId: org.id,
        pipelineId: pipeline.id,
        stageId: 'stage_seed_contacted',
        clientId: c3.id,
        title: 'Global Solutions',
        description: 'Enterprise client interested in our platform',
        value: 150000,
        priority: 'urgent',
        position: 0,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
