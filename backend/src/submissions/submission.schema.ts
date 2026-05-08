import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission & Document;

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  rollNumber: string;

  @Prop({ required: true })
  extractedText: string;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: '' })
  remarks: string;

  @Prop({ default: false })
  passed: boolean;

  @Prop({ default: 'pending', enum: ['pending', 'evaluated', 'error'] })
  status: string;

  @Prop({ default: '' })
  originalFileName: string;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);