package com.jobtrack.repo;

import com.jobtrack.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {}
