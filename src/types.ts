export type UserRole = 'client' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
}

export type BookingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  client_id: string;
  service_type: string;
  status: BookingStatus;
  location: string;
  created_at: string;
}
