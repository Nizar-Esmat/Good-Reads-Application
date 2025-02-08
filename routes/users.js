const express = require("express");
const auth = require("../middleware/auth");


const router = express.Router();

let {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");


router.get('/' , getAllUsers)
router.get('/:id' , getUserById) 
router.put('/:id' , auth , updateUser)
router.delete('/:id' , auth , deleteUser)

module.exports = router;