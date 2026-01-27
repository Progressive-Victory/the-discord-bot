import { Routes } from "@/Classes/API/ApiConnService";
import { SettingsResponse, zSettingsResponse } from "@/contracts/responses";
import { sleep } from "../helpers";
import { myQueryClient } from "./myQueryClient";
import { apiConnService } from "./pvapi";

export async function fetchSetting(settingName: string) {
  const cachedData: SettingsResponse = (await myQueryClient.getQueryData([
    "settings",
    settingName,
  ])) as SettingsResponse;
  if (cachedData) {
    const resolveQuery = async (): Promise<SettingsResponse> => {
      const state = await myQueryClient.getQueryState([
        "settings",
        settingName,
      ]);
      if (state?.status === "success") return state.data as SettingsResponse;
      else {
        await sleep(500);
        return resolveQuery();
      }
    };
    if (
      (await myQueryClient.isFetching({
        queryKey: ["settings", settingName],
      })) > 0
    )
      return await resolveQuery();
    else return cachedData;
  }
  return await myQueryClient.fetchQuery({
    queryKey: ["settings", settingName],
    queryFn: () =>
      apiConnService.get<SettingsResponse>(
        Routes.setting(settingName),
        zSettingsResponse,
      ),
  });
}

export async function refetchSetting(settingName: string) {
  await myQueryClient.refetchQueries({ queryKey: ["settings", settingName] });
}
