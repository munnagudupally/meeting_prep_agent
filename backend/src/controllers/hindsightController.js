/**
 * Hindsight Controller
 * Exposes authenticated endpoints to retain, recall, reflect, and check health of Hindsight memory bank.
 */

const hindsightService = require('../services/hindsightService');

/**
 * Check Hindsight health and connectivity
 * GET /api/hindsight/health
 */
async function getHealth(req, res) {
  try {
    const health = await hindsightService.healthCheck();
    return res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      data: {
        status: 'error',
        error: error.message
      }
    });
  }
}

/**
 * Retain memory into Hindsight
 * POST /api/hindsight/retain
 */
async function retain(req, res, next) {
  try {
    const { uid } = req.user;
    const { content, metadata = {}, tags = [] } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'content is required and must be a non-empty string'
      });
    }

    const memoryMetadata = {
      ...metadata,
      userId: uid
    };

    const result = await hindsightService.retainMemory(content, memoryMetadata, tags);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result.data || null,
      error: result.error || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Recall memories from Hindsight
 * POST /api/hindsight/recall
 */
async function recall(req, res, next) {
  try {
    const { query, tags, types, maxTokens, budget } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'query is required and must be a non-empty string'
      });
    }

    const result = await hindsightService.recallMemory(query, {
      tags,
      types,
      maxTokens,
      budget
    });

    return res.status(200).json({
      success: result.success,
      results: result.results || [],
      entities: result.entities || [],
      error: result.error || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reflect over Hindsight memories to generate synthesized strategy
 * POST /api/hindsight/reflect
 */
async function reflect(req, res, next) {
  try {
    const { query, context, budget, maxTokens } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'query is required and must be a non-empty string'
      });
    }

    const result = await hindsightService.reflectMemory(query, {
      context,
      budget,
      maxTokens
    });

    return res.status(200).json({
      success: result.success,
      text: result.text || '',
      facts: result.facts || [],
      error: result.error || null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHealth,
  retain,
  recall,
  reflect
};
