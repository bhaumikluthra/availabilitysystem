package com.attendancecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingRequest {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String additionalNotes;
}