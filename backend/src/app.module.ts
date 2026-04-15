import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InterviewKitModule } from './interview-kit/interview-kit.module';
import { AiModule } from './ai/ai.module';
import { ExportModule } from './export/export.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // In-memory cache with 5-minute TTL
    // To upgrade to Redis: install cache-manager-ioredis-yet and swap the store
    CacheModule.register({
      isGlobal: true,
      ttl: 300_000, // 5 minutes in ms
      max: 500,     // max cached items
    }),

    // Rate limiting — 60 requests/min globally; generation endpoints use 'generation' throttler (20/hr)
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 60,
      },
      {
        name: 'generation',
        ttl: 3_600_000,
        limit: 20,
      },
    ]),

    PrismaModule,
    AuthModule,
    UsersModule,
    InterviewKitModule,
    AiModule,
    ExportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
