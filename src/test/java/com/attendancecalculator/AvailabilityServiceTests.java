package com.attendancecalculator;

import com.attendancecalculator.dto.AvailabilityFilterRequest;
import com.attendancecalculator.dto.AvailabilitySlotResponse;
import com.attendancecalculator.entity.Booking;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.repository.BookingRepository;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import com.attendancecalculator.service.AvailabilityService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AvailabilityServiceTests {

    @Test
    void getAvailability_fetchesBookingsOnceForWholeRangeAndCalculatesSlotsInMemory() {
        EmployeeScheduleRepository scheduleRepository = mock(EmployeeScheduleRepository.class);
        BookingRepository bookingRepository = mock(BookingRepository.class);
        AvailabilityService availabilityService = new AvailabilityService(scheduleRepository, bookingRepository);

        LocalDate date = LocalDate.of(2026, 6, 6);
        Employee employeeOne = new Employee("E1", "Employee One", "e1@test.com", "mgr", "coach", "group", "sub", "lang", "ACTIVE", "M", "tl@test.com", "09:00-17:00");
        Employee employeeTwo = new Employee("E2", "Employee Two", "e2@test.com", "mgr", "coach", "group", "sub", "lang", "ACTIVE", "F", "tl@test.com", "09:00-17:00");

        EmployeeSchedule scheduleOne = new EmployeeSchedule(null, employeeOne, date, "S1", LocalTime.of(9, 0), LocalTime.of(17, 0), null, null);
        EmployeeSchedule scheduleTwo = new EmployeeSchedule(null, employeeTwo, date, "S1", LocalTime.of(9, 0), LocalTime.of(17, 0), null, null);

        when(scheduleRepository.findSchedulesByFilters(date, null, null, null, null, null, null))
                .thenReturn(List.of(scheduleOne, scheduleTwo));

        Booking booking = new Booking(null, employeeOne, date, LocalTime.of(10, 0), LocalTime.of(10, 15), Instant.now(), "note");
        when(bookingRepository.findBookingsOverlappingSlotForEmployees(
                date, LocalTime.of(10, 0), LocalTime.of(10, 30), List.of("E1", "E2")))
                .thenReturn(List.of(booking));

        AvailabilityFilterRequest request = new AvailabilityFilterRequest();
        request.setDate(date);
        request.setFromTime(LocalTime.of(10, 0));
        request.setToTime(LocalTime.of(10, 30));

        List<AvailabilitySlotResponse> availability = availabilityService.getAvailability(request);

        assertThat(availability).extracting(AvailabilitySlotResponse::getSlot)
                .containsExactly("10:00-10:15", "10:15-10:30");
        assertThat(availability).extracting(AvailabilitySlotResponse::getAvailableAgents)
                .containsExactly(1, 2);

        verify(bookingRepository).findBookingsOverlappingSlotForEmployees(
                date, LocalTime.of(10, 0), LocalTime.of(10, 30), List.of("E1", "E2"));
        verify(bookingRepository, never()).findBookedEmployeeIdsOverlappingSlot(any(), any(), any());
        verify(bookingRepository, never()).findBookingsOverlappingSlot(any(), any(), any());
    }

    @Test
    void getAvailability_doesNotQueryBookingsWhenNoSchedulesMatch() {
        EmployeeScheduleRepository scheduleRepository = mock(EmployeeScheduleRepository.class);
        BookingRepository bookingRepository = mock(BookingRepository.class);
        AvailabilityService availabilityService = new AvailabilityService(scheduleRepository, bookingRepository);

        LocalDate date = LocalDate.of(2026, 6, 6);
        when(scheduleRepository.findSchedulesByFilters(date, null, null, null, null, null, null))
                .thenReturn(List.of());

        AvailabilityFilterRequest request = new AvailabilityFilterRequest();
        request.setDate(date);
        request.setFromTime(LocalTime.of(10, 0));
        request.setToTime(LocalTime.of(10, 30));

        List<AvailabilitySlotResponse> availability = availabilityService.getAvailability(request);

        assertThat(availability).extracting(AvailabilitySlotResponse::getAvailableAgents)
                .containsExactly(0, 0);
        verify(bookingRepository, never()).findBookingsOverlappingSlotForEmployees(any(), any(), any(), anyList());
    }
}
