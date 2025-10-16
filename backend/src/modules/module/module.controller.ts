import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ModuleService } from './module.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller()
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  @Get('/module/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getDetail(id, req.user.id);
  }
}