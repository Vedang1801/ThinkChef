import { Router } from 'express';
import * as searchController from '../controllers/search.controller';

const router = Router();

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', searchController.searchSuggestions);

export default router;
