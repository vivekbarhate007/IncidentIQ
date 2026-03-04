package com.incidentiq.controller;

import com.incidentiq.model.Incident;
import com.incidentiq.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {
    private final IncidentRepository incidentRepository;

    @GetMapping
    public List<Incident> getIncidents() {
        return incidentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Incident getIncident(@PathVariable String id) {
        return incidentRepository.findById(id).orElseThrow();
    }

    @PostMapping("/{id}/ack")
    public Incident ackIncident(@PathVariable String id) {
        Incident incident = incidentRepository.findById(id).orElseThrow();
        incident.setStatus("ACK");
        return incidentRepository.save(incident);
    }

    @PostMapping("/{id}/resolve")
    public Incident resolveIncident(@PathVariable String id) {
        Incident incident = incidentRepository.findById(id).orElseThrow();
        incident.setStatus("RESOLVED");
        return incidentRepository.save(incident);
    }
}
