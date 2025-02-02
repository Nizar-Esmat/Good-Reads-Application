const express = require("express");

const router = express.Router();

let {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");


router.get('/' , getAllUsers)
router.get('/:id' , getUserById) 
router.put('/:id' , updateUser)
router.delete('/:id' , deleteUser)

module.exports = router;