package com.attendancecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AvailabilitySlotResponse {

    private final String slot;
    private final int availableAgents;
}