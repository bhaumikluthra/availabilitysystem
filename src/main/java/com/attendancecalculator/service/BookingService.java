package com.attendancecalculator.service;

import com.attendancecalculator.dto.BookingRequest;
import com.attendancecalculator.dto.BookingResponse;
import com.attendancecalculator.entity.Booking;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.exception.BookingConflictException;
import com.attendancecalculator.repository.BookingRepository;
import com.attendancecalculator.repository.EmployeeRepository;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleRepository scheduleRepository;

    @Autowired
    public BookingService(BookingRepository bookingRepository,
                          EmployeeRepository employeeRepository,
                          EmployeeScheduleRepository scheduleRepository) {
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {

        if (request.getSlotEnd().isBefore(request.getSlotStart())
                || request.getSlotEnd().equals(request.getSlotStart())) {
            throw new IllegalArgumentException("slotEnd must be after slotStart");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Employee not found: " + request.getEmployeeId()));

        EmployeeSchedule schedule = scheduleRepository
                .findByEmployeeAndScheduleDate(employee, request.getScheduleDate())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No schedule for employee on date"));

        if (schedule.getShiftStart() == null || schedule.getShiftEnd() == null) {
            throw new IllegalArgumentException(
                    "Employee is not scheduled on the requested date");
        }

        if (request.getSlotStart().isBefore(schedule.getShiftStart())
                || request.getSlotEnd().isAfter(schedule.getShiftEnd())) {
            throw new IllegalArgumentException(
                    "Requested slot is outside employee shift hours");
        }

        if (schedule.getBreakStart() != null && schedule.getBreakEnd() != null) {
            boolean overlapsBreak =
                    request.getSlotStart().isBefore(schedule.getBreakEnd())
                            && request.getSlotEnd().isAfter(schedule.getBreakStart());
            if (overlapsBreak) {
                throw new IllegalArgumentException(
                        "Requested slot overlaps employee break time");
            }
        }

        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                request.getEmployeeId(),
                request.getScheduleDate(),
                request.getSlotStart(),
                request.getSlotEnd());

        if (hasConflict) {
            throw new BookingConflictException(
                    "Employee already has a booking overlapping the requested slot");
        }

        Booking booking = new Booking();
        booking.setEmployee(employee);
        booking.setScheduleDate(request.getScheduleDate());
        booking.setSlotStart(request.getSlotStart());
        booking.setSlotEnd(request.getSlotEnd());
        booking.setNotes(request.getNotes());

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    /**
     * Returns all bookings for the given date sorted by slot start time.
     * Uses the existing FETCH JOIN query so employee data is loaded in one query.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsForDate(LocalDate date) {

        if (date == null) {
            throw new IllegalArgumentException("date is required");
        }

        return bookingRepository
                .findAllBookingsForDateWithEmployee(date)
                .stream()
                .sorted(Comparator.comparing(Booking::getSlotStart))
                .map(this::toResponse)
                .toList();
    }


    private BookingResponse toResponse(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .employeeId(b.getEmployee().getEmpId())
                .employeeName(b.getEmployee().getEmployeeName())
                .scheduleDate(b.getScheduleDate())
                .slotStart(b.getSlotStart())
                .slotEnd(b.getSlotEnd())
                .createdAt(b.getCreatedAt())
                .notes(b.getNotes())
                .build();
    }
}