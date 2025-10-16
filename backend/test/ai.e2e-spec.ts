import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('AI Endpoints (e2e)', () => {
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

    // Register a user and keep token for authenticated calls
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

  it('should run IA pipeline endpoints and persist data', async () => {
    // 1) Create profile
    const profilePayload = {
      job: 'Responsable Marketing',
      sector: 'Retail',
      ai_level: 'beginner',
      tools_used: ['ChatGPT', 'Copilot'],
      work_style: 'hybrid',
    };
    const profileRes = await request(app.getHttpServer())
      .post('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(profilePayload);
    expect(profileRes.status).toBe(201);

    // 2) IA #1 — tools & practices
    const tpRes = await request(app.getHttpServer())
      .post('/ai/tools-practices')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(tpRes.status).toBe(201);
    expect(tpRes.body).toHaveProperty('ai_tools');
    expect(tpRes.body).toHaveProperty('best_practices');
    expect(Array.isArray(tpRes.body.ai_tools)).toBe(true);
    expect(Array.isArray(tpRes.body.best_practices)).toBe(true);

    // 3) IA #2 — generate course
    const courseRes = await request(app.getHttpServer())
      .post('/ai/generate-course')
      .set('Authorization', `Bearer ${token}`)
      .send({ ai_tools: tpRes.body.ai_tools });
    expect(courseRes.status).toBe(201);
    expect(courseRes.body).toHaveProperty('course_id');
    expect(courseRes.body).toHaveProperty('title');
    expect(courseRes.body).toHaveProperty('modules');
    expect(Array.isArray(courseRes.body.modules)).toBe(true);
    const courseId = courseRes.body.course_id as string;

    const courseDb = await prisma.course.findUnique({ where: { id: courseId } });
    expect(courseDb).toBeTruthy();
    expect(courseDb?.title).toBe(courseRes.body.title);

    // 4) IA #3 — generate one module
    const firstModule = courseRes.body.modules[0];
    const modRes = await request(app.getHttpServer())
      .post('/ai/generate-module')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId, module_index_or_id: 0, module: firstModule });
    expect(modRes.status).toBe(201);
    expect(modRes.body).toHaveProperty('module_id');
    expect(modRes.body).toHaveProperty('title');
    expect(modRes.body).toHaveProperty('lessons');
    expect(Array.isArray(modRes.body.lessons)).toBe(true);
    expect(modRes.body).toHaveProperty('quiz');
    expect(Array.isArray(modRes.body.quiz)).toBe(true);
    expect(modRes.body).toHaveProperty('chatbot_context');

    const moduleId = modRes.body.module_id as string;
    const moduleDb = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { lessons: true, quizzes: true },
    });
    expect(moduleDb).toBeTruthy();
    expect(moduleDb?.lessons.length).toBeGreaterThan(0);
    expect(moduleDb?.quizzes.length).toBeGreaterThan(0);

    // 5) IA #4 — summary
    const sumRes = await request(app.getHttpServer())
      .post('/ai/generate-summary')
      .set('Authorization', `Bearer ${token}`)
      .send({ course_id: courseId });
    expect(sumRes.status).toBe(201);
    expect(sumRes.body).toHaveProperty('summary');
    expect(sumRes.body).toHaveProperty('skills_gained');
    expect(sumRes.body).toHaveProperty('certificate_text');

    const updatedCourse = await prisma.course.findUnique({ where: { id: courseId } });
    expect(updatedCourse?.summary).toBeTruthy();
  });

  it('should run orchestrator pipeline and persist course, modules and best practices', async () => {
    const profilePayload = {
      job: 'Chef de Projet',
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
    expect(pipeRes.body).toHaveProperty('course_id');
    const courseId = pipeRes.body.course_id as string;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: true, bestPractices: true },
    });
    expect(course).toBeTruthy();
    expect(course?.modules.length).toBeGreaterThan(0);
    expect(course?.bestPractices?.items).toBeTruthy();
  });
});