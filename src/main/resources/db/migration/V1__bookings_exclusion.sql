CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    employee_id WITH =,
    tsrange((schedule_date + slot_start)::timestamp, (schedule_date + slot_end)::timestamp) WITH &&
  );
