import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from './submission.schema';
import { AiService } from '../ai/ai.service';
import { AssignmentsService } from '../assignments/assignments.service';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private aiService: AiService,
    private assignmentsService: AssignmentsService,
  ) {}

  // Extract student name & roll number from PDF text
  // Convention: First line = Student Name, Second line = Roll Number
  private extractStudentInfo(text: string, fileName: string): { name: string; roll: string } {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    // Try to extract from text (first two meaningful lines)
    const nameLine = lines[0] || '';
    const rollLine = lines[1] || '';

    // Check if lines look like name/roll (basic heuristic)
    const nameMatch = nameLine.match(/(?:name\s*[:=]?\s*)(.+)/i);
    const rollMatch = rollLine.match(/(?:roll\s*(?:no|number)?\s*[:=]?\s*)(.+)/i);

    const name = nameMatch ? nameMatch[1].trim() : (nameLine || fileName.replace('.pdf', ''));
    const roll = rollMatch ? rollMatch[1].trim() : (rollLine || 'N/A');

    return { name, roll };
  }

  // Count words in text
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }

  // Process a single PDF file
  async processPdf(
    file: Express.Multer.File,
    assignmentId: string,
  ): Promise<SubmissionDocument> {
    // 1. Parse PDF to extract text
    const pdfData = await pdfParse(file.buffer);
    const extractedText = pdfData.text;

    // 2. Extract student info from text
    const { name, roll } = this.extractStudentInfo(extractedText, file.originalname);

    // 3. Count words
    const wordCount = this.countWords(extractedText);

    // 4. Get assignment details for AI evaluation
    const assignment = await this.assignmentsService.findOne(assignmentId);

    // 5. Call AI for evaluation
    const evaluation = await this.aiService.evaluateSubmission({
      title: assignment.title,
      instructions: assignment.instructions,
      subject: (assignment as any).subject || 'english',
      wordLimit: assignment.wordLimit ?? 0,
      markingMode: assignment.markingMode,
      totalMarks: assignment.totalMarks,
      passingMarks: assignment.passingMarks,
      studentText: extractedText,
      wordCount,
    });

    // 6. Save submission to MongoDB (upsert to prevent duplicates)
    const submissionData = {
      assignmentId: new Types.ObjectId(assignmentId),
      studentName: name,
      rollNumber: roll,
      extractedText,
      wordCount,
      score: evaluation.score,
      remarks: evaluation.remarks,
      passed: evaluation.score >= assignment.passingMarks,
      status: 'evaluated',
      originalFileName: file.originalname,
    };

    // Match on assignmentId + originalFileName to avoid duplicates on re-upload
    const submission = await this.submissionModel.findOneAndUpdate(
      {
        assignmentId: new Types.ObjectId(assignmentId),
        originalFileName: file.originalname,
      },
      { $set: submissionData },
      { upsert: true, new: true },
    );

    return submission;
  }

  // Process multiple PDFs in batch
  async processBatch(
    files: Express.Multer.File[],
    assignmentId: string,
  ): Promise<{ success: SubmissionDocument[]; errors: any[] }> {
    const success: SubmissionDocument[] = [];
    const errors: any[] = [];

    // Process each PDF sequentially (to avoid API rate limits)
    for (const file of files) {
      try {
        const result = await this.processPdf(file, assignmentId);
        success.push(result);
      } catch (err) {
        errors.push({
          fileName: file.originalname,
          error: err.message,
        });
      }
    }

    return { success, errors };
  }

  // Get all submissions for an assignment
  async findByAssignment(assignmentId: string): Promise<SubmissionDocument[]> {
    return this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .sort({ studentName: 1 })
      .exec();
  }

  // Get single submission
  async findOne(id: string): Promise<SubmissionDocument> {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException(`Submission ${id} not found`);
    }
    return submission;
  }

  // Delete a single submission by id
  async deleteOne(id: string): Promise<void> {
    const result = await this.submissionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Submission ${id} not found`);
    }
  }

  // Delete all submissions for an assignment
  async deleteByAssignment(assignmentId: string): Promise<void> {
    await this.submissionModel
      .deleteMany({ assignmentId: new Types.ObjectId(assignmentId) })
      .exec();
  }
}