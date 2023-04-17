import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

interface Group {
		server: string;
		user: string;
		_serialized: string;
}

const CreateGroupService = async (
  nameGroup: string,
  peoples: string[]
): Promise<string> => {
  const defaultWhatsapp = await GetDefaultWhatsApp();

  const wbot = getWbot(defaultWhatsapp.id);

  try {
    const retorno = await wbot.createGroup(nameGroup, peoples);
		const filter = Object.entries(retorno.gid).filter(e => e[0] === 'user')[0];
		console.log(filter[1])
		return `${filter[1]}`;
  } catch (err) {
    if (err.message === "invalidNumber") {
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    throw new AppError("ERR_WAPP_CHECK_CONTACT");
    // console.log(err.message);
  }
};

export default CreateGroupService;







