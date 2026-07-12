package com.transitops_backend.controller;

import com.transitops_backend.dto.FuelEfficiencyReport;
import com.transitops_backend.dto.OperationalCostReport;
import com.transitops_backend.dto.RoiReport;
import com.transitops_backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/fuel-efficiency")
    public ResponseEntity<List<FuelEfficiencyReport>> getFuelEfficiencyReport() {
        return ResponseEntity.ok(reportService.getFuelEfficiencyReport());
    }

    @GetMapping("/operational-cost")
    public ResponseEntity<List<OperationalCostReport>> getOperationalCostReport() {
        return ResponseEntity.ok(reportService.getOperationalCostReport());
    }

    @GetMapping("/roi")
    public ResponseEntity<List<RoiReport>> getRoiReport() {
        return ResponseEntity.ok(reportService.getRoiReport());
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportReportsCsv() {
        String csvData = reportService.generateReportsCsv();
        byte[] csvBytes = csvData.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fleet_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
