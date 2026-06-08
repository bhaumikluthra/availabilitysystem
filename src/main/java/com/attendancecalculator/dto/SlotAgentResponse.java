package com.attendancecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SlotAgentResponse {

    private final String empId;
    private final String email;
    private final String coachName;
    private final String groupName;
    private final String shiftTime;
    private final String gender;
    private final String status;
}