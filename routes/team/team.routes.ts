import { Router } from "express";
import teamController from "../../controllers/teams/teams.controller";
import { authMiddleware } from "../../middleware/auth.middleware";


const router = Router();

router.post('/', authMiddleware, teamController.createTeam);
router.get('/', authMiddleware, teamController.getTeams);
router.put('/:id', authMiddleware, teamController.updateTeam);
router.put('/delete/:id', authMiddleware, teamController.deleteTeam);

export default router;