import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './export.service';
import { Submission, SubmissionSchema } from '../submissions/submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
    ]),
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}