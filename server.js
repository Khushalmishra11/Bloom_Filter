require('dotenv').config();
const express = require('express');
const path = require('path');
const BloomFilter = require('./public/bloom');

const app = express();
app.use(express.json());

// Initialize Bloom Filter
const bloom = new BloomFilter(10000, 0.01); // 10,000 expected items, 1% false positive rate

// API Endpoints

/**
 * @route POST /api/add
 * @desc Add an item to the Bloom filter
 * @access Public
 * @param {string} req.body.item - The item to add
 */
app.post('/api/add', (req, res) => {
  try {
    if (!req.body.item) {
      return res.status(400).json({ error: "Item is required" });
    }

    bloom.add(req.body.item);
    
    res.json({
      success: true,
      message: `Added "${req.body.item}" to the filter`,
      stats: getFilterStats()
    });
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to add item",
      details: err.message 
    });
  }
});

/**
 * @route GET /api/check
 * @desc Check if an item might exist in the filter
 * @access Public
 * @param {string} req.query.item - The item to check
 */
app.get('/api/check', (req, res) => {
  try {
    if (!req.query.item) {
      return res.status(400).json({ error: "Item is required" });
    }

    const exists = bloom.mightContain(req.query.item);
    
    res.json({
      exists,
      falsePositiveRate: bloom.getCurrentFalsePositiveRate(),
      stats: getFilterStats()
    });
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to check item",
      details: err.message 
    });
  }
});

/**
 * @route DELETE /api/clear
 * @desc Reset the Bloom filter
 * @access Public
 */
app.delete('/api/clear', (req, res) => {
  try {
    bloom.clear();
    res.json({ 
      success: true,
      message: "Bloom filter has been cleared",
      stats: getFilterStats()
    });
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to clear filter",
      details: err.message 
    });
  }
});

/**
 * @route GET /api/stats
 * @desc Get current filter statistics
 * @access Public
 */
app.get('/api/stats', (req, res) => {
  try {
    res.json(getFilterStats());
  } catch (err) {
    res.status(500).json({ 
      error: "Failed to get stats",
      details: err.message 
    });
  }
});

// Helper function to get current filter statistics
function getFilterStats() {
  return {
    itemCount: bloom.itemCount,
    falsePositiveRate: bloom.getCurrentFalsePositiveRate(),
    bitArraySize: bloom.m,
    hashFunctions: bloom.k,
    expectedItems: bloom.expectedItems,
    configuration: {
      caseInsensitive: bloom.caseInsensitive
    }
  };
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// All other routes serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bloom Filter initialized with:`);
  console.log(`- Expected items: ${bloom.expectedItems}`);
  console.log(`- False positive rate: ${bloom.falsePositiveRate}`);
  console.log(`- Bit array size: ${bloom.m}`);
  console.log(`- Hash functions: ${bloom.k}`);
});