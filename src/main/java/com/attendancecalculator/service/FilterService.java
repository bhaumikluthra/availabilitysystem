package com.attendancecalculator.service;

import com.attendancecalculator.dto.FilterResponse;
import com.attendancecalculator.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FilterService {

    private final EmployeeRepository employeeRepository;

    public FilterService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public FilterResponse getFilters() {
        return FilterResponse.builder()
                .managers(employeeRepository.findDistinctManagers())
                .groups(employeeRepository.findDistinctGroups())
                .coaches(employeeRepository.findDistinctCoaches())
                .statuses(employeeRepository.findDistinctStatus())
                .genders(employeeRepository.findDistinctGenders())
                .shiftTimes(employeeRepository.findDistinctShiftTimes())
                .build();
    }
}