const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/roles');
const router = express.Router();

router.get('/', auth, role(['manager', 'leader']), getUsers);
// Sửa: Cho phép cả manager và leader được tạo user
router.post('/', auth, role(['manager', 'leader']), createUser);
router.put('/:id', auth, role(['manager']), updateUser);
router.delete('/:id', auth, role(['manager']), deleteUser);

module.exports = router;