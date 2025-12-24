import { ApiConnService } from "../../Classes/API/ApiConnService/index.js";

const host = process.env.API_HOST_ADDR!;

const apiConnService = new ApiConnService({ host });

apiConnService.auth(process.env.DISCORD_TOKEN!);

export { apiConnService };
