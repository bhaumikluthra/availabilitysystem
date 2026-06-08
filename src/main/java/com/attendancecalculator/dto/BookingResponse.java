package com.attendancecalculator.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
public class BookingResponse {

    private final Long       id;
    private final String     employeeId;
    private final String     employeeName;
    private final LocalDate  scheduleDate;
    private final LocalTime  slotStart;
    private final LocalTime  slotEnd;
    private final Instant    createdAt;
    private final String     notes;
}