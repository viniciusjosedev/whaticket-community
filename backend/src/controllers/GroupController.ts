import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateContactService from "../services/ContactServices/CreateContactService";

import CreateGroupService from "../services/WbotServices/CreateGroupService";
import RemovePeopleGroupService from "../services/WbotServices/RemovePeopleGroupService";
import GetChatById from "../services/WbotServices/GetChatById";
import GetInfo from "../services/WbotServices/GetInfo";
// import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";

interface ContactData {
  name: string;
  integer: string[];
  isGroup?: boolean;
}

interface RemoveData {
  chatID: string;
  peoples: string[];
}

interface onlyAdminData {
  chatID: string;
  onlyAdminMenssage?: boolean;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    const newGroup: ContactData = req.body;

    const id = await CreateGroupService(newGroup.name, newGroup.integer);

    const { name, isGroup } = newGroup;
    const number = id;

    const contact = await CreateContactService({
      name,
      number,
      isGroup
    });

    const io = getIO();
    io.emit("contact", {
      action: "create",
      contact
    });

    return res.status(200).json(contact);
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const groupRemove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data: RemoveData = req.body;

    const wbot = await GetChatById(data.chatID);

    await RemovePeopleGroupService(data.peoples, wbot);

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const promoveAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data: RemoveData = req.body;

    const wbot = await GetChatById(data.chatID);

    await wbot.promoteParticipants(data.peoples);

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const removeAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data: RemoveData = req.body;

    const wbot = await GetChatById(data.chatID);

    await wbot.demoteParticipants(data.peoples);

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const addParticipants = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data: RemoveData = req.body;

    const wbot = await GetChatById(data.chatID);

    await wbot.addParticipants(data.peoples);

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    return res.status(200).json({ type: "ERROR_NUMBER" });
  }
};

export const onlyAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data: onlyAdminData = req.body;

    const wbot = await GetChatById(data.chatID);

    await wbot.setMessagesAdminsOnly(data.onlyAdminMenssage);

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const getDados = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { number } = req.params;
    // console.log("number", number);

    const wbot = await GetChatById(number);
    // console.log(wbot);

    return res.status(200).json(wbot);
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};

export const getPessoalNumber = async (
  _req: Request,
  res: Response
): Promise<any> => {
  try {
    const wbot = await GetInfo();
    return res.status(200).json(wbot);
  } catch (error) {
    return res.status(200).json({ type: "ERROR" });
  }
};
