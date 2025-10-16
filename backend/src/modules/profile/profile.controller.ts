import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Post('/profile')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProfileDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }
}