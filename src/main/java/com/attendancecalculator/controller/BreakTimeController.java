package com.attendancecalculator.controller;

import com.attendancecalculator.dto.BreakTimeRequest;
import com.attendancecalculator.service.BreakTimeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/break-times")
public class BreakTimeController {

    private final BreakTimeService breakTimeService;

    public BreakTimeController(BreakTimeService breakTimeService) {
        this.breakTimeService = breakTimeService;
    }

    @PutMapping
    public ResponseEntity<String> setBreakTime(
            @Valid @RequestBody BreakTimeRequest request) {

        int updated = breakTimeService.setBreakTimeForAllSchedules(
                request.getBreakStart(),
                request.getBreakEnd()
        );

        return ResponseEntity.ok(
                String.format("Break time set successfully for %d schedule(s)", updated));
    }

}