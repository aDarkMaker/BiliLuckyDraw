export interface AccountInfo {
	name: string;
	uid: number;
	face: string;
	sign?: string;
	level?: number;
	top_photo?: string;
	follower?: number;
	following?: number;
	archive_count?: number;
	like_count?: number;
	view_count?: number;
}

export interface Profile {
	id: string;
	name: string;
	background_image: string;
	watched_rooms: number[];
	keyword: string;
	winner_count: number;
}
