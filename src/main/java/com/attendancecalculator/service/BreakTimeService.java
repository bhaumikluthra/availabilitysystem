package com.attendancecalculator.service;

import com.attendancecalculator.repository.EmployeeScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Collection;

@Service
public class BreakTimeService {

    private final EmployeeScheduleRepository employeeScheduleRepository;

    public BreakTimeService(EmployeeScheduleRepository employeeScheduleRepository) {
        this.employeeScheduleRepository = employeeScheduleRepository;
    }

    @Transactional
    public int setBreakTimeForAllSchedules(LocalTime breakStart, LocalTime breakEnd) {

        if (breakStart == null || breakEnd == null) {
            throw new IllegalArgumentException("breakStart and breakEnd must not be null");
        }

        if (breakStart.isAfter(breakEnd)) {
            throw new IllegalArgumentException(
                    "Break start time must not be after break end time");
        }

        return employeeScheduleRepository.updateBreakTimeForAll(breakStart, breakEnd);
    }

    @Transactional
    public int setBreakTimeForEmployees(LocalTime breakStart, LocalTime breakEnd,
                                        Collection<String> empIds) {
        if (breakStart == null || breakEnd == null)
            throw new IllegalArgumentException("breakStart and breakEnd must not be null");
        if (breakStart.isAfter(breakEnd))
            throw new IllegalArgumentException("Break start must not be after break end");
        if (empIds == null || empIds.isEmpty()) return 0;

        return employeeScheduleRepository.updateBreakTimeForEmployees(breakStart, breakEnd, empIds);
    }

}