package com.attendancecalculator.controller;

import com.attendancecalculator.service.EmployeeCsvService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:5173")
public class FileUploadController {

    private final EmployeeCsvService employeeCsvService;

    public FileUploadController(EmployeeCsvService employeeCsvService) {
        this.employeeCsvService = employeeCsvService;
    }


    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "breakStart", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime breakStart,
            @RequestParam(value = "breakEnd",   required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime breakEnd) {

        int saved = employeeCsvService.saveEmployeesFromCsv(file, breakStart, breakEnd);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(String.format("Successfully saved %d employee(s)", saved));
    }
}