 const express = require("express");
 const auth = require("../middleware/auth");
 const router = express.Router();
 
 let {
    addToShelve,
    updateShelve,
    getAllShelvesForUser,
    getBooksByShelve,
 } = require("../controllers/shelveController");
 

router.post("/", addToShelve);
router.put("/",  updateShelve);
router.get("/:userId", getAllShelvesForUser);
router.get("/:userId/:shelve",  getBooksByShelve); 


 
 module.exports = router;
 