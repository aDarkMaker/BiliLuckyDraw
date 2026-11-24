import { AppService } from '../../../bindings/luckydraw/internal/app';
import type { Profile } from '@/types';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

export interface ProfilesPayload {
	profiles: Profile[];
	active_profile: string;
}

const postImage = async (image: string) => {
	await callHTTP('/api/background', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ image }),
	});
};

const postBlob = async (blob: Blob) => {
	await callHTTP('/api/background', {
		method: 'POST',
		headers: { 'Content-Type': blob.type || 'image/jpeg' },
		body: blob,
	});
};

export const profileApi = {
	list: async (): Promise<ProfilesPayload> =>
		parseJSON<ProfilesPayload>(await AppService.GetProfiles(), { profiles: [], active_profile: '' }),
	create: async (name: string) => parseJSON<Profile | null>(await AppService.CreateProfile(name), null),
	remove: (id: string) => AppService.DeleteProfile(id),
	rename: (id: string, name: string) => AppService.RenameProfile(id, name),
	activate: async (id: string) => parseJSON<Profile | null>(await AppService.SwitchProfile(id), null),
	saveConfig: (keyword: string, winnerCount: number) => AppService.SaveProfileConfig(keyword, winnerCount),
	// Prefer HTTP: Wails IPC truncates large payloads with EOF.
	background: async () => {
		try {
			return (await callHTTP<{ image: string }>('/api/background')).image;
		} catch {
			return AppService.GetBackgroundImage();
		}
	},
	setBackground: async (image: string, blob?: Blob) => {
		try {
			if (blob) await postBlob(blob);
			else await postImage(image);
			return;
		} catch {
			// fall through to the IPC bridge
		}
		await fallback(
			() => AppService.SetBackgroundImage(image),
			() => postImage(image)
		);
	},
};
