export interface RoomAnchor {
	uid: number;
	name: string;
	face: string;
}

export interface RoomInfo {
	room_id: number;
	title: string;
	cover: string;
	keyframe: string;
	live_status: number;
	online: number;
	attention: number;
	area_name: string;
	parent_area_name: string;
	tags: string;
	anchor: RoomAnchor;
}

export interface DanmakuLine {
	id: number;
	room_id: number;
	uid: number;
	username: string;
	face?: string;
	message: string;
	kind?: 'danmaku' | 'enter' | 'follow' | string;
	time: number;
}
