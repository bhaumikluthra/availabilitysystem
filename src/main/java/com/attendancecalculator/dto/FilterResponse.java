package com.attendancecalculator.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FilterResponse {

    private final List<String> managers;
    private final List<String> groups;
    private final List<String> coaches;
    private final List<String> statuses;
    private final List<String> genders;
    private final List<String> shiftTimes;
}