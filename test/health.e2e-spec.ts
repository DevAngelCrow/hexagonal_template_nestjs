import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';

describe('Health & Metrics (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/metrics (GET) returns Prometheus metrics text', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('auth_login_total');
  });

  it('/health (GET) responds with health check structure', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    // May return 200 or 503 depending on redis/db live connection, but always returns status and details
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
  });
});
