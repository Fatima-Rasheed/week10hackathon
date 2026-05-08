import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // POST /api/assignments  (protected)
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAssignmentDto, @Request() req: any) {
    const assignment = await this.assignmentsService.create(dto, req.user.userId);
    return {
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    };
  }

  // GET /api/assignments  (protected — returns only this teacher's assignments)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    const assignments = await this.assignmentsService.findAll(req.user.userId);
    return {
      success: true,
      data: assignments,
    };
  }

  // GET /api/assignments/:id  (public — needed for upload/results pages)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const assignment = await this.assignmentsService.findOne(id);
    return {
      success: true,
      data: assignment,
    };
  }

  // DELETE /api/assignments/:id  (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.assignmentsService.remove(id);
    return {
      success: true,
      message: 'Assignment deleted',
    };
  }
}
