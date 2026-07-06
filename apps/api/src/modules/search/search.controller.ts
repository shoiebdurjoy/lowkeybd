import { Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  search(
    @Query('q') query: string,
    @Query('type') type?: 'posts' | 'communities',
    @Query('deep') deep?: string,
  ) {
    return this.searchService.search(query || '', type, deep === 'true');
  }

  @Public()
  @Get('suggestions')
  getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query || '');
  }

  @Public()
  @Post('reindex')
  reindex() {
    return this.searchService.reindexAll();
  }
}
