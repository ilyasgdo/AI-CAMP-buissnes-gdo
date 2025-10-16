import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller()
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Get('/course/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getAggregate(id, req.user.id);
  }

  @Get('/courses/by-user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUser(@Param('userId') userId: string, @Req() req: any) {
    if (userId !== req.user.id) {
      throw new ForbiddenException('Access denied');
    }
    return this.service.getByUser(userId);
  }
}