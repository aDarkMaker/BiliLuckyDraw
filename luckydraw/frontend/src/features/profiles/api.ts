import { AppService } from '../../../bindings/luckydraw/internal/app';
import type { Profile } from '@/types';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

export interface ProfilesPayload {
	profiles: Profile[];
	active_profile: string;
}

export const profileApi = {
	list: async (): Promise<ProfilesPayload> =>
		parseJSON<ProfilesPayload>(await AppService.GetProfiles(), { profiles: [], active_profile: '' }),
	create: async (name: string) => parseJSON<Profile | null>(await AppService.CreateProfile(name), null),
	remove: (id: string) => AppService.DeleteProfile(id),
	rename: (id: string, name: string) => AppService.RenameProfile(id, name),
	activate: async (id: string) => parseJSON<Profile | null>(await AppService.SwitchProfile(id), null),
	saveConfig: (keyword: string, winnerCount: number) => AppService.SaveProfileConfig(keyword, winnerCount),
	background: () =>
		fallback(
			() => AppService.GetBackgroundImage(),
			async () => (await callHTTP<{ image: string }>('/api/background')).image
		),
	setBackground: (image: string) =>
		fallback(
			() => AppService.SetBackgroundImage(image),
			async () => {
				await callHTTP('/api/background', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ image }),
				});
			}
		),
};
