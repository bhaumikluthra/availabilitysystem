package com.attendancecalculator.controller;

import com.attendancecalculator.dto.AttendanceSummaryResponse;
import com.attendancecalculator.dto.DailyAttendanceEntry;
import com.attendancecalculator.service.AttendanceSummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:5173")
public class AttendanceSummaryController {

    private final AttendanceSummaryService summaryService;

    public AttendanceSummaryController(AttendanceSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping("/summary")
    public ResponseEntity<List<AttendanceSummaryResponse>> getSummary(
            @RequestParam String month,
            @RequestParam(required = false) String empId) {

        YearMonth yearMonth = parseMonth(month);
        return ResponseEntity.ok(summaryService.getSummary(yearMonth, empId));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<DailyAttendanceEntry>> getDailyBreakdown(
            @RequestParam String month,
            @RequestParam String empId) {

        YearMonth yearMonth = parseMonth(month);
        return ResponseEntity.ok(summaryService.getDailyBreakdown(yearMonth, empId));
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(
                    "Invalid month format. Expected yyyy-MM, got: " + month);
        }
    }
}