package com.attendancecalculator.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
public class Employee implements Persistable<String> {

    @Id
    @Column(name = "emp_id", nullable = false)
    private String empId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "email")
    private String email;

    @Column(name = "manager")
    private String manager;

    @Column(name = "coach_name")
    private String coachName;

    @Column(name = "group_name")
    private String groupName;

    @Column(name = "sub_group")
    private String subGroup;

    @Column(name = "language")
    private String language;

    @Column(name = "status")
    private String status;

    @Column(name = "gender")
    private String gender;

    @Column(name = "tl_email")
    private String tlEmail;

    @Column(name = "shift_time")
    private String shiftTime;


    @Transient
    private boolean isNew = false;

    public Employee(String empId, String employeeName, String email, String manager,
                    String coachName, String groupName, String subGroup,
                    String language, String status, String gender,
                    String tlEmail, String shiftTime) {
        this.empId = empId;
        this.employeeName = employeeName;
        this.email = email;
        this.manager = manager;
        this.coachName = coachName;
        this.groupName = groupName;
        this.subGroup = subGroup;
        this.language = language;
        this.status = status;
        this.gender = gender;
        this.tlEmail = tlEmail;
        this.shiftTime = shiftTime;
    }

    public void markNew() {
        this.isNew = true;
    }

    @Override
    public String getId() {
        return empId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }
}
