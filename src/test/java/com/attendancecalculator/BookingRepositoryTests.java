package com.attendancecalculator;

import com.attendancecalculator.entity.Booking;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.repository.BookingRepository;
import com.attendancecalculator.repository.EmployeeRepository;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class BookingRepositoryTests {

    @Autowired
    BookingRepository bookingRepository;

    @Autowired
    EmployeeRepository employeeRepository;

    @Autowired
    EmployeeScheduleRepository scheduleRepository;

    @Test
    void findOverlappingBookings_detectsOverlap() {
        LocalDate date = LocalDate.now();

        Employee e = new Employee("E1", "Test User", "t@test.com", "mgr", "coach", "group", "sub", "lang", "ACTIVE", "M", "tl@test.com", "09:00-17:00");
        e.markNew();
        employeeRepository.save(e);

        EmployeeSchedule es = new EmployeeSchedule(null, e, date, "S1", LocalTime.of(9,0), LocalTime.of(17,0), null, null);
        scheduleRepository.save(es);

        Booking b = new Booking(null, e, date, LocalTime.of(10,0), LocalTime.of(10,15), Instant.now(), "note");
        bookingRepository.save(b);

        List<Booking> overlapping = bookingRepository.findOverlappingBookings("E1", date, LocalTime.of(10,0), LocalTime.of(10,15));
        assertThat(overlapping).isNotEmpty();

        List<Booking> nonOverlapping = bookingRepository.findOverlappingBookings("E1", date, LocalTime.of(10,15), LocalTime.of(10,30));
        assertThat(nonOverlapping).isEmpty();
    }

    @Test
    void findBookedEmployeeIdsOverlappingSlot_onlyReturnsEmployeesBookedInRequestedSlot() {
        LocalDate date = LocalDate.now();

        Employee e = new Employee("E1", "Test User", "t@test.com", "mgr", "coach", "group", "sub", "lang", "ACTIVE", "M", "tl@test.com", "09:00-17:00");
        e.markNew();
        employeeRepository.save(e);

        EmployeeSchedule es = new EmployeeSchedule(null, e, date, "S1", LocalTime.of(9, 0), LocalTime.of(17, 0), null, null);
        scheduleRepository.save(es);

        Booking b = new Booking(null, e, date, LocalTime.of(10, 0), LocalTime.of(10, 15), Instant.now(), "note");
        bookingRepository.save(b);

        Set<String> overlapping = bookingRepository.findBookedEmployeeIdsOverlappingSlot(
                date, LocalTime.of(10, 0), LocalTime.of(10, 15));
        assertThat(overlapping).containsExactly("E1");

        Set<String> nonOverlapping = bookingRepository.findBookedEmployeeIdsOverlappingSlot(
                date, LocalTime.of(10, 15), LocalTime.of(10, 30));
        assertThat(nonOverlapping).isEmpty();
    }
}
