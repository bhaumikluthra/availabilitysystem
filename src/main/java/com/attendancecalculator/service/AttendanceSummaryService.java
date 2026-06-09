package com.attendancecalculator.service;

import com.attendancecalculator.dto.AttendanceSummaryResponse;
import com.attendancecalculator.dto.DailyAttendanceEntry;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttendanceSummaryService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final EmployeeScheduleRepository scheduleRepository;

    public AttendanceSummaryService(EmployeeScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    /**
     * Returns one summary row per employee for the given year-month.
     *
     * @param yearMonth  e.g. YearMonth.of(2025, 6)
     * @param empId      optional — pass null to get all employees
     */
    @Transactional(readOnly = true)
    public List<AttendanceSummaryResponse> getSummary(YearMonth yearMonth, String empId) {

        LocalDate fromDate = yearMonth.atDay(1);
        LocalDate toDate   = yearMonth.atEndOfMonth();

        List<EmployeeSchedule> schedules =
                scheduleRepository.findAllByDateRangeAndEmployee(
                        fromDate, toDate,
                        empId == null || empId.isBlank() ? null : empId
                );

        // Group by employee — LinkedHashMap preserves insertion (empId) order
        Map<String, List<EmployeeSchedule>> byEmployee = new LinkedHashMap<>();
        for (EmployeeSchedule s : schedules) {
            byEmployee
                    .computeIfAbsent(s.getEmployee().getEmpId(), k -> new ArrayList<>())
                    .add(s);
        }

        List<AttendanceSummaryResponse> result = new ArrayList<>();

        for (Map.Entry<String, List<EmployeeSchedule>> entry : byEmployee.entrySet()) {
            List<EmployeeSchedule> empSchedules = entry.getValue();
            Employee emp = empSchedules.get(0).getEmployee();

            int shiftDays = 0, woDays = 0, plDays = 0, lopDays = 0, otherDays = 0;

            for (EmployeeSchedule s : empSchedules) {
                String code = s.getShiftCode() == null ? "" : s.getShiftCode().toUpperCase();
                switch (code) {
                    case "SHIFT" -> shiftDays++;
                    case "WO"    -> woDays++;
                    case "PL"    -> plDays++;
                    case "LOP"   -> lopDays++;
                    default      -> otherDays++;
                }
            }

            result.add(AttendanceSummaryResponse.builder()
                    .empId(emp.getEmpId())
                    .employeeName(emp.getEmployeeName())
                    .email(emp.getEmail())
                    .manager(emp.getManager())
                    .groupName(emp.getGroupName())
                    .coachName(emp.getCoachName())
                    .shiftTime(emp.getShiftTime())
                    .shiftDays(shiftDays)
                    .woDays(woDays)
                    .plDays(plDays)
                    .lopDays(lopDays)
                    .otherDays(otherDays)
                    .totalDays(empSchedules.size())
                    .build());
        }

        // Sort by empId alphabetically for a stable table order
        result.sort(Comparator.comparing(AttendanceSummaryResponse::getEmpId));
        return result;
    }

    /**
     * Returns one entry per scheduled day in the month for a single employee,
     * each carrying the day-of-month and the human-readable cell value:
     * <ul>
     *   <li>"WO" / "PL" / "LOP"  — leave codes</li>
     *   <li>"HH:mm-HH:mm"        — shift range, e.g. "10:00-19:00"</li>
     * </ul>
     *
     * Days with no schedule row are simply absent from the list (the calendar
     * treats missing days as "no data" and renders them grey).
     *
     * @param yearMonth  the month to query
     * @param empId      required — must not be blank
     * @throws IllegalArgumentException if empId is blank
     */
    @Transactional(readOnly = true)
    public List<DailyAttendanceEntry> getDailyBreakdown(YearMonth yearMonth, String empId) {

        if (empId == null || empId.isBlank()) {
            throw new IllegalArgumentException("empId is required for daily breakdown");
        }

        LocalDate fromDate = yearMonth.atDay(1);
        LocalDate toDate   = yearMonth.atEndOfMonth();

        List<EmployeeSchedule> schedules =
                scheduleRepository.findAllByDateRangeAndEmployee(fromDate, toDate, empId);

        List<DailyAttendanceEntry> entries = new ArrayList<>(schedules.size());

        for (EmployeeSchedule s : schedules) {
            int    day   = s.getScheduleDate().getDayOfMonth();
            String value = resolveCellValue(s);
            if (value != null) {
                entries.add(new DailyAttendanceEntry(day, value));
            }
        }

        // Return in day order for predictable JSON
        entries.sort(Comparator.comparingInt(DailyAttendanceEntry::getDay));
        return entries;
    }

    /**
     * Converts a schedule row into the string the calendar cell should display.
     * Returns null for rows that carry no meaningful data (shouldn't happen in
     * practice, but defensive).
     */
    private String resolveCellValue(EmployeeSchedule s) {
        String code = s.getShiftCode() == null ? "" : s.getShiftCode().toUpperCase();
        return switch (code) {
            case "WO", "PL", "LOP" -> code;
            case "SHIFT" -> {
                // Both times must be present for a valid shift entry
                if (s.getShiftStart() != null && s.getShiftEnd() != null) {
                    yield s.getShiftStart().format(TIME_FMT)
                            + "-"
                            + s.getShiftEnd().format(TIME_FMT);
                }
                yield null;
            }
            default -> null;
        };
    }
}