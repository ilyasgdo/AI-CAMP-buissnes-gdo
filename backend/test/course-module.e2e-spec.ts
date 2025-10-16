import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Course & Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();
    await prisma.$connect();

    // Register a user and authenticate
    const email = `test${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' });
    expect(registerRes.status).toBe(201);
    token = registerRes.body.token;
    expect(typeof token).toBe('string');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/health (GET) should be ok', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('/course/:id (GET) aggregate should match latest course', async () => {
    // Create course for the authenticated user via pipeline
    const profilePayload = {
      job: 'QA Engineer',
      sector: 'Tech',
      ai_level: 'intermediate',
      tools_used: ['ChatGPT'],
      work_style: 'remote',
    };
    const profileRes = await request(app.getHttpServer())
      .post('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(profilePayload);
    expect(profileRes.status).toBe(201);

    const pipeRes = await request(app.getHttpServer())
      .post('/ai/run-pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(pipeRes.status).toBe(201);
    const courseId = pipeRes.body.course_id as string;

    const res = await request(app.getHttpServer())
      .get(`/course/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', courseId);
    expect(typeof res.body.title).toBe('string');
    expect(res.body).toHaveProperty('rawAiTools');
    expect(res.body).toHaveProperty('rawBestPractices');
    expect(res.body).toHaveProperty('modules');
    expect(Array.isArray(res.body.modules)).toBe(true);
    expect(res.body).toHaveProperty('best_practices');
  });

  it('/module/:id (GET) should return details for each module', async () => {
    // Ensure there is a course for the authenticated user
    const pipeRes = await request(app.getHttpServer())
      .post('/ai/run-pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(pipeRes.status).toBe(201);
    const courseId = pipeRes.body.course_id as string;

    const modules = await prisma.module.findMany({ where: { courseId }, orderBy: { orderIndex: 'asc' } });
    expect(modules.length).toBeGreaterThan(0);

    for (const m of modules) {
      const res = await request(app.getHttpServer())
        .get(`/module/${m.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('module_id', m.id);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('lessons');
      expect(Array.isArray(res.body.lessons)).toBe(true);
      expect(res.body).toHaveProperty('quiz');
      expect(Array.isArray(res.body.quiz)).toBe(true);
      expect(res.body).toHaveProperty('chatbot_context');
    }
  });
});