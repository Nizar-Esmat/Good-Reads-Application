const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();



let shelveController = require("../controllers/shelveController");

router.post("/", shelveController.addToShelve);
router.put("/", shelveController.updateShelve);
router.get("/:userId", shelveController.getAllShelvesForUser);
router.get("/2/:userId", shelveController.getAllShelvesForUser2);
router.get("/:userId/:shelve", shelveController.getBooksByShelve);
router.delete("/:bookId/:userId", shelveController.deleteShelve);


module.exports = router;
