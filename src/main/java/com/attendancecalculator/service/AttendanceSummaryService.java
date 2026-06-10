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
import java.util.stream.Collectors;

@Service
public class AttendanceSummaryService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final EmployeeScheduleRepository scheduleRepository;

    public AttendanceSummaryService(EmployeeScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceSummaryResponse> getSummary(YearMonth yearMonth, String empId) {
        String filterEmpId = (empId == null || empId.isBlank()) ? null : empId;

        List<EmployeeSchedule> schedules = scheduleRepository.findAllByDateRangeAndEmployee(
                yearMonth.atDay(1), yearMonth.atEndOfMonth(), filterEmpId);

        return schedules.stream()
                .collect(Collectors.groupingBy(s -> s.getEmployee().getEmpId()))
                .values().stream()
                .map(this::buildSummaryForEmployee)
                .sorted(Comparator.comparing(AttendanceSummaryResponse::getEmpId))
                .toList();
    }

    private AttendanceSummaryResponse buildSummaryForEmployee(List<EmployeeSchedule> schedules) {
        Employee emp = schedules.get(0).getEmployee();
        int shiftDays = 0, woDays = 0, plDays = 0, lopDays = 0, otherDays = 0;

        for (EmployeeSchedule s : schedules) {
            String code = s.getShiftCode() == null ? "" : s.getShiftCode().toUpperCase();
            switch (code) {
                case "SHIFT" -> shiftDays++;
                case "WO"    -> woDays++;
                case "PL"    -> plDays++;
                case "LOP"   -> lopDays++;
                default      -> otherDays++;
            }
        }

        return AttendanceSummaryResponse.builder()
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
                .totalDays(schedules.size())
                .build();
    }

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

        entries.sort(Comparator.comparingInt(DailyAttendanceEntry::getDay));
        return entries;
    }

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