import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsModule } from './assignments/assignments.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AiModule } from './ai/ai.module';
import { ExportsModule } from './exports/exports.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/assignment-checker',
    ),

    AuthModule,
    AssignmentsModule,
    SubmissionsModule,
    AiModule,
    ExportsModule,
  ],
})
export class AppModule {}