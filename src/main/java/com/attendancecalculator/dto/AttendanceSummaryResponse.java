package com.attendancecalculator.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceSummaryResponse {

    private final String empId;
    private final String employeeName;
    private final String email;
    private final String manager;
    private final String groupName;
    private final String coachName;
    private final String shiftTime;

    private final int shiftDays;

    private final int woDays;

    private final int plDays;

    private final int lopDays;

    private final int otherDays;

    private final int totalDays;
}