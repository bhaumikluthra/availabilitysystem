package com.attendancecalculator.repository;

import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, Long> {

    Optional<EmployeeSchedule> findByEmployeeAndScheduleDate(
            Employee employee,
            LocalDate scheduleDate
    );

    @Query("""
            SELECT es
            FROM EmployeeSchedule es
            JOIN FETCH es.employee e
            WHERE e.empId IN :empIds
            """)
    List<EmployeeSchedule> findAllByEmployeeEmpIdIn(
            @Param("empIds") Collection<String> empIds
    );

    @Query("""
            SELECT es
            FROM EmployeeSchedule es
            JOIN FETCH es.employee e
            WHERE es.scheduleDate = :scheduleDate
              AND (:manager   IS NULL OR e.manager   = :manager)
              AND (:groupName IS NULL OR e.groupName = :groupName)
              AND (:coachName IS NULL OR e.coachName = :coachName)
              AND (:status    IS NULL OR e.status    = :status)
              AND (:gender    IS NULL OR e.gender    = :gender)
              AND (:shiftTime IS NULL OR e.shiftTime = :shiftTime)
            """)
    List<EmployeeSchedule> findSchedulesByFilters(
            @Param("scheduleDate") LocalDate scheduleDate,
            @Param("manager")     String manager,
            @Param("groupName")   String groupName,
            @Param("coachName")   String coachName,
            @Param("status")      String status,
            @Param("gender")      String gender,
            @Param("shiftTime")   String shiftTime
    );


    @Modifying
    @Query("""
            UPDATE EmployeeSchedule es
            SET es.breakStart = :breakStart,
                es.breakEnd   = :breakEnd
            WHERE es.shiftStart IS NOT NULL
            """)
    int updateBreakTimeForAll(
            @Param("breakStart") LocalTime breakStart,
            @Param("breakEnd")   LocalTime breakEnd
    );

    @Query("""
            SELECT es
            FROM EmployeeSchedule es
            JOIN FETCH es.employee e
            WHERE es.scheduleDate >= :fromDate
              AND es.scheduleDate <= :toDate
              AND (:empId IS NULL OR e.empId = :empId)
            ORDER BY e.empId, es.scheduleDate
            """)
    List<EmployeeSchedule> findAllByDateRangeAndEmployee(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate")   LocalDate toDate,
            @Param("empId")    String empId
    );

    @Modifying
    @Query("""
        UPDATE EmployeeSchedule es
        SET es.breakStart = :breakStart,
            es.breakEnd   = :breakEnd
        WHERE es.shiftStart IS NOT NULL
          AND es.employee.empId IN :empIds
        """)
    int updateBreakTimeForEmployees(
            @Param("breakStart") LocalTime breakStart,
            @Param("breakEnd")   LocalTime breakEnd,
            @Param("empIds")     Collection<String> empIds
    );
}