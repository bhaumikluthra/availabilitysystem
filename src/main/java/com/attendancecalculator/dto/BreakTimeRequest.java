package com.attendancecalculator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class BreakTimeRequest {

    @NotNull(message = "is required")
    private LocalTime breakStart;

    @NotNull(message = "is required")
    private LocalTime breakEnd;
}