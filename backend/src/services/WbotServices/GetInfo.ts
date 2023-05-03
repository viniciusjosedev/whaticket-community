import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

const GetInfo = async (): Promise<any> => {
  const defaultWhatsapp = await GetDefaultWhatsApp();

  const wbot = getWbot(defaultWhatsapp.id);

  try {
    // console.log(wbot.info.wid);
    return wbot.info.wid;
  } catch (err) {
    if (err.message === "invalidNumber") {
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    // throw new AppError("ERR_WAPP_CHECK_CONTACT");
    // console.log(err.message);
  }
};

export default GetInfo;
