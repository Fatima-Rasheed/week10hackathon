import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document;

export const SUBJECT_TYPES = [
  'english',
  'math',
  'coding',
  'urdu',
  'science',
  'other',
] as const;

export type SubjectType = (typeof SUBJECT_TYPES)[number];

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  instructions: string;

  @Prop({
    required: true,
    enum: SUBJECT_TYPES,
    default: 'english',
  })
  subject: SubjectType;

  @Prop({ default: 0 }) // 0 means no word limit enforced
  wordLimit: number;

  @Prop({ required: true, enum: ['strict', 'loose'] })
  markingMode: string;

  @Prop({ default: 100 })
  totalMarks: number;

  @Prop({ default: 50 })
  passingMarks: number;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);