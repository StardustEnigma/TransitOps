package com.transitops_backend.controller;

import com.transitops_backend.dto.DashboardKpiResponse;
import com.transitops_backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ReportService reportService;

    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiResponse> getDashboardKpis() {
        return ResponseEntity.ok(reportService.getDashboardKpis());
    }
}
