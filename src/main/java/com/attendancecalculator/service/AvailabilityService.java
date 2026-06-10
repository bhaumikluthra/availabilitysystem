package com.attendancecalculator.service;

import com.attendancecalculator.dto.AvailabilityFilterRequest;
import com.attendancecalculator.dto.AvailabilitySlotResponse;
import com.attendancecalculator.dto.SlotAgentResponse;
import com.attendancecalculator.dto.SlotAgentsRequest;
import com.attendancecalculator.entity.Booking;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import com.attendancecalculator.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AvailabilityService {

    private static final int SLOT_DURATION_MINUTES = 15;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final BookingRepository bookingRepository;

    public AvailabilityService(EmployeeScheduleRepository employeeScheduleRepository,
                               BookingRepository bookingRepository) {
        this.employeeScheduleRepository = employeeScheduleRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailability(AvailabilityFilterRequest request) {

        validateRequest(request);

        List<EmployeeSchedule> schedules = fetchSchedules(request.getDate(),
                request.getManager(), request.getGroupName(), request.getCoachName(),
                request.getStatus(), request.getGender(), request.getShiftTime());

        List<LocalTime> slotBoundaries = buildSlotBoundaries(request.getFromTime(), request.getToTime());
        int slotCount = slotBoundaries.size() - 1;
        int[] availableCounts = new int[slotCount];

        if (schedules.isEmpty()) {
            return buildAvailabilityResponse(slotBoundaries, availableCounts);
        }

        Map<String, List<Booking>> bookingsByEmployee = fetchBookingsByEmployee(
                request.getDate(), request.getFromTime(), request.getToTime(), schedules);

        for (EmployeeSchedule s : schedules) {
            String employeeId = s.getEmployee().getEmpId();
            List<Booking> employeeBookings = bookingsByEmployee.getOrDefault(employeeId, List.of());

            boolean[] unavailableSlots = new boolean[slotCount];
            for (Booking b : employeeBookings) {
                int startIdx = getSlotIndex(request.getFromTime(), b.getSlotStart(), false);
                int endIdx = getSlotIndex(request.getFromTime(), b.getSlotEnd(), true);

                startIdx = Math.max(0, startIdx);
                endIdx = Math.min(slotCount - 1, endIdx);

                for (int i = startIdx; i <= endIdx; i++) {
                    unavailableSlots[i] = true;
                }
            }

            for (int i = 0; i < slotCount; i++) {
                if (!unavailableSlots[i]) {
                    LocalTime slotStart = slotBoundaries.get(i);
                    LocalTime slotEnd = slotBoundaries.get(i + 1);

                    if (isAvailableInSlot(s, slotStart, slotEnd)) {
                        availableCounts[i]++;
                    }
                }
            }
        }

        return buildAvailabilityResponse(slotBoundaries, availableCounts);
    }

    private int getSlotIndex(LocalTime baseTime, LocalTime targetTime, boolean isEnd) {
        long minutes = java.time.temporal.ChronoUnit.MINUTES.between(baseTime, targetTime);

        if (isEnd) {
            minutes -= 1;
        }

        return (int) Math.floorDiv(minutes, SLOT_DURATION_MINUTES);
    }

    @Transactional(readOnly = true)
    public List<SlotAgentResponse> getAgentsForSlot(SlotAgentsRequest request) {

        if (request.getDate() == null) {
            throw new IllegalArgumentException("date is required");
        }
        if (request.getSlotStart() == null || request.getSlotEnd() == null) {
            throw new IllegalArgumentException("slotStart and slotEnd are required");
        }
        if (!request.getSlotStart().isBefore(request.getSlotEnd())) {
            throw new IllegalArgumentException("slotStart must be before slotEnd");
        }

        List<EmployeeSchedule> schedules = fetchSchedules(request.getDate(),
                request.getManager(), request.getGroupName(), request.getCoachName(),
                request.getStatus(), request.getGender(), request.getShiftTime());

        Set<String> bookedEmployeeIds = fetchBookedEmployeeIds(
                request.getDate(), request.getSlotStart(), request.getSlotEnd(), schedules);

        List<SlotAgentResponse> agents = new ArrayList<>();

        for (EmployeeSchedule s : schedules) {
            if (bookedEmployeeIds.contains(s.getEmployee().getEmpId())) continue;
            if (!isAvailableInSlot(s, request.getSlotStart(), request.getSlotEnd())) continue;

            Employee e = s.getEmployee();
            agents.add(new SlotAgentResponse(
                    e.getEmpId(),
                    e.getEmail(),
                    e.getCoachName(),
                    e.getGroupName(),
                    e.getShiftTime(),
                    e.getGender(),
                    e.getStatus()
            ));
        }

        return agents;
    }

    private List<EmployeeSchedule> fetchSchedules(LocalDate date, String manager,
                                                  String groupName, String coachName,
                                                  String status, String gender,
                                                  String shiftTime) {
        return employeeScheduleRepository.findSchedulesByFilters(
                date, manager, groupName, coachName, status, gender, shiftTime);
    }

    private Map<String, List<Booking>> fetchBookingsByEmployee(LocalDate date, LocalTime from,
                                                               LocalTime to,
                                                               List<EmployeeSchedule> schedules) {
        List<String> employeeIds = schedules.stream()
                .map(s -> s.getEmployee().getEmpId())
                .toList();

        List<Booking> bookings = bookingRepository.findOverlapsByEmployeeList(
                date, from, to, employeeIds);

        Map<String, List<Booking>> bookingsByEmployee = new HashMap<>();
        for (Booking booking : bookings) {
            String employeeId = booking.getEmployee().getEmpId();
            bookingsByEmployee.computeIfAbsent(employeeId, ignored -> new ArrayList<>()).add(booking);
        }
        return bookingsByEmployee;
    }

    private Set<String> fetchBookedEmployeeIds(LocalDate date, LocalTime from, LocalTime to,
                                               List<EmployeeSchedule> schedules) {
        if (schedules.isEmpty()) {
            return Set.of();
        }

        return fetchBookingsByEmployee(date, from, to, schedules).keySet();
    }

    private List<AvailabilitySlotResponse> buildAvailabilityResponse(List<LocalTime> slotBoundaries,
                                                                     int[] availableCounts) {
        List<AvailabilitySlotResponse> slots = new ArrayList<>(availableCounts.length);
        for (int i = 0; i < availableCounts.length; i++) {
            slots.add(new AvailabilitySlotResponse(
                    formatSlot(slotBoundaries.get(i), slotBoundaries.get(i + 1)),
                    availableCounts[i]
            ));
        }
        return slots;
    }

    private List<LocalTime> buildSlotBoundaries(LocalTime from, LocalTime to) {
        List<LocalTime> boundaries = new ArrayList<>();
        LocalTime current = from;
        while (current.isBefore(to)) {
            boundaries.add(current);
            LocalTime next = current.plusMinutes(SLOT_DURATION_MINUTES);
            current = next.isAfter(to) ? to : next;
        }
        boundaries.add(to);
        return boundaries;
    }

    private boolean isAvailableInSlot(EmployeeSchedule s,
                                      LocalTime slotStart, LocalTime slotEnd) {
        if (s.getShiftStart() == null || s.getShiftEnd() == null) {
            return false;
        }

        boolean shiftCoversSlot = s.getShiftStart().isBefore(slotEnd)
                && s.getShiftEnd().isAfter(slotStart);

        if (!shiftCoversSlot) return false;

        if (s.getBreakStart() != null && s.getBreakEnd() != null) {
            boolean breakOverlapsSlot = s.getBreakStart().isBefore(slotEnd)
                    && s.getBreakEnd().isAfter(slotStart);
            if (breakOverlapsSlot) return false;
        }

        return true;
    }

    private void validateRequest(AvailabilityFilterRequest request) {
        if (request.getDate() == null) {
            throw new IllegalArgumentException("date is required");
        }
        if (request.getFromTime() == null || request.getToTime() == null) {
            throw new IllegalArgumentException("fromTime and toTime are required");
        }
        if (!request.getFromTime().isBefore(request.getToTime())) {
            throw new IllegalArgumentException("fromTime must be before toTime");
        }
    }

    private String formatSlot(LocalTime start, LocalTime end) {
        return start.format(TIME_FORMATTER) + "-" + end.format(TIME_FORMATTER);
    }
}
