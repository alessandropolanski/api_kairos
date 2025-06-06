import { Request, response, Response } from "express";
import { HydratedDocument, InferSchemaType } from "mongoose";
import { TeamModel, teamSchema } from "../../models/Team";
import { UserModel } from "../../models/User";
import { AuthenticatedRequest } from "../../types/auth.types";

type Team = InferSchemaType<typeof teamSchema>;
type TeamDoc = HydratedDocument<Team>;

const createTeam = async (req: AuthenticatedRequest, res: Response) => {
    const { id, name, active, users, managers } = req.body;
  
    try {
      let team: TeamDoc | null = await TeamModel.findOne({ id: id})
  
      if (team) {
        return res.status(403).json({ message: "Team already exists" });
      } else {
        if(users && users.length > 0) {
          const foundUsers = await UserModel.find({ _id: { $in: users } }).countDocuments();
          if (foundUsers !== users.length) {
            return res.status(400).json({ message: 'One or more users not found' });
          }
        }
        if(managers && managers.length > 0) {
          const foundManagers = await UserModel.find({ _id: { $in: managers } }).countDocuments();
          if (foundManagers !== managers.length) {
            return res.status(400).json({ message: 'One or more managers not found' });
          }
        }
        const currentDate = new Date();
  
        const newTeam = {
          id,
          name,
          active,
          users,
          managers,
          createdAt: currentDate,
          updatedAt: currentDate,
          lastModifiedBy: req.user?.pki
        };
  
        const newTeamSaved = await TeamModel.create(newTeam);
        const populatedTeam = await newTeamSaved.populate(['users', 'managers'])
        return res.status(200).json({
          message: "Team created",
          team: populatedTeam
        });
  
      }
    } catch (error) {
      return res.status(500).json({ message: "Error creating team" });
    }
};

const getTeams = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const teamsResponse = await TeamModel.find().populate('users').populate('managers');
        return res.status(200).json({
            message: "Teams fetched",
            teams: teamsResponse
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching teams" });
    }
}

const updateTeam = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, active, users, managers } = req.body;

  try {

    let team: TeamDoc | null = await TeamModel.findOne({id: id});
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }

    if(users && users.length > 0) {
      const foundUsers = await UserModel.find({ _id: { $in: users } }).countDocuments();
      if (foundUsers !== users.length) {
        return res.status(400).json({ message: 'One or more users not found' });
      }
    }
    if(managers && managers.length > 0) {
      const foundManagers = await UserModel.find({ _id: { $in: managers } }).countDocuments();
      if (foundManagers !== managers.length) {
        return res.status(400).json({ message: 'One or more managers not found' });
      }
    }

    let newTeam: Partial<Team> = {
      name: name || team.name,
      active: active !== undefined ? active : team.active,
      users: users || team.users,
      managers: managers || team.managers,
      updatedAt: new Date(),
      lastModifiedBy: req.user?.pki
    }

    const savedUser = await TeamModel.findOneAndUpdate(
      {id: id}, 
      {$set: newTeam}, 
      {new: true}
    ).populate('users').populate('managers');


    return res.status(200).json({
      message: "Team updated",
      team: savedUser
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error updating team" });
  }
}

const deleteTeam = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const team = await TeamModel.findOne({ id: id });
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.active = false;
    await team.save();
    await team.populate(['users', 'managers']);
    return res.status(200).json({
      message: "Team Deactivated",
      team
    });
  } catch (error) {
    return res.status(500).json({ message: "Error deactivating team" });
  }
}

export default {
    createTeam,
    getTeams,
    updateTeam,
    deleteTeam
};