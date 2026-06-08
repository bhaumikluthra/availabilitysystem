package com.attendancecalculator.controller;

import com.attendancecalculator.dto.AvailabilityFilterRequest;
import com.attendancecalculator.dto.AvailabilitySlotResponse;
import com.attendancecalculator.dto.SlotAgentResponse;
import com.attendancecalculator.dto.SlotAgentsRequest;
import com.attendancecalculator.service.AvailabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @PostMapping
    public ResponseEntity<List<AvailabilitySlotResponse>> getAvailability(
            @Valid @RequestBody AvailabilityFilterRequest request) {

        return ResponseEntity.ok(availabilityService.getAvailability(request));
    }

    @PostMapping("/agents")
    public ResponseEntity<List<SlotAgentResponse>> getAgentsForSlot(
            @Valid @RequestBody SlotAgentsRequest request) {

        return ResponseEntity.ok(availabilityService.getAgentsForSlot(request));
    }

}