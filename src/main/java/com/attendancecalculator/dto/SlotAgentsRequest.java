package com.attendancecalculator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class SlotAgentsRequest {

    @NotNull(message = "is required")
    private LocalDate date;

    @NotNull(message = "is required")
    private LocalTime slotStart;

    @NotNull(message = "is required")
    private LocalTime slotEnd;

    private String manager;
    private String groupName;
    private String coachName;
    private String status;
    private String gender;
    private String shiftTime;
}