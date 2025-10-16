import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.module?.course?.userId !== userId) throw new ForbiddenException('Access denied');

    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.orderIndex ?? null,
      module: lesson.module
        ? { id: lesson.module.id, title: lesson.module.title }
        : null,
    };
  }
}