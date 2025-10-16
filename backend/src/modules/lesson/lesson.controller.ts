import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller()
export class LessonController {
  constructor(private readonly service: LessonService) {}

  @Get('/lesson/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getDetail(id, req.user.id);
  }
}