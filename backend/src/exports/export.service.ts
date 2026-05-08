import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from '../submissions/submission.schema';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportsService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
  ) {}

  async generateExcel(assignmentId: string): Promise<Buffer> {
    // Fetch all submissions for this assignment
    const submissions = await this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .sort({ studentName: 1 })
      .exec();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Assignment Checker';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Marks Sheet', {
      pageSetup: { fitToPage: true, orientation: 'landscape' },
    });

    // --- Header Row Styling ---
    sheet.columns = [
      { header: 'Sr. No.', key: 'sr', width: 8 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Roll Number', key: 'roll', width: 15 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Remarks', key: 'remarks', width: 50 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' }, // Dark navy
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF16213E' } },
      };
    });
    headerRow.height = 30;

    // --- Data Rows ---
    submissions.forEach((sub, index) => {
      const grade = this.calculateGrade(sub.score);
      const row = sheet.addRow({
        sr: index + 1,
        name: sub.studentName,
        roll: sub.rollNumber,
        score: sub.score,
        grade,
        remarks: sub.remarks,
      });

      // Alternate row coloring
      const bgColor = index % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF';
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });

      // Color code the score cell
      const scoreCell = row.getCell('score');
      scoreCell.value = sub.score;
      scoreCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (sub.score >= 80) {
        scoreCell.font = { bold: true, color: { argb: 'FF27AE60' } }; // Green
      } else if (sub.score >= 60) {
        scoreCell.font = { bold: true, color: { argb: 'FFF39C12' } }; // Orange
      } else {
        scoreCell.font = { bold: true, color: { argb: 'FFE74C3C' } }; // Red
      }

      // Style the grade cell
      const gradeCell = row.getCell('grade');
      gradeCell.value = grade;
      gradeCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (sub.score >= 80) {
        gradeCell.font = { bold: true, color: { argb: 'FF27AE60' } };
      } else if (sub.score >= 60) {
        gradeCell.font = { bold: true, color: { argb: 'FFF39C12' } };
      } else {
        gradeCell.font = { bold: true, color: { argb: 'FFE74C3C' } };
      }

      // Style the remarks cell with left alignment for readability
      const remarksCell = row.getCell('remarks');
      remarksCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

      // Dynamically set row height based on remarks length
      // Remarks column width is 50 chars; estimate ~15px per line
      const remarksText = sub.remarks ?? '';
      const charsPerLine = 50;
      const lineCount = remarksText
        .split('\n')
        .reduce((acc, line) => acc + Math.ceil((line.length || 1) / charsPerLine), 0);
      const estimatedLines = Math.max(lineCount, 1);
      row.height = Math.max(40, estimatedLines * 18);
    });

    // --- Summary Row ---
    if (submissions.length > 0) {
      const avgScore =
        submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length;

      sheet.addRow({}); // blank row
      const summaryRow = sheet.addRow({
        sr: '',
        name: `Total Students: ${submissions.length}`,
        roll: '',
        score: `Avg: ${avgScore.toFixed(1)}`,
        grade: '',
        remarks: '',
      });
      summaryRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F4FD' },
        };
        cell.font = { bold: true, italic: true };
      });
    }

    // Freeze the header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Convert to buffer and return
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
}