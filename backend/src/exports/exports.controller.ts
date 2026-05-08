import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './export.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  // GET /api/exports/excel/:assignmentId
  // Download marks sheet as Excel file
  @Get('excel/:assignmentId')
  async downloadExcel(
    @Param('assignmentId') assignmentId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportsService.generateExcel(assignmentId);
    const fileName = `marks-sheet-${assignmentId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}