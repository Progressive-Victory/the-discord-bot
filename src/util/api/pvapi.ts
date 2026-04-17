import { ApiConnService } from "@/Classes/API/ApiConnService";
import { WarnSearchManager } from "@/Classes/API/ApiConnService/WarnSearchmanager";

const host = process.env.API_HOST_ADDR!;

const apiConnService = new ApiConnService({ host });

apiConnService.auth(process.env.DISCORD_TOKEN!);

const warnSearchManger = new WarnSearchManager(apiConnService);

export { apiConnService, warnSearchManger };
