package com.attendancecalculator.service;

import com.attendancecalculator.constants.CsvColumnIndex;
import com.attendancecalculator.entity.Employee;
import com.attendancecalculator.entity.EmployeeSchedule;
import com.attendancecalculator.repository.EmployeeRepository;
import com.attendancecalculator.repository.EmployeeScheduleRepository;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.RFC4180Parser;
import com.opencsv.RFC4180ParserBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmployeeCsvService {

    private static final String SHIFT_CODE = "SHIFT";

    private static final DateTimeFormatter TIME_SHORT = DateTimeFormatter.ofPattern("H:mm");
    private static final DateTimeFormatter TIME_LONG  = DateTimeFormatter.ofPattern("H:mm:ss");
    private static final DateTimeFormatter DATE_FMT   = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleRepository employeeScheduleRepository;

    public EmployeeCsvService(EmployeeRepository employeeRepository,
                              EmployeeScheduleRepository employeeScheduleRepository) {
        this.employeeRepository = employeeRepository;
        this.employeeScheduleRepository = employeeScheduleRepository;
    }


    @Transactional
    public int saveEmployeesFromCsv(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        RFC4180Parser parser = new RFC4180ParserBuilder().build();

        try (CSVReader csv = new CSVReaderBuilder(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))
                .withCSVParser(parser)
                .build()) {

            String[] headers = csv.readNext();
            if (headers == null) return 0;

            if (headers[0] != null) headers[0] = headers[0].replace("\uFEFF", "").trim();

            if (headers.length <= CsvColumnIndex.FIRST_SCHEDULE_COLUMN) {
                throw new IllegalArgumentException(
                        "CSV must contain schedule columns starting at index "
                                + CsvColumnIndex.FIRST_SCHEDULE_COLUMN);
            }

            List<String[]> validRows = new ArrayList<>();
            List<String>   empIds    = new ArrayList<>();

            String[] row;
            while ((row = csv.readNext()) != null) {
                if (row.length <= CsvColumnIndex.LANGUAGE) continue;
                String empId = trim(row[CsvColumnIndex.EMP_ID]);
                if (empId.isBlank()) continue;
                validRows.add(row);
                empIds.add(empId);
            }

            if (empIds.isEmpty()) return 0;

            Map<String, Employee> existingEmployees = new HashMap<>();
            employeeRepository.findAllById(empIds)
                    .forEach(e -> existingEmployees.put(e.getEmpId(), e));

            Map<String, EmployeeSchedule> existingSchedules = new HashMap<>();
            employeeScheduleRepository.findAllByEmployeeEmpIdIn(empIds)
                    .forEach(es -> existingSchedules.put(
                            key(es.getEmployee().getEmpId(), es.getScheduleDate()), es));

            List<Employee>         employeesToSave  = new ArrayList<>(validRows.size());
            List<EmployeeSchedule> schedulesToSave  = new ArrayList<>();

            for (String[] r : validRows) {
                String empId = trim(r[CsvColumnIndex.EMP_ID]);

                Employee employee = existingEmployees.get(empId);
                if (employee == null) {
                    employee = new Employee();
                    employee.markNew();
                }

                employee.setEmpId(empId);
                employee.setStatus(trim(r[CsvColumnIndex.STATUS]));
                employee.setEmail(trim(r[CsvColumnIndex.EMAIL]));
                employee.setCoachName(trim(r[CsvColumnIndex.COACH_NAME]));
                employee.setTlEmail(trim(r[CsvColumnIndex.TL_EMAIL]));
                employee.setManager(trim(r[CsvColumnIndex.MANAGER]));
                employee.setShiftTime(trim(r[CsvColumnIndex.SHIFT_TIME]));
                employee.setGroupName(trim(r[CsvColumnIndex.GROUP_NAME]));
                employee.setSubGroup(trim(r[CsvColumnIndex.SUB_GROUP]));
                employee.setGender(trim(r[CsvColumnIndex.GENDER]));
                employee.setLanguage(trim(r[CsvColumnIndex.LANGUAGE]));

                employeesToSave.add(employee);
                collectSchedules(employee, r, headers, existingSchedules, schedulesToSave);
            }

            employeeRepository.saveAll(employeesToSave);
            employeeScheduleRepository.saveAll(schedulesToSave);

            return employeesToSave.size();

        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "Failed to process CSV file: " + ex.getMessage(), ex);
        }
    }

    private void collectSchedules(
            Employee employee,
            String[] row,
            String[] headers,
            Map<String, EmployeeSchedule> existingSchedules,
            List<EmployeeSchedule> out) {

        for (int col = CsvColumnIndex.FIRST_SCHEDULE_COLUMN;
             col < headers.length && col < row.length;
             col++) {

            String header = trim(headers[col]);
            String cell   = trim(row[col]);
            if (header.isBlank() || cell.isBlank()) continue;

            LocalDate date;
            try {
                date = LocalDate.parse(header, DATE_FMT);
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException(
                        "Invalid date in header column " + col + ": \"" + header + "\"", ex);
            }

            EmployeeSchedule schedule =
                    existingSchedules.getOrDefault(key(employee.getEmpId(), date),
                            new EmployeeSchedule());

            schedule.setEmployee(employee);
            schedule.setScheduleDate(date);

            String upper = cell.toUpperCase();

            if (upper.equals("WO") || upper.equals("PL") || upper.equals("LOP")) {
                schedule.setShiftCode(upper);
                schedule.setShiftStart(null);
                schedule.setShiftEnd(null);
                schedule.setBreakStart(null);
                schedule.setBreakEnd(null);

            } else if (cell.contains("-")) {
                String[] parts = cell.split("-", 2);
                if (parts.length == 2) {
                    LocalTime start = parseTime(parts[0].trim(), col, cell);
                    LocalTime end   = parseTime(parts[1].trim(), col, cell);
                    if (start.isAfter(end)) {
                        throw new IllegalArgumentException(
                                "Shift start is after shift end: \"" + cell + "\"");
                    }
                    schedule.setShiftCode(SHIFT_CODE);
                    schedule.setShiftStart(start);
                    schedule.setShiftEnd(end);
                }
            } else {
                continue;
            }

            out.add(schedule);
        }
    }

    private static String key(String empId, LocalDate date) {
        return empId + "::" + date;
    }

    private static String trim(String v) {
        return v == null ? "" : v.trim();
    }

    private static LocalTime parseTime(String raw, int col, String cell) {
        try {
            return LocalTime.parse(raw, TIME_SHORT);
        } catch (DateTimeParseException e1) {
            try {
                return LocalTime.parse(raw, TIME_LONG);
            } catch (DateTimeParseException e2) {
                throw new IllegalArgumentException(
                        "Invalid time \"" + raw + "\" in column " + col
                                + ", cell \"" + cell + "\"");
            }
        }
    }
}