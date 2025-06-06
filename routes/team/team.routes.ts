import { Router } from "express";
import teamController from "../../controllers/teams/teams.controller";
import { sessionMiddleware } from "../../controllers/auth/auxFunctions";

const router = Router();

router.post('/', sessionMiddleware, teamController.createTeam);
router.get('/', teamController.getTeams);
router.put('/:id', sessionMiddleware, teamController.updateTeam);
router.put('/delete/:id', sessionMiddleware, teamController.deleteTeam);

export default router;

