
export interface CustomerData {
  name: string;
  contact: string;
  status: string;
  raw: any;
}

export interface LoyalCustomer extends CustomerData {
  visitCount: number;
}

export interface MatchResult {
  customerName: string;
  contact: string;
  totalVisits: number;
  todayStatus: string;
  todayRoomName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  history: { checkIn: string; checkOut: string; roomName: string }[];
}

export type FileType = 'history' | 'today';

export interface ColumnMapping {
  name: string;
  contact: string;
  status: string;
  roomName?: string;
  checkIn?: string;
  checkOut?: string;
}
