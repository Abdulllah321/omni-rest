import express from "express";

const router = express.Router();


// Users routes

import user from "@routes/user";

router.use(user);


export default router;