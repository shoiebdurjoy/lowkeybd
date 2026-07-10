import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get()
  search(
    @Query('q') query: string,
    @Query('type') type?: 'posts' | 'communities',
    @Query('deep') deep?: string,
  ) {
    return this.searchService.search(query || '', type, deep === 'true');
  }

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get('suggestions')
  getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query || '');
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('reindex')
  reindex() {
    return this.searchService.reindexAll();
  }
}
