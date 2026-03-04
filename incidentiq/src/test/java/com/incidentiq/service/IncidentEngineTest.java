package com.incidentiq.service;

import com.incidentiq.model.AuditEvent;
import com.incidentiq.model.Incident;
import com.incidentiq.repository.AuditEventRepository;
import com.incidentiq.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.Instant;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IncidentEngineTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @InjectMocks
    private IncidentEngine incidentEngine;

    @Test
    public void testHighErrorRateTriggersIncident() {
        // Given 100 events, 5 of which are 500 errors (5% > 2%)
        AuditEvent errorEvent = new AuditEvent();
        errorEvent.setStatus(500);
        errorEvent.setLatencyMs(100);
        
        AuditEvent successEvent = new AuditEvent();
        successEvent.setStatus(200);
        successEvent.setLatencyMs(100);

        when(auditEventRepository.findByTsBetween(any(), any()))
            .thenReturn(List.of(errorEvent, successEvent, successEvent, successEvent, successEvent));

        // When
        incidentEngine.analyzeHealth();

        // Then
        verify(incidentRepository, atLeastOnce()).save(any(Incident.class));
    }
}
