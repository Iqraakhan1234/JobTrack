package com.jobtrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class JobApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Company is required") private String company;
    @NotBlank(message = "Position is required") private String position;
    private String status = "Applied";
    private String location;
    private String salary;
    private LocalDate appliedDate;
    private LocalDateTime interviewDate;
    @Column(length = 2000) private String notes;

    public JobApplication() {}
    public JobApplication(String company, String position, String status, String location, String salary, LocalDate appliedDate) {
        this.company = company; this.position = position; this.status = status;
        this.location = location; this.salary = salary; this.appliedDate = appliedDate;
    }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getCompany() { return company; } public void setCompany(String v) { this.company = v; }
    public String getPosition() { return position; } public void setPosition(String v) { this.position = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public String getLocation() { return location; } public void setLocation(String v) { this.location = v; }
    public String getSalary() { return salary; } public void setSalary(String v) { this.salary = v; }
    public LocalDate getAppliedDate() { return appliedDate; } public void setAppliedDate(LocalDate v) { this.appliedDate = v; }
    public LocalDateTime getInterviewDate() { return interviewDate; } public void setInterviewDate(LocalDateTime v) { this.interviewDate = v; }
    public String getNotes() { return notes; } public void setNotes(String v) { this.notes = v; }
}
