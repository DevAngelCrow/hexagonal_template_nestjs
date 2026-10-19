import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Menu } from '@/modules/iam/infrastructure/interfaces/menu.interface';
import { SuccessResponseDto } from '@/shared/infrastructure/http/dtos/http-success-response.dto';
import { MenuHttpDto } from '@/modules/iam/infrastructure/dtos/security/http/menu-http-dto/menu-http.dto';
import { MenuUserResponseDto } from '@/modules/iam/infrastructure/dtos/security/http/menu-http-dto/menu-user-response.dto';
import { Permissions } from '@/modules/iam/infrastructure/decorators/permissions.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { QueryBus } from '@nestjs/cqrs';
import { GetMenuUserQuery } from '@/modules/iam/application/security/queries/menu/get-menu-user/get-menu-user.query';
import { MenuUserResult } from '@/modules/iam/application/security/queries/menu/get-menu-user/get-menu-user.handler';

@Controller('security/menus')
@ApiBearerAuth('JWT-auth')
export class MenuController {
  constructor(private readonly queryBus: QueryBus) {}
  @Permissions('ver-menu-usuario')
  @Get()
  @HttpCode(200)
  async menu(
    @Req() request: Request,
  ): Promise<SuccessResponseDto<MenuUserResponseDto<Menu>>> {
    const user = (request as unknown as { user?: { id?: string } }).user;
    const userId = user?.id ?? '';
    const query = new GetMenuUserQuery(userId);
    const result: MenuUserResult<Menu> = await this.queryBus.execute(query);
    const menuDto = result.menus.map((menu) =>
      MenuHttpDto.fromEntity<Menu>(menu),
    );
    return new SuccessResponseDto<MenuUserResponseDto<Menu>>(
      new MenuUserResponseDto(menuDto, result.profile_img),
      HttpStatus.OK,
      'Menu retrieved successfully',
    );
  }
}
