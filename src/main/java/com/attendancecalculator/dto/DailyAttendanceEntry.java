package com.attendancecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * One calendar day's raw attendance value for an employee.
 *
 * {@code day}   — day-of-month (1–31)
 * {@code value} — the human-readable string shown in the calendar cell:
 *                 "WO", "PL", "LOP", or the shift range e.g. "10:00-19:00"
 */
@Getter
@AllArgsConstructor
public class DailyAttendanceEntry {
    private final int    day;
    private final String value;
}