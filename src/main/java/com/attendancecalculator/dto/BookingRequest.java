package com.attendancecalculator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @NotBlank
    private String employeeId;

    @NotNull
    private LocalDate scheduleDate;

    @NotNull
    private LocalTime slotStart;

    @NotNull
    private LocalTime slotEnd;

    private String notes;
}
