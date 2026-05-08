import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { memoryStorage } from 'multer';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  // POST /api/submissions/upload/:assignmentId
  // Upload multiple PDFs for evaluation
  @Post('upload/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(), // Keep files in memory (buffer)
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  async uploadBatch(
    @Param('assignmentId') assignmentId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No PDF files uploaded');
    }

    const results = await this.submissionsService.processBatch(files, assignmentId);

    return {
      success: true,
      message: `Processed ${results.success.length} submissions`,
      processed: results.success.length,
      failed: results.errors.length,
      errors: results.errors,
      data: results.success,
    };
  }

  // GET /api/submissions/assignment/:assignmentId
  // Get all submissions for an assignment
  @Get('assignment/:assignmentId')
  async findByAssignment(@Param('assignmentId') assignmentId: string) {
    const submissions = await this.submissionsService.findByAssignment(assignmentId);
    return {
      success: true,
      count: submissions.length,
      data: submissions,
    };
  }

  // GET /api/submissions/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const submission = await this.submissionsService.findOne(id);
    return {
      success: true,
      data: submission,
    };
  }

  // DELETE /api/submissions/:id
  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    await this.submissionsService.deleteOne(id);
    return {
      success: true,
      message: 'Submission deleted successfully',
    };
  }

  // DELETE /api/submissions/assignment/:assignmentId
  @Delete('assignment/:assignmentId')
  async deleteByAssignment(@Param('assignmentId') assignmentId: string) {
    await this.submissionsService.deleteByAssignment(assignmentId);
    return {
      success: true,
      message: 'All submissions deleted for this assignment',
    };
  }
}