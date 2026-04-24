export interface UserProfile {
  full_name: string;
  phone: string;
  user_type: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  vehicle_info: string | null;
  available_seats: number;
  departure_date: string;
  departure_time: string;
  price: number;
  service_type: string;
  has_trailer: boolean;
  has_rooftop_carrier: boolean;
  additional_info: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  profiles?: (UserProfile & { user_id: string }) | null;
}

export interface Trip {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  passengers_count: number;
  adults_count: number;
  children_count: number;
  baggage_23kg: number;
  baggage_10kg: number;
  baggage_bags: number;
  departure_date: string;
  departure_time: string;
  service_type: string;
  additional_info: string | null;
  status: 'active' | 'accepted' | 'completed';
  created_at: string;
  profiles?: (UserProfile & { user_id: string }) | null;
}

export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'user_id' | 'profiles'>;
export type TripInsert = Omit<Trip, 'id' | 'created_at' | 'user_id' | 'profiles'>;
