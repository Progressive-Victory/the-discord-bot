import { ApiConnService } from "@/Classes/API/ApiConnService";
import { WarnSearchManager } from "@/Classes/API/ApiConnService/WarnSearchmanager";

const host = process.env.PV_API_URL!;

const apiConnService = new ApiConnService({ host });

apiConnService.auth(process.env.PV_DISCORD_TOKEN!);

const warnSearchManger = new WarnSearchManager(apiConnService);

export { apiConnService, warnSearchManger };
