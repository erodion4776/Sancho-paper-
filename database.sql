-- Create Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  role text check (role in ('client', 'staff', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create extension for UUID
create extension if not exists "uuid-ossp";

-- Create Bookings table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) not null,
  service_type text not null,
  location_address text not null,
  latitude double precision,
  longitude double precision,
  status text default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_staff_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table bookings enable row level security;

-- Policies for bookings
create policy "Clients can view their own bookings." on bookings for select using (auth.uid() = client_id);
create policy "Clients can insert their own bookings." on bookings for insert with check (auth.uid() = client_id);
create policy "Staff can view assigned bookings." on bookings for select using (auth.uid() = assigned_staff_id);
create policy "Staff can update their assigned bookings." on bookings for update using (auth.uid() = assigned_staff_id);
create policy "Admins can view all bookings." on bookings for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update all bookings." on bookings for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can insert all bookings." on bookings for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
