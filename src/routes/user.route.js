const register= require("../controllers/user.controller.js");
const express= require("express");
const router= express.Router()
router.post("/register",register);
module.exports= router;