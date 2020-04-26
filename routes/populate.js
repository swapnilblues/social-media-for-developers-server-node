const express = require('express');
const router = express.Router();

const populate_controller = require('../controllers/populate');

router.post('/users', populate_controller.user_populate);

module.exports = router;