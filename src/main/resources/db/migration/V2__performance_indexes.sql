CREATE INDEX IF NOT EXISTS idx_booking_date 
ON bookings(schedule_date);
CREATE INDEX IF NOT EXISTS idx_booking_date_times
ON bookings(schedule_date, slot_start, slot_end);
CREATE INDEX IF NOT EXISTS idx_booking_employee_date_optimized
ON bookings(employee_id, schedule_date) WHERE schedule_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_employee_manager
ON employees(manager) WHERE manager IS NOT NULL AND manager != '';

CREATE INDEX IF NOT EXISTS idx_employee_group
ON employees(group_name) WHERE group_name IS NOT NULL AND group_name != '';

CREATE INDEX IF NOT EXISTS idx_employee_coach
ON employees(coach_name) WHERE coach_name IS NOT NULL AND coach_name != '';

CREATE INDEX IF NOT EXISTS idx_employee_status
ON employees(status) WHERE status IS NOT NULL AND status != '';

CREATE INDEX IF NOT EXISTS idx_employee_gender
ON employees(gender) WHERE gender IS NOT NULL AND gender != '';

CREATE INDEX IF NOT EXISTS idx_employee_shift_time
ON employees(shift_time) WHERE shift_time IS NOT NULL AND shift_time != '';

CREATE INDEX IF NOT EXISTS idx_employee_schedule_date
ON employee_schedules(schedule_date);

CREATE INDEX IF NOT EXISTS idx_employee_schedule_date_with_employee
ON employee_schedules(schedule_date, employee_id);
