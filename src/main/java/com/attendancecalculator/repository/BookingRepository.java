package com.attendancecalculator.repository;

import com.attendancecalculator.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("select b from Booking b where b.employee.empId = :employeeId and b.scheduleDate = :date and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)")
    List<Booking> findOverlappingBookings(@Param("employeeId") String employeeId,
                                          @Param("date") LocalDate date,
                                          @Param("slotStart") LocalTime slotStart,
                                          @Param("slotEnd") LocalTime slotEnd);

    @Query("select b from Booking b where b.scheduleDate = :date and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)")
    List<Booking> findBookingsOverlappingSlot(@Param("date") LocalDate date,
                                              @Param("slotStart") LocalTime slotStart,
                                              @Param("slotEnd") LocalTime slotEnd);

    @Query("""
            select b
            from Booking b
            join fetch b.employee e
            where b.scheduleDate = :date
              and e.empId in :employeeIds
              and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)
            """)
    List<Booking> findBookingsOverlappingSlotForEmployees(@Param("date") LocalDate date,
                                                          @Param("slotStart") LocalTime slotStart,
                                                          @Param("slotEnd") LocalTime slotEnd,
                                                          @Param("employeeIds") List<String> employeeIds);

    @Query("SELECT b FROM Booking b JOIN FETCH b.employee e WHERE b.scheduleDate = :date")
    List<Booking> findAllBookingsForDateWithEmployee(@Param("date") LocalDate date);

    @Query("SELECT DISTINCT b.employee.empId FROM Booking b WHERE b.scheduleDate = :date and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)")
    Set<String> findBookedEmployeeIdsOverlappingSlot(@Param("date") LocalDate date,
                                                     @Param("slotStart") LocalTime slotStart,
                                                     @Param("slotEnd") LocalTime slotEnd);

    @Query("select case when count(b) > 0 then true else false end from Booking b where b.employee.empId = :employeeId and b.scheduleDate = :date and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)")
    boolean existsOverlappingBooking(@Param("employeeId") String employeeId,
                                     @Param("date") LocalDate date,
                                     @Param("slotStart") LocalTime slotStart,
                                     @Param("slotEnd") LocalTime slotEnd);

    @Query("""
            select case when count(b) > 0 then true else false end 
            from Booking b 
            where b.employee.empId = :employeeId 
              and b.scheduleDate = :date 
              and not (b.slotEnd <= :slotStart or b.slotStart >= :slotEnd)
              and b.id != :excludeBookingId
            """)
    boolean existsOverlappingBookingExcludingId(@Param("employeeId") String employeeId,
                                                @Param("date") LocalDate date,
                                                @Param("slotStart") LocalTime slotStart,
                                                @Param("slotEnd") LocalTime slotEnd,
                                                @Param("excludeBookingId") Long excludeBookingId);
}