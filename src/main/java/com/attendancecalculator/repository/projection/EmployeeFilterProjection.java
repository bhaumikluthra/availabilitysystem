package com.attendancecalculator.repository.projection;

public interface EmployeeFilterProjection {
    String getManager();
    String getGroupName();
    String getCoachName();
    String getStatus();
    String getGender();
    String getShiftTime();
}