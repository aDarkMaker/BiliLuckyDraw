export interface Winner {
	uid: number;
	username: string;
	count: number;
}

export interface HistoryRecord {
	id: string;
	keyword: string;
	winner_count: number;
	time: string;
	winners: Winner[];
}
