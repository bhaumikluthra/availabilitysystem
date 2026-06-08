package com.attendancecalculator.repository;

import com.attendancecalculator.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;


public interface EmployeeRepository extends JpaRepository<Employee, String> {

    @Query("""
            SELECT DISTINCT e.manager
            FROM Employee e
            WHERE e.manager IS NOT NULL AND e.manager <> ''
            ORDER BY e.manager
            """)
    List<String> findDistinctManagers();

    @Query("""
            SELECT DISTINCT e.groupName
            FROM Employee e
            WHERE e.groupName IS NOT NULL AND e.groupName <> ''
            ORDER BY e.groupName
            """)
    List<String> findDistinctGroups();

    @Query("""
            SELECT DISTINCT e.coachName
            FROM Employee e
            WHERE e.coachName IS NOT NULL AND e.coachName <> ''
            ORDER BY e.coachName
            """)
    List<String> findDistinctCoaches();

    @Query("""
            SELECT DISTINCT e.status
            FROM Employee e
            WHERE e.status IS NOT NULL AND e.status <> ''
            ORDER BY e.status
            """)
    List<String> findDistinctStatus();

    @Query("""
            SELECT DISTINCT e.gender
            FROM Employee e
            WHERE e.gender IS NOT NULL AND e.gender <> ''
            ORDER BY e.gender
            """)
    List<String> findDistinctGenders();

    @Query("""
            SELECT DISTINCT e.shiftTime
            FROM Employee e
            WHERE e.shiftTime IS NOT NULL AND e.shiftTime <> ''
            ORDER BY e.shiftTime
            """)
    List<String> findDistinctShiftTimes();
}