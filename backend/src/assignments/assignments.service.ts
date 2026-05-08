import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Assignment, AssignmentDocument } from './assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  // Create a new assignment
  async create(dto: CreateAssignmentDto, userId: string): Promise<AssignmentDocument> {
    const assignment = new this.assignmentModel({
      ...dto,
      createdBy: userId,
    });
    return assignment.save();
  }

  // Get all assignments for a specific teacher
  async findAll(userId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel
      .find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get single assignment by ID
  async findOne(id: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel.findById(id).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  // Delete assignment
  async remove(id: string): Promise<void> {
    const result = await this.assignmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
  }
}