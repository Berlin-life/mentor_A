const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { sendRequest, getRequests, handleRequest } = require('../controllers/requestController');

// @route   POST api/requests
// @desc    Send a connection request
// @access  Private
router.post('/', auth, sendRequest);

// @route   GET api/requests
// @desc    Get all requests for current user
// @access  Private
router.get('/', auth, getRequests);

// @route   PUT api/requests/:id
// @desc    Accept or reject request
// @access  Private
router.put('/:id', auth, handleRequest);

module.exports = router;
